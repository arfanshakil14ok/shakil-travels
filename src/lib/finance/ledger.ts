import { PrismaClient, Prisma } from '@prisma/client';
import { toDecimal } from './invoice';
import { createAuditLog } from '@/lib/audit';

export interface LedgerParams {
  applicantId: string;
  applicationId?: string | null;
  processingCaseId?: string | null;
  invoiceId?: string | null;
  paymentId?: string | null;
  refundId?: string | null;
  adjustmentId?: string | null;
  transactionType: 'INVOICE' | 'PAYMENT' | 'REFUND' | 'DISCOUNT' | 'WAIVER' | 'ADJUSTMENT' | 'REVERSAL';
  referenceType: 'INVOICE' | 'PAYMENT' | 'RECEIPT' | 'REFUND' | 'ADJUSTMENT' | 'REVERSAL';
  referenceId: string;
  debit?: Prisma.Decimal | number | string;
  credit?: Prisma.Decimal | number | string;
  currency?: string;
  description: string;
  createdById?: string | null;
  transactionDate?: Date;
}

/**
 * Calculates current running balance for candidate
 * Running balance = Sum(Debit) - Sum(Credit)
 */
export async function calculateCandidateBalance(
  prisma: PrismaClient | Prisma.TransactionClient,
  applicantId: string
): Promise<{
  entries: any[];
  totalDebit: Prisma.Decimal;
  totalCredit: Prisma.Decimal;
  balance: Prisma.Decimal;
  runningBalance: Prisma.Decimal;
}> {
  const entries = await (prisma as any).candidateLedgerEntry.findMany({
    where: { applicantId },
    orderBy: { createdAt: 'asc' },
  });

  let totalDebit = new Prisma.Decimal(0);
  let totalCredit = new Prisma.Decimal(0);

  for (const entry of entries) {
    totalDebit = totalDebit.add(entry.debit);
    totalCredit = totalCredit.add(entry.credit);
  }

  const balance = totalDebit.sub(totalCredit);

  return {
    entries,
    totalDebit,
    totalCredit,
    balance,
    runningBalance: balance,
  };
}

/**
 * Creates an immutable candidate ledger entry with atomic running balance calculation
 */
export async function recordLedgerEntry(
  prisma: PrismaClient | Prisma.TransactionClient,
  params: LedgerParams
) {
  const debitAmount = toDecimal(params.debit || 0);
  const creditAmount = toDecimal(params.credit || 0);

  // 1. Get latest balance
  const current = await calculateCandidateBalance(prisma, params.applicantId);
  const newBalance = current.balance.add(debitAmount).sub(creditAmount);

  // 2. Create immutable entry
  const entry = await (prisma as any).candidateLedgerEntry.create({
    data: {
      applicantId: params.applicantId,
      applicationId: params.applicationId || null,
      processingCaseId: params.processingCaseId || null,
      invoiceId: params.invoiceId || null,
      paymentId: params.paymentId || null,
      refundId: params.refundId || null,
      adjustmentId: params.adjustmentId || null,
      transactionType: params.transactionType,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      debit: debitAmount,
      credit: creditAmount,
      balance: newBalance,
      currency: params.currency || 'BDT',
      transactionDate: params.transactionDate || new Date(),
      description: params.description,
      createdById: params.createdById || null,
    },
  });

  // 3. Mirror into existing financial_transactions table if applicable for backward compatibility
  try {
    const cust = await prisma.customer.findFirst({
      where: { applicantId: params.applicantId },
    });

    await (prisma as any).financialTransaction.create({
      data: {
        transactionType: params.transactionType,
        referenceNumber: params.referenceId,
        customerId: cust?.id || null,
        applicantId: params.applicantId,
        invoiceId: params.invoiceId || null,
        paymentId: params.paymentId || null,
        refundId: params.refundId || null,
        debit: debitAmount,
        credit: creditAmount,
        balance: newBalance,
        notes: params.description,
      },
    });
  } catch (err) {
    // Non-fatal if legacy transaction table fails
  }

  return entry;
}

export async function createInvoiceLedgerEntry(
  prisma: PrismaClient | Prisma.TransactionClient,
  arg2: any,
  arg3?: string | null
) {
  let applicantId = '';
  let applicationId: string | null = null;
  let processingCaseId: string | null = null;
  let invoiceId = '';
  let invoiceNumber = '';
  let amount: any = 0;
  let currency = 'BDT';
  let createdById: string | null = null;

  if (arg2.totalAmount !== undefined) {
    // Passed invoice model directly
    applicantId = arg2.applicantId;
    applicationId = arg2.applicationId || null;
    processingCaseId = arg2.processingCaseId || null;
    invoiceId = arg2.id;
    invoiceNumber = arg2.invoiceNumber;
    amount = arg2.totalAmount;
    currency = arg2.currency || 'BDT';
    createdById = arg3 || arg2.createdById || null;
  } else {
    // Passed params object
    applicantId = arg2.applicantId;
    applicationId = arg2.applicationId || null;
    processingCaseId = arg2.processingCaseId || null;
    invoiceId = arg2.invoiceId;
    invoiceNumber = arg2.invoiceNumber;
    amount = arg2.amount;
    currency = arg2.currency || 'BDT';
    createdById = arg2.createdById || arg3 || null;
  }

  return await recordLedgerEntry(prisma, {
    applicantId,
    applicationId,
    processingCaseId,
    invoiceId,
    transactionType: 'INVOICE',
    referenceType: 'INVOICE',
    referenceId: invoiceNumber || invoiceId,
    debit: amount,
    credit: 0,
    currency,
    description: `Invoice ${invoiceNumber} issued`,
    createdById,
  });
}

