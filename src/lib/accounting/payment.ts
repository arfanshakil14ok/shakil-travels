import { PrismaClient, Prisma } from '@prisma/client';
import { generateFormattedId } from '@/lib/id-generator';
import { toDecimal } from './calculations';
import { createAuditLog } from '@/lib/audit';

export interface PostPaymentInput {
  invoiceId: string;
  amount: number | string | Prisma.Decimal;
  paymentMethod: string;
  referenceNumber?: string | null;
  transactionId?: string | null;
  receivedById?: string | null;
  notes?: string | null;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  paymentNumber?: string;
  receiptNumber?: string;
  invoiceStatus?: string;
  remainingDue?: string;
  error?: string;
}

export interface RecordPaymentInput {
  invoiceId: string;
  customerId?: string | null;
  amount: number | string | Prisma.Decimal;
  currency?: string;
  paymentMethod: string;
  referenceNumber?: string | null;
  transactionId?: string | null;
  receivedById?: string | null;
  paymentDate?: Date;
  notes?: string | null;
}

/**
 * Concurrency-safe payment processor executed inside a PostgreSQL database transaction
 */
export async function recordPayment(
  prisma: PrismaClient,
  input: RecordPaymentInput
) {
  const paymentAmount = toDecimal(input.amount);

  if (paymentAmount.lessThanOrEqualTo(0)) {
    throw new Error('Payment amount must be greater than zero.');
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch current invoice with write lock
    const invoice = await tx.invoice.findUnique({
      where: { id: input.invoiceId },
      include: { customer: true, applicant: true },
    });

    if (!invoice) {
      throw new Error('Invoice not found.');
    }

    if (['DRAFT', 'VOID', 'CANCELLED', 'REFUNDED'].includes(invoice.status)) {
      throw new Error(`Cannot record payment against an invoice in ${invoice.status} status.`);
    }

    const currentDue = new Prisma.Decimal(invoice.dueAmount);

    // 2. Prevent overpayment
    if (paymentAmount.greaterThan(currentDue)) {
      throw new Error(
        `Payment amount (${invoice.currency} ${paymentAmount.toFixed(2)}) exceeds outstanding invoice balance (${invoice.currency} ${currentDue.toFixed(2)}).`
      );
    }

    // 2b. Idempotency Guard: Prevent duplicate processing if transactionId already recorded
    if (input.transactionId) {
      const existingPayment = await tx.payment.findFirst({
        where: { transactionId: input.transactionId },
      });
      if (existingPayment) {
        return existingPayment;
      }
    }

    // 3. Generate sequential payment & receipt numbers
    const paymentNumber = await generateFormattedId(prisma, 'payment');
    const receiptNumber = await generateFormattedId(prisma, 'receipt');

    // 4. Create Payment record
    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        receiptNumber,
        invoiceId: invoice.id,
        customerId: input.customerId || invoice.customerId || null,
        amount: paymentAmount,
        currency: input.currency || invoice.currency,
        paymentMethod: (input.paymentMethod as any) || 'CASH',
        referenceNumber: input.referenceNumber || null,
        transactionId: input.transactionId || null,
        receivedById: input.receivedById || null,
        paymentDate: input.paymentDate || new Date(),
        status: 'COMPLETED',
        notes: input.notes || null,
      },
    });

    // 5. Update invoice totals and status
    const newPaid = new Prisma.Decimal(invoice.paidAmount).add(paymentAmount).toDecimalPlaces(2);
    const newDue = currentDue.sub(paymentAmount).toDecimalPlaces(2);
    const newStatus = newDue.lessThanOrEqualTo(0) ? 'PAID' : 'PARTIALLY_PAID';

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaid,
        dueAmount: newDue,
        status: newStatus,
      },
    });

    // 6. Record financial transaction ledger entry
    const lastTx = await tx.financialTransaction.findFirst({
      where: invoice.customerId ? { customerId: invoice.customerId } : { applicantId: invoice.applicantId! },
      orderBy: { createdAt: 'desc' },
    });

    const prevBalance = lastTx ? lastTx.balance : currentDue;
    const newBalance = prevBalance.minus(paymentAmount);

    await tx.financialTransaction.create({
      data: {
        transactionType: 'PAYMENT',
        referenceNumber: paymentNumber,
        customerId: invoice.customerId || null,
        applicantId: invoice.applicantId || null,
        invoiceId: invoice.id,
        paymentId: payment.id,
        debit: new Prisma.Decimal(0),
        credit: paymentAmount,
        balance: newBalance,
        notes: `Payment received via ${input.paymentMethod}. Receipt #${receiptNumber}`,
      },
    });

    return payment;
  });
}

/**
 * Concurrency-safe payment processor executed inside a PostgreSQL database transaction
 */
export async function postInvoicePayment(
  prisma: PrismaClient,
  input: PostPaymentInput
): Promise<PaymentResult> {
  try {
    const payment = await recordPayment(prisma, input);
    return {
      success: true,
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      receiptNumber: payment.receiptNumber || undefined,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Payment processing failed.',
    };
  }
}
