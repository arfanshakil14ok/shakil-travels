import { PrismaClient, Prisma } from '@prisma/client';
import { generatePaymentNumber, generateReceiptNumber } from '@/lib/id-generator';
import { toDecimal, deriveInvoiceStatus } from './invoice';
import { createPaymentLedgerEntry, createReversalEntry } from './ledger';
import { createReceiptForPayment, convertAmountToWords } from './receipt';
import { createAuditLog } from '@/lib/audit';

export interface RecordPaymentInput {
  invoiceId: string;
  candidateId?: string | null;
  applicantId?: string | null;
  applicationId?: string | null;
  processingCaseId?: string | null;
  amount: number | string | Prisma.Decimal;
  currency?: string;
  paymentMethod: string;
  paymentDate?: Date | string;
  referenceNumber?: string | null;
  transactionId?: string | null;
  receivedById?: string | null;
  approvedById?: string | null;
  createdById?: string | null;
  payerName?: string | null;
  bankName?: string | null;
  status?: string; // PENDING, CONFIRMED, COMPLETED
  notes?: string | null;
  autoConfirm?: boolean;
}

export async function recordPaymentTransaction(
  prisma: PrismaClient,
  input: RecordPaymentInput
) {
  const paymentAmount = toDecimal(input.amount);

  if (paymentAmount.lessThanOrEqualTo(0)) {
    throw new Error('Payment amount must be greater than zero.');
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch invoice with lock
    const invoice = await tx.invoice.findUnique({
      where: { id: input.invoiceId },
      include: { applicant: true, application: true, processingCase: true },
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

    // 3. Idempotency check on transactionId
    if (input.transactionId) {
      const existingPayment = await tx.payment.findFirst({
        where: { transactionId: input.transactionId },
      });
      if (existingPayment) {
        return existingPayment;
      }
    }

    // 4. Generate sequential IDs
    const paymentNumber = await generatePaymentNumber(prisma);
    const receiptNumber = await generateReceiptNumber(prisma);

    const isConfirmed = input.autoConfirm !== false && input.status !== 'PENDING';
    const status = isConfirmed ? 'CONFIRMED' : 'PENDING';

    const applicantId = input.applicantId || input.candidateId || invoice.applicantId || null;
    const applicationId = input.applicationId || invoice.applicationId || null;
    const processingCaseId = input.processingCaseId || invoice.processingCaseId || null;

    // 5. Create Payment record
    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        receiptNumber: isConfirmed ? receiptNumber : null,
        invoiceId: invoice.id,
        customerId: invoice.customerId || null,
        applicantId,
        applicationId,
        processingCaseId,
        amount: paymentAmount,
        currency: input.currency || invoice.currency,
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
        paymentMethod: input.paymentMethod || 'CASH',
        referenceNumber: input.referenceNumber || null,
        transactionId: input.transactionId || null,
        receivedById: input.receivedById || input.createdById || null,
        approvedById: isConfirmed ? (input.approvedById || input.receivedById || input.createdById || null) : null,
        status,
        notes: input.notes || null,
      },
      include: {
        invoice: true,
        applicant: true,
      },
    });

    // 6. Create payment allocation record
    await (tx as any).paymentAllocation.create({
      data: {
        paymentId: payment.id,
        invoiceId: invoice.id,
        amount: paymentAmount,
      },
    });

    // 7. If confirmed, update invoice balance, ledger, receipt, and notification
    if (isConfirmed) {
      const newPaid = new Prisma.Decimal(invoice.paidAmount).add(paymentAmount);
      const newDue = new Prisma.Decimal(invoice.totalAmount).sub(newPaid);
      const newStatus = deriveInvoiceStatus(invoice.status, invoice.totalAmount, newPaid, invoice.dueDate);

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaid,
          dueAmount: newDue.lessThan(0) ? new Prisma.Decimal(0) : newDue,
          status: newStatus,
        },
      });

      // Write Candidate Ledger Entry
      if (applicantId) {
        await createPaymentLedgerEntry(tx as any, {
          applicantId,
          applicationId,
          processingCaseId,
          invoiceId: invoice.id,
          paymentId: payment.id,
          paymentNumber: payment.paymentNumber,
          amount: paymentAmount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          createdById: input.receivedById || input.approvedById,
        });
      }

      // Generate Receipt
      let createdReceipt = null;
      try {
        const words = convertAmountToWords(paymentAmount, payment.currency);
        createdReceipt = await (tx as any).receipt.create({
          data: {
            receiptNumber,
            paymentId: payment.id,
            invoiceId: invoice.id,
            applicantId,
            applicationId,
            amount: paymentAmount,
            currency: payment.currency,
            amountInWords: words.english,
            amountInWordsBn: words.bengali || words.bangla,
            receivedFrom: input.payerName || invoice.applicant?.fullName || 'Candidate',
            receiptDate: payment.paymentDate,
            status: 'ISSUED',
            issuedById: input.receivedById || null,
            notes: input.notes || null,
          },
        });
      } catch (e) {
        // Non-fatal
      }

      // Synchronize Payment Plan installment if active plan exists
      try {
        const activePlan = await (tx as any).paymentPlan.findFirst({
          where: { invoiceId: invoice.id, status: 'ACTIVE' },
          include: { installments: { orderBy: { installmentNumber: 'asc' } } },
        });

        if (activePlan) {
          let unallocated = paymentAmount;
          for (const inst of activePlan.installments) {
            if (unallocated.lessThanOrEqualTo(0)) break;
            if (inst.status !== 'PAID') {
              const pendingOnInst = new Prisma.Decimal(inst.remainingAmount);
              if (unallocated.greaterThanOrEqualTo(pendingOnInst)) {
                await (tx as any).installment.update({
                  where: { id: inst.id },
                  data: {
                    paidAmount: inst.amount,
                    remainingAmount: 0,
                    status: 'PAID',
                  },
                });
                unallocated = unallocated.sub(pendingOnInst);
              } else {
                const newInstPaid = new Prisma.Decimal(inst.paidAmount).add(unallocated);
                const newInstRem = new Prisma.Decimal(inst.amount).sub(newInstPaid);
                await (tx as any).installment.update({
                  where: { id: inst.id },
                  data: {
                    paidAmount: newInstPaid,
                    remainingAmount: newInstRem,
                    status: 'PARTIALLY_PAID',
                  },
                });
                unallocated = new Prisma.Decimal(0);
              }
            }
          }
        }
      } catch (e) {
        // Non-fatal
      }

      // Notify candidate
      if (applicantId) {
        await tx.notification.create({
          data: {
            applicantId,
            title: 'Payment Received / পেমেন্ট গ্রহণ করা হয়েছে',
            message: `Your payment of ${payment.currency} ${payment.amount} for invoice ${invoice.invoiceNumber} has been confirmed. Receipt: ${receiptNumber}. / আপনার পেমেন্টটি গৃহীত হয়েছে।`,
            type: 'PAYMENT',
            link: `/portal/invoices`,
          },
        });
      }

      await createAuditLog({
        actorUserId: input.receivedById || null,
        action: 'PAYMENT_RECEIVED',
        entity: 'PAYMENT',
        entityId: payment.id,
        applicantId,
        description: `Recorded payment ${payment.paymentNumber} of ${payment.currency} ${payment.amount} (${payment.paymentMethod}) for invoice ${invoice.invoiceNumber} (Status: ${status})`,
        newValue: {
          paymentNumber: payment.paymentNumber,
          receiptNumber: payment.receiptNumber,
          amount: payment.amount.toString(),
          status,
        },
      });

      return {
        ...payment,
        receipt: createdReceipt,
      };
    }

    await createAuditLog({
      actorUserId: input.receivedById || null,
      action: 'PAYMENT_RECEIVED',
      entity: 'PAYMENT',
      entityId: payment.id,
      applicantId,
      description: `Recorded payment ${payment.paymentNumber} of ${payment.currency} ${payment.amount} (${payment.paymentMethod}) for invoice ${invoice.invoiceNumber} (Status: ${status})`,
      newValue: {
        paymentNumber: payment.paymentNumber,
        receiptNumber: payment.receiptNumber,
        amount: payment.amount.toString(),
        status,
      },
    });

    return payment;
  });
}