export async function createPaymentLedgerEntry(
  prisma: PrismaClient | Prisma.TransactionClient,
  arg2: any,
  arg3?: string | null
) {
  let applicantId = '';
  let applicationId: string | null = null;
  let processingCaseId: string | null = null;
  let invoiceId = '';
  let paymentId = '';
  let paymentNumber = '';
  let amount: any = 0;
  let currency = 'BDT';
  let createdById: string | null = null;

  if (arg2.paymentNumber !== undefined && arg2.amount !== undefined) {
    applicantId = arg2.applicantId;
    applicationId = arg2.applicationId || null;
    processingCaseId = arg2.processingCaseId || null;
    invoiceId = arg2.invoiceId;
    paymentId = arg2.id || arg2.paymentId;
    paymentNumber = arg2.paymentNumber;
    amount = arg2.amount;
    currency = arg2.currency || 'BDT';
    createdById = arg3 || arg2.createdById || null;
  } else {
    applicantId = arg2.applicantId;
    applicationId = arg2.applicationId || null;
    processingCaseId = arg2.processingCaseId || null;
    invoiceId = arg2.invoiceId;
    paymentId = arg2.paymentId;
    paymentNumber = arg2.paymentNumber;
    amount = arg2.amount;
    currency = arg2.currency || 'BDT';
    createdById = arg2.createdById || arg3 || null;
  }

  return await recordLedgerEntry(prisma, {
    applicantId,
    applicationId,
    processingCaseId,
    invoiceId,
    paymentId,
    transactionType: 'PAYMENT',
    referenceType: 'PAYMENT',
    referenceId: paymentNumber || paymentId,
    debit: 0,
    credit: amount,
    currency,
    description: `Payment ${paymentNumber} confirmed`,
    createdById,
  });
}

export async function createRefundLedgerEntry(
  prisma: PrismaClient | Prisma.TransactionClient,
  params: {
    applicantId: string;
    applicationId?: string | null;
    processingCaseId?: string | null;
    invoiceId: string;
    refundId: string;
    refundNumber: string;
    amount: Prisma.Decimal | number | string;
    currency?: string;
    reason: string;
    createdById?: string | null;
  }
) {
  return await recordLedgerEntry(prisma, {
    applicantId: params.applicantId,
    applicationId: params.applicationId,
    processingCaseId: params.processingCaseId,
    invoiceId: params.invoiceId,
    refundId: params.refundId,
    transactionType: 'REFUND',
    referenceType: 'REFUND',
    referenceId: params.refundNumber,
    debit: params.amount, // Refund increases candidate balance owed / restores debt
    credit: 0,
    currency: params.currency,
    description: `Refund processed (${params.refundNumber}): ${params.reason}`,
    createdById: params.createdById,
  });
}

export async function createAdjustmentLedgerEntry(
  prisma: PrismaClient | Prisma.TransactionClient,
  arg2: any,
  arg3?: string | null
) {
  const applicantId = arg2.applicantId;
  const applicationId = arg2.applicationId || null;
  const processingCaseId = arg2.processingCaseId || null;
  const invoiceId = arg2.invoiceId;
  const adjustmentId = arg2.id || arg2.adjustmentId;
  const adjustmentNumber = arg2.adjustmentNumber || adjustmentId;
  const type = arg2.type || arg2.adjustmentType || 'DISCOUNT';
  const amount = arg2.amount;
  const currency = arg2.currency || 'BDT';
  const reason = arg2.reason || '';
  const createdById = arg3 || arg2.createdById || null;

  const isCredit = ['DISCOUNT', 'WAIVER', 'CREDIT', 'ROUNDING'].includes(type);
  const debit = isCredit ? 0 : amount;
  const credit = isCredit ? amount : 0;

  return await recordLedgerEntry(prisma, {
    applicantId,
    applicationId,
    processingCaseId,
    invoiceId,
    adjustmentId,
    transactionType: type === 'DISCOUNT' ? 'DISCOUNT' : type === 'WAIVER' ? 'WAIVER' : 'ADJUSTMENT',
    referenceType: 'ADJUSTMENT',
    referenceId: adjustmentNumber,
    debit,
    credit,
    currency,
    description: `Adjustment (${type} - ${adjustmentNumber}): ${reason}`,
    createdById,
  });
}

