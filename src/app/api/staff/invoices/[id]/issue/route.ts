import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { createInvoiceLedgerEntry } from '@/lib/finance/ledger';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] },
      include: { items: true },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: `Invoice is already in ${invoice.status} status.` },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'ISSUED',
          invoiceDate: new Date(),
          updatedById: currentUser.id,
        },
      });

      // Write ledger entry if candidate invoice
      if (inv.applicantId) {
        await createInvoiceLedgerEntry(tx as any, inv, currentUser.id);
      }

      await createAuditLog({
        actorUserId: currentUser.id,
        action: 'INVOICE_ISSUED',
        entity: 'INVOICE',
        entityId: inv.id,
        applicantId: inv.applicantId || undefined,
        description: `Issued invoice ${inv.invoiceNumber} with amount ${inv.totalAmount}`,
      });

      return inv;
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Invoice ${updated.invoiceNumber} has been officially issued.`,
    });
  } catch (error: any) {
    console.error('Error issuing invoice:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to issue invoice' },
      { status: 500 }
    );
  }
}
