import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';
import { toDecimal } from '@/lib/accounting/calculations';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('INVOICE_VOID');
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Invoice cancelled by accounts administrator';

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'VOID') {
      return NextResponse.json({ success: false, error: 'Invoice is already voided' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Void invoice
      const updated = await tx.invoice.update({
        where: { id },
        data: {
          status: 'VOID',
          notes: invoice.notes ? `${invoice.notes}\n[VOIDED]: ${reason}` : `[VOIDED]: ${reason}`,
        },
      });

      // Post reversing transaction if was previously issued
      const lastTx = await tx.financialTransaction.findFirst({
        where: invoice.customerId ? { customerId: invoice.customerId } : { applicantId: invoice.applicantId! },
        orderBy: { createdAt: 'desc' },
      });

      const prevBalance = lastTx ? lastTx.balance : toDecimal('0.00');
      const newBalance = prevBalance.minus(invoice.dueAmount);

      await tx.financialTransaction.create({
        data: {
          transactionType: 'ADJUSTMENT',
          referenceNumber: `VOID-${invoice.invoiceNumber}`,
          customerId: invoice.customerId,
          applicantId: invoice.applicantId,
          invoiceId: invoice.id,
          debit: toDecimal('0.00'),
          credit: invoice.dueAmount,
          balance: newBalance,
          notes: `Invoice voided: ${reason}`,
        },
      });

      return updated;
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'INVOICE_VOID',
      entity: 'INVOICE',
      entityId: id,
      oldValue: { status: invoice.status },
      newValue: { status: 'VOID', reason },
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Invoice ${invoice.invoiceNumber} has been voided successfully`,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error voiding invoice:', error);
    return NextResponse.json({ success: false, error: 'Failed to void invoice' }, { status: 500 });
  }
}
