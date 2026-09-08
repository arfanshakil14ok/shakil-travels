import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { financialAdjustmentSchema } from '@/lib/validations/accounting';
import { toDecimal } from '@/lib/accounting/calculations';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('INVOICE_EDIT');
    const { id } = await params;
    const body = await request.json();

    const parsed = financialAdjustmentSchema.safeParse({
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
    const adjAmount = toDecimal(data.amount);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const adjustment = await prisma.$transaction(async (tx) => {
      // 1. Create adjustment record
      const created = await tx.financialAdjustment.create({
        data: {
          invoiceId: id,
          type: data.adjustmentType,
          amount: adjAmount,
          reason: data.reason,
          createdById: currentUser.id,
        },
      });

      // 2. Adjust invoice amounts
      // DISCOUNT, WAIVER, WRITE_OFF reduce the total and due amounts
      // SURCHARGE, PENALTY, OTHER increase the total and due amounts
      const isDeduction = ['DISCOUNT', 'WAIVER', 'WRITE_OFF'].includes(data.adjustmentType);
      const newTotal = isDeduction
        ? invoice.totalAmount.minus(adjAmount)
        : invoice.totalAmount.plus(adjAmount);
      const newDue = isDeduction
        ? invoice.dueAmount.minus(adjAmount)
        : invoice.dueAmount.plus(adjAmount);
      const newAdjustmentField = isDeduction
        ? invoice.adjustment.minus(adjAmount)
        : invoice.adjustment.plus(adjAmount);

      let newStatus = invoice.status;
      if (newDue.lessThanOrEqualTo(0) && invoice.paidAmount.greaterThan(0)) {
        newStatus = 'PAID';
      }

      await tx.invoice.update({
        where: { id },
        data: {
          totalAmount: newTotal,
          dueAmount: newDue.greaterThan(0) ? newDue : toDecimal('0.00'),
          adjustment: newAdjustmentField,
          status: newStatus,
        },
      });

      // 3. Post transaction to ledger
      const lastTx = await tx.financialTransaction.findFirst({
        where: invoice.customerId ? { customerId: invoice.customerId } : { applicantId: invoice.applicantId! },
        orderBy: { createdAt: 'desc' },
      });

      const prevBalance = lastTx ? lastTx.balance : toDecimal('0.00');
      const newBalance = isDeduction
        ? prevBalance.minus(adjAmount)
        : prevBalance.plus(adjAmount);

      await tx.financialTransaction.create({
        data: {
          transactionType: 'ADJUSTMENT',
          referenceNumber: `ADJ-${invoice.invoiceNumber}`,
          customerId: invoice.customerId,
          applicantId: invoice.applicantId,
          invoiceId: id,
          debit: isDeduction ? toDecimal('0.00') : adjAmount,
          credit: isDeduction ? adjAmount : toDecimal('0.00'),
          balance: newBalance,
          notes: `Adjustment (${data.adjustmentType}): ${data.reason}`,
        },
      });

      return created;
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'FINANCIAL_ADJUSTMENT',
      entity: 'INVOICE',
      entityId: id,
      newValue: {
        adjustmentType: adjustment.type,
        amount: adjustment.amount.toString(),
        reason: adjustment.reason,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: adjustment,
        message: 'Financial adjustment recorded successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error recording adjustment:', error);
    return NextResponse.json({ success: false, error: 'Failed to record adjustment' }, { status: 500 });
  }
}