export async function confirmPayment(
  prisma: PrismaClient,
  arg2: string | { paymentId: string; confirmedById?: string | null; approvedById?: string | null; notes?: string | null },
  arg3?: string | null,
  arg4?: string | null
) {
  const paymentId = typeof arg2 === 'object' ? arg2.paymentId : arg2;
  const approvedById = typeof arg2 === 'object' ? (arg2.confirmedById || arg2.approvedById || '') : (arg3 || '');
  const notes = typeof arg2 === 'object' ? (arg2.notes || null) : (arg4 || null);

  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true, applicant: true },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'CONFIRMED' || payment.status === 'COMPLETED') {
      return payment;
    }

    if (payment.status === 'VOID' || payment.status === 'REJECTED') {
      throw new Error(`Cannot confirm a payment in ${payment.status} status.`);
    }

    const receiptNumber = payment.receiptNumber || (await generateReceiptNumber(prisma));
    const invoice = payment.invoice;
    const paymentAmount = payment.amount;

    // Check if confirming will exceed balance
    const currentDue = new Prisma.Decimal(invoice.dueAmount);
    if (paymentAmount.greaterThan(currentDue)) {
      throw new Error(`Cannot confirm payment: amount (${payment.currency} ${paymentAmount}) exceeds invoice outstanding balance (${payment.currency} ${currentDue}).`);
    }

    // Update payment
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CONFIRMED',
        receiptNumber,
        approvedById,
        notes: notes || payment.notes,
      },
    });

    // Update invoice
    const newPaid = new Prisma.Decimal(invoice.paidAmount).add(paymentAmount);
    const newDue = new Prisma.Decimal(invoice.totalAmount).sub(newPaid);
    const newStatus = deriveInvoiceStatus(invoice.status, invoice.totalAmount, newPaid, invoice.dueDate);

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaid,
        dueAmount: newDue.lessThan(0) ? new Prisma.Decimal(0) : newDue,
        status: newStatus,
      },
    });

    // Write Ledger
    if (payment.applicantId) {
      await createPaymentLedgerEntry(tx as any, {
        applicantId: payment.applicantId,
        applicationId: payment.applicationId,
        processingCaseId: payment.processingCaseId,
        invoiceId: invoice.id,
        paymentId: payment.id,
        paymentNumber: payment.paymentNumber,
        amount: paymentAmount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        createdById: approvedById,
      });
    }

    // Create Receipt
    await (tx as any).receipt.create({
      data: {
        receiptNumber,
        paymentId: payment.id,
        invoiceId: invoice.id,
        applicantId: payment.applicantId,
        applicationId: payment.applicationId,
        amount: paymentAmount,
        currency: payment.currency,
        receiptDate: new Date(),
        issuedById: approvedById,
        notes: notes || null,
      },
    });

    // Notify candidate
    if (payment.applicantId) {
      await tx.notification.create({
        data: {
          applicantId: payment.applicantId,
          title: 'Payment Confirmed / পেমেন্ট অনুমোদিত হয়েছে',
          message: `Your payment ${payment.paymentNumber} of ${payment.currency} ${payment.amount} has been verified and confirmed. Receipt: ${receiptNumber}.`,
          type: 'PAYMENT',
          link: `/portal/invoices`,
        },
      });
    }

    await createAuditLog({
      actorUserId: approvedById,
      action: 'PAYMENT_CONFIRMED',
      entity: 'PAYMENT',
      entityId: payment.id,
      applicantId: payment.applicantId,
      description: `Confirmed payment ${payment.paymentNumber} with receipt ${receiptNumber}`,
      newValue: { status: 'CONFIRMED', receiptNumber },
    });

    return updatedPayment;
  });
}