export async function createReversalEntry(
  prisma: PrismaClient | Prisma.TransactionClient,
  arg2: any,
  arg3?: string | null,
  arg4?: string | null
) {
  if (typeof arg2 === 'string') {
    const originalEntry = await (prisma as any).candidateLedgerEntry.findUnique({
      where: { id: arg2 },
    });
    if (!originalEntry) {
      throw new Error(`Original ledger entry not found: ${arg2}`);
    }

    const reason = typeof arg3 === 'string' ? arg3 : 'Reversal';
    const createdById = arg4 || null;
    const isDebitOriginal = new Prisma.Decimal(originalEntry.debit).greaterThan(0);

    return await recordLedgerEntry(prisma, {
      applicantId: originalEntry.applicantId,
      applicationId: originalEntry.applicationId,
      processingCaseId: originalEntry.processingCaseId,
      transactionType: 'REVERSAL',
      referenceType: 'REVERSAL',
      referenceId: `REV-${originalEntry.referenceId || originalEntry.id}`,
      debit: isDebitOriginal ? 0 : originalEntry.credit,
      credit: isDebitOriginal ? originalEntry.debit : 0,
      currency: originalEntry.currency,
      description: `Reversal of ${originalEntry.transactionType} (${originalEntry.referenceId}): ${reason}`,
      createdById,
    });
  }

  const debit = arg2.isDebitReversal ? 0 : arg2.amount;
  const credit = arg2.isDebitReversal ? arg2.amount : 0;

  return await recordLedgerEntry(prisma, {
    applicantId: arg2.applicantId,
    applicationId: arg2.applicationId,
    processingCaseId: arg2.processingCaseId,
    transactionType: 'REVERSAL',
    referenceType: 'REVERSAL',
    referenceId: `REV-${arg2.originalReferenceId}`,
    debit,
    credit,
    currency: arg2.currency || 'BDT',
    description: `Reversal of ${arg2.originalType} (${arg2.originalReferenceId}): ${arg2.reason}`,
    createdById: arg2.createdById || arg3 || null,
  });
}

/**
 * Calculates complete financial summary for an Application
 */
export async function calculateApplicationFinancialSummary(
  prisma: PrismaClient,
  applicationId: string
) {
  const [invoices, payments, refunds, costs] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        applicationId,
        status: { notIn: ['DRAFT', 'VOID', 'CANCELLED'] },
      },
    }),
    prisma.payment.findMany({
      where: {
        applicationId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
    }),
    prisma.refund.findMany({
      where: {
        applicationId,
        status: { in: ['APPROVED', 'COMPLETED', 'PROCESSED'] },
      },
    }),
    (prisma as any).recruitmentCost.findMany({
      where: {
        applicationId,
        status: { in: ['APPROVED', 'SUBMITTED', 'DRAFT'] },
      },
    }),
  ]);

  let totalInvoiced = new Prisma.Decimal(0);
  let totalPaid = new Prisma.Decimal(0);
  let totalRefunded = new Prisma.Decimal(0);
  let totalCost = new Prisma.Decimal(0);

  for (const inv of invoices) {
    totalInvoiced = totalInvoiced.add(inv.totalAmount);
  }

  for (const pay of payments) {
    totalPaid = totalPaid.add(pay.amount);
  }

  for (const ref of refunds) {
    totalRefunded = totalRefunded.add(ref.amount);
  }

  for (const c of costs) {
    if (c.status !== 'REJECTED' && c.status !== 'VOID') {
      totalCost = totalCost.add(c.amount);
    }
  }

  const netPaid = totalPaid.sub(totalRefunded);
  const totalDue = totalInvoiced.sub(netPaid);
  const netRevenue = totalInvoiced.sub(totalRefunded);
  const grossProfit = netRevenue.sub(totalCost);
  const profitMargin = netRevenue.greaterThan(0)
    ? grossProfit.div(netRevenue).mul(100).toDecimalPlaces(2)
    : new Prisma.Decimal(0);

  let financialStatus = 'NO_INVOICE';
  if (invoices.length > 0) {
    if (totalDue.lessThanOrEqualTo(0) && totalInvoiced.greaterThan(0)) {
      financialStatus = 'PAID';
    } else if (netPaid.greaterThan(0)) {
      financialStatus = 'PARTIALLY_PAID';
    } else {
      financialStatus = 'INVOICED';
    }
  }

  return {
    totalInvoiced,
    totalPaid,
    totalRefunded,
    netPaid,
    totalDue: totalDue.lessThan(0) ? new Prisma.Decimal(0) : totalDue,
    totalCost,
    totalDirectCosts: totalCost,
    grossProfit,
    profitMargin: Number(profitMargin),
    profitMarginPercent: Number(profitMargin),
    financialStatus,
    invoicesCount: invoices.length,
    paymentsCount: payments.length,
    costsCount: costs.length,
  };
}

/**
 * Calculates complete financial summary for a Recruitment Processing Case
 */
export async function calculateProcessingCaseFinancialSummary(
  prisma: PrismaClient,
  processingCaseId: string
) {
  const pc = await prisma.recruitmentProcessingCase.findFirst({
    where: { OR: [{ id: processingCaseId }, { processingCode: processingCaseId }] },
  });

  if (!pc) return null;

  return await calculateApplicationFinancialSummary(prisma, pc.applicationId);
}
