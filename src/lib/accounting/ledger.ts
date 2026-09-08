import { PrismaClient, Prisma } from '@prisma/client';

export interface LedgerEntry {
  id: string;
  date: Date;
  type: 'INVOICE' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT';
  reference: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
  invoiceId?: string | null;
  paymentId?: string | null;
}

export interface CustomerStatementSummary {
  customerId?: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  totalInvoiced: string;
  totalPaid: string;
  totalRefunded: string;
  currentBalanceDue: string;
  totalDebit?: string;
  totalCredit?: string;
  closingBalance?: string;
  entries: LedgerEntry[];
  transactions?: LedgerEntry[];
}

/**
 * Calculates complete chronological financial ledger for a customer or applicant
 */
export async function getCustomerLedger(
  prisma: PrismaClient,
  customerIdOrApplicantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CustomerStatementSummary | null> {
  // Try locating customer
  const customer = await prisma.customer.findFirst({
    where: {
      OR: [{ id: customerIdOrApplicantId }, { applicantId: customerIdOrApplicantId }],
    },
    include: {
      applicant: true,
    },
  });

  const applicant = customer?.applicant || (await prisma.applicant.findUnique({
    where: { id: customerIdOrApplicantId },
  }));

  const customerId = customer?.id;
  const applicantId = applicant?.id;

  if (!customer && !applicant) {
    return null;
  }

  // Fetch all invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      OR: [
        customerId ? { customerId } : {},
        applicantId ? { applicantId } : {},
      ],
      status: { notIn: ['DRAFT', 'VOID', 'CANCELLED'] },
    },
    include: {
      items: true,
    },
    orderBy: { invoiceDate: 'asc' },
  });

  // Fetch all payments
  const payments = await prisma.payment.findMany({
    where: {
      OR: [
        customerId ? { customerId } : {},
        applicantId ? { invoice: { applicantId } } : {},
      ],
      status: 'COMPLETED',
    },
    orderBy: { paymentDate: 'asc' },
  });

  // Fetch all refunds
  const refunds = await prisma.refund.findMany({
    where: {
      OR: [
        customerId ? { invoice: { customerId } } : {},
        applicantId ? { invoice: { applicantId } } : {},
      ],
      status: 'COMPLETED',
    },
    orderBy: { refundDate: 'asc' },
  });

  // Merge and sort all events chronologically
  type RawEvent = {
    id: string;
    date: Date;
    type: 'INVOICE' | 'PAYMENT' | 'REFUND';
    reference: string;
    description: string;
    amount: Prisma.Decimal;
    invoiceId?: string | null;
    paymentId?: string | null;
  };

  const rawEvents: RawEvent[] = [];

  for (const inv of invoices) {
    rawEvents.push({
      id: inv.id,
      date: inv.invoiceDate,
      type: 'INVOICE',
      reference: inv.invoiceNumber,
      description: inv.items.map((i) => i.description).join(', ') || 'Recruitment Services',
      amount: new Prisma.Decimal(inv.totalAmount),
      invoiceId: inv.id,
    });
  }

  for (const pay of payments) {
    rawEvents.push({
      id: pay.id,
      date: pay.paymentDate,
      type: 'PAYMENT',
      reference: pay.paymentNumber,
      description: `Payment via ${pay.paymentMethod}${pay.receiptNumber ? ` (Receipt #${pay.receiptNumber})` : ''}`,
      amount: new Prisma.Decimal(pay.amount),
      invoiceId: pay.invoiceId,
      paymentId: pay.id,
    });
  }

  for (const ref of refunds) {
    rawEvents.push({
      id: ref.id,
      date: ref.refundDate,
      type: 'REFUND',
      reference: ref.refundNumber,
      description: `Refund (${ref.reason})`,
      amount: new Prisma.Decimal(ref.amount),
      invoiceId: ref.invoiceId,
      paymentId: ref.paymentId,
    });
  }

  // Sort ascending by date
  rawEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  let runningBalance = new Prisma.Decimal(0);
  let totalInvoiced = new Prisma.Decimal(0);
  let totalPaid = new Prisma.Decimal(0);
  let totalRefunded = new Prisma.Decimal(0);

  const entries: LedgerEntry[] = rawEvents.map((evt) => {
    let debit = new Prisma.Decimal(0);
    let credit = new Prisma.Decimal(0);

    if (evt.type === 'INVOICE') {
      debit = evt.amount;
      runningBalance = runningBalance.add(debit);
      totalInvoiced = totalInvoiced.add(debit);
    } else if (evt.type === 'PAYMENT') {
      credit = evt.amount;
      runningBalance = runningBalance.sub(credit);
      totalPaid = totalPaid.add(credit);
    } else if (evt.type === 'REFUND') {
      // Refund restores customer due
      debit = evt.amount;
      runningBalance = runningBalance.add(debit);
      totalRefunded = totalRefunded.add(debit);
    }

    return {
      id: evt.id,
      date: evt.date,
      type: evt.type,
      reference: evt.reference,
      description: evt.description,
      debit: debit.isZero() ? '—' : debit.toFixed(2),
      credit: credit.isZero() ? '—' : credit.toFixed(2),
      balance: runningBalance.toFixed(2),
      invoiceId: evt.invoiceId,
      paymentId: evt.paymentId,
    };
  });

  let filteredEntries = entries;
  if (startDate) {
    filteredEntries = filteredEntries.filter((e) => e.date >= startDate);
  }
  if (endDate) {
    filteredEntries = filteredEntries.filter((e) => e.date <= endDate);
  }

  return {
    customerId: customer?.id,
    customerName: customer?.name || applicant?.fullName || 'Customer',
    customerPhone: customer?.phone || applicant?.phone || null,
    customerEmail: customer?.email || applicant?.email || null,
    totalInvoiced: totalInvoiced.toFixed(2),
    totalPaid: totalPaid.toFixed(2),
    totalRefunded: totalRefunded.toFixed(2),
    currentBalanceDue: runningBalance.toFixed(2),
    totalDebit: totalInvoiced.toFixed(2),
    totalCredit: totalPaid.toFixed(2),
    closingBalance: runningBalance.toFixed(2),
    entries: filteredEntries,
    transactions: filteredEntries,
  };
}