export async function rejectPayment(
  prisma: PrismaClient,
  arg2: string | { paymentId: string; rejectedById?: string | null; reason: string },
  arg3?: string,
  arg4?: string
) {
  const paymentId = typeof arg2 === 'object' ? arg2.paymentId : arg2;
  const reason = typeof arg2 === 'object' ? arg2.reason : (arg4 || arg3 || 'Payment rejected');
  const rejectedById = typeof arg2 === 'object' ? (arg2.rejectedById || '') : (arg3 || '');

  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'PENDING') {
      throw new Error(`Cannot reject a payment in ${payment.status} status.`);
    }

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REJECTED',
        notes: payment.notes ? `${payment.notes} | Rejected: ${reason}` : `Rejected: ${reason}`,
      },
    });

    if (payment.applicantId) {
      await tx.notification.create({
        data: {
          applicantId: payment.applicantId,
          title: 'Payment Rejected / পেমেন্ট প্রত্যাখ্যাত হয়েছে',
          message: `Your payment record ${payment.paymentNumber} was not approved. Reason: ${reason}. Please contact accounts.`,
          type: 'WARNING',
          link: `/portal/invoices`,
        },
      });
    }

    await createAuditLog({
      actorUserId: rejectedById,
      action: 'PAYMENT_REJECTED',
      entity: 'PAYMENT',
      entityId: payment.id,
      applicantId: payment.applicantId,
      description: `Rejected payment ${payment.paymentNumber}: ${reason}`,
      newValue: { status: 'REJECTED', rejectionReason: reason },
    });

    return updated;
  });
}
