import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { refundSchema } from '@/lib/validations/accounting';
import { generateFormattedId } from '@/lib/id-generator';
import { toDecimal } from '@/lib/accounting/calculations';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('PAYMENT_CREATE');
    const { id } = await params;
    const body = await request.json();

    const parsed = refundSchema.safeParse({
      ...body,
      invoiceId: id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const refundDecimal = toDecimal(data.amount);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { refunds: true, payments: true },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const totalRefunded = invoice.refunds.reduce(
      (sum, r) => sum.plus(r.amount),
      toDecimal('0.00')
    );
    const maxRefundable = invoice.paidAmount.minus(totalRefunded);

    if (refundDecimal.greaterThan(maxRefundable)) {
      return NextResponse.json(
        {
          success: false,
          error: `Refund amount of BDT ${refundDecimal.toFixed(2)} exceeds max refundable balance of BDT ${maxRefundable.toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    const refundNumber = await generateFormattedId(prisma, 'refund');

    const refund = await prisma.$transaction(async (tx) => {
      // 1. Create refund record
      const created = await tx.refund.create({
        data: {
          refundNumber,
          invoiceId: id,
          paymentId: data.paymentId || null,
          amount: refundDecimal,
          reason: data.reason,
          refundMethod: data.refundMethod,
          refundDate: data.refundDate ? new Date(data.refundDate) : new Date(),
          refundedById: currentUser.id,
          status: 'COMPLETED',
        },
      });

      // 2. Adjust invoice paid and due amounts
      const newPaid = invoice.paidAmount.minus(refundDecimal);
      const newDue = invoice.dueAmount.plus(refundDecimal);
      let newStatus = invoice.status;
      if (newPaid.isZero()) {
        newStatus = 'ISSUED';
      } else if (newDue.greaterThan(0)) {
        newStatus = 'PARTIALLY_PAID';
      }

      await tx.invoice.update({
        where: { id },
        data: {
          paidAmount: newPaid,
          dueAmount: newDue,
          status: newStatus,
        },
      });

      // 3. Post debit transaction to customer ledger
      const lastTx = await tx.financialTransaction.findFirst({
        where: invoice.customerId ? { customerId: invoice.customerId } : { applicantId: invoice.applicantId! },
        orderBy: { createdAt: 'desc' },
      });

      const prevBalance = lastTx ? lastTx.balance : toDecimal('0.00');
      const newBalance = prevBalance.plus(refundDecimal);

      await tx.financialTransaction.create({
        data: {
          transactionType: 'REFUND',
          referenceNumber: created.refundNumber,
          customerId: invoice.customerId,
          applicantId: invoice.applicantId,
          invoiceId: id,
          debit: refundDecimal,
          credit: toDecimal('0.00'),
          balance: newBalance,
          notes: `Refund processed: ${data.reason}`,
        },
      });

      return created;
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'REFUND_CREATE',
      entity: 'REFUND',
      entityId: refund.id,
      newValue: {
        refundNumber: refund.refundNumber,
        amount: refund.amount.toString(),
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: refund,
        message: `Refund ${refund.refundNumber} recorded successfully`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error processing refund:', error);
    return NextResponse.json({ success: false, error: 'Failed to process refund' }, { status: 500 });
  }
}
