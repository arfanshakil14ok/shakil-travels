import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { createAdjustmentLedgerEntry } from '@/lib/finance/ledger';
import { deriveInvoiceStatus, toDecimal } from '@/lib/finance/invoice';
import { Prisma } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const adjustment = await (prisma as any).financialAdjustment.findFirst({
      where: { OR: [{ id }, { adjustmentNumber: id }] },
      include: { invoice: true },
    });

    if (!adjustment) {
      return NextResponse.json({ success: false, error: 'Adjustment not found' }, { status: 404 });
    }

    if (adjustment.status === 'APPROVED') {
      return NextResponse.json({ success: false, error: 'Adjustment is already approved.' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const appAdj = await (tx as any).financialAdjustment.update({
        where: { id: adjustment.id },
        data: {
          status: 'APPROVED',
          approvedById: currentUser.id,
          notes: body.notes || adjustment.notes,
        },
      });

      const inv = adjustment.invoice;
      const isCreditType =
        appAdj.adjustmentType === 'DISCOUNT' ||
        appAdj.adjustmentType === 'WAIVER' ||
        appAdj.adjustmentType === 'WRITE_OFF';

      const adjAmount = toDecimal(appAdj.amount);

      if (inv) {
        let newTotal = toDecimal(inv.totalAmount);
        let newDiscount = toDecimal(inv.discount || 0);

        if (isCreditType) {
          newDiscount = newDiscount.add(adjAmount);
          newTotal = Prisma.Decimal.max(new Prisma.Decimal(0), newTotal.sub(adjAmount));
        } else {
          newTotal = newTotal.add(adjAmount);
        }

        const newDue = Prisma.Decimal.max(new Prisma.Decimal(0), newTotal.sub(inv.paidAmount));
        const newStatus = deriveInvoiceStatus(inv.status, newTotal, inv.paidAmount, inv.dueDate);

        await tx.invoice.update({
          where: { id: inv.id },
          data: {
            totalAmount: newTotal,
            discount: newDiscount,
            dueAmount: newDue,
            status: newStatus,
          },
        });
      }

      if (appAdj.applicantId) {
        await createAdjustmentLedgerEntry(tx as any, appAdj, currentUser.id);
      }

      await createAuditLog({
        actorUserId: currentUser.id,
        action: 'ADJUSTMENT_APPROVED',
        entity: 'FINANCIAL_ADJUSTMENT',
        entityId: appAdj.id,
        applicantId: appAdj.applicantId || undefined,
        description: `Approved financial adjustment ${appAdj.adjustmentNumber || appAdj.id} of ${appAdj.amount} (${appAdj.adjustmentType})`,
      });

      return appAdj;
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Adjustment approved successfully.',
    });
  } catch (error: any) {
    console.error('Error approving adjustment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to approve adjustment' },
      { status: 500 }
    );
  }
}
