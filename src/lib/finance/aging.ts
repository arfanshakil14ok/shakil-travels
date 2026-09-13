import { PrismaClient, Prisma } from '@prisma/client';
import { toDecimal } from './invoice';

export interface AgingBucketSummary {
  bucket: 'CURRENT' | 'DAYS_1_30' | 'DAYS_31_60' | 'DAYS_61_90' | 'DAYS_90_PLUS';
  label: string;
  count: number;
  totalAmount: Prisma.Decimal;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    applicantId?: string | null;
    applicantName?: string | null;
    employerName?: string | null;
    jobTitle?: string | null;
    dueDate?: Date | null;
    daysOverdue: number;
    totalAmount: Prisma.Decimal;
    paidAmount: Prisma.Decimal;
    balance: Prisma.Decimal;
    status: string;
  }>;
}

export interface AgingReport {
  generatedAt: Date;
  totalOutstanding: Prisma.Decimal;
  totalOverdue: Prisma.Decimal;
  totalInvoicesCount: number;
  overdueInvoicesCount: number;
  averageDaysOverdue: number;
  buckets: Record<'CURRENT' | 'DAYS_1_30' | 'DAYS_31_60' | 'DAYS_61_90' | 'DAYS_90_PLUS', AgingBucketSummary>;
  topDebtors: Array<{
    applicantId: string;
    applicantName: string;
    trackingNo?: string | null;
    applicantNumber?: string | null;
    passportNumber?: string | null;
    totalOutstanding: Prisma.Decimal;
    oldestDueDate?: Date | null;
    maxDaysOverdue: number;
    invoicesCount: number;
  }>;
}

export function calculateDaysOverdue(dueDate?: Date | string | null, referenceDate: Date = new Date()): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const ref = new Date(referenceDate);
  const diffTime = ref.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function classifyAgingBucket(
  dueDate?: Date | string | null,
  referenceDate: Date = new Date()
): 'CURRENT' | 'DAYS_1_30' | 'DAYS_31_60' | 'DAYS_61_90' | 'DAYS_90_PLUS' {
  if (!dueDate) return 'CURRENT';
  const days = calculateDaysOverdue(dueDate, referenceDate);
  if (days <= 0) return 'CURRENT';
  if (days <= 30) return 'DAYS_1_30';
  if (days <= 60) return 'DAYS_31_60';
  if (days <= 90) return 'DAYS_61_90';
  return 'DAYS_90_PLUS';
}

export async function generateAgingReport(
  prisma: PrismaClient,
  options?: {
    employerId?: string;
    jobId?: string;
    applicantId?: string;
    referenceDate?: Date;
  }
): Promise<AgingReport> {
  const refDate = options?.referenceDate || new Date();

  const whereClause: Prisma.InvoiceWhereInput = {
    status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE', 'UNPAID'] },
  };

  if (options?.employerId) whereClause.employerId = options.employerId;
  if (options?.jobId) whereClause.jobId = options.jobId;
  if (options?.applicantId) whereClause.applicantId = options.applicantId;

  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    include: {
      applicant: {
        select: {
          id: true,
          fullName: true,
          applicantNumber: true,
          passportNumber: true,
        },
      },
      employer: {
        select: {
          id: true,
          companyName: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  const buckets: Record<'CURRENT' | 'DAYS_1_30' | 'DAYS_31_60' | 'DAYS_61_90' | 'DAYS_90_PLUS', AgingBucketSummary> = {
    CURRENT: {
      bucket: 'CURRENT',
      label: 'Current (Not Overdue)',
      count: 0,
      totalAmount: new Prisma.Decimal(0),
      invoices: [],
    },
    DAYS_1_30: {
      bucket: 'DAYS_1_30',
      label: '1 – 30 Days Overdue',
      count: 0,
      totalAmount: new Prisma.Decimal(0),
      invoices: [],
    },
    DAYS_31_60: {
      bucket: 'DAYS_31_60',
      label: '31 – 60 Days Overdue',
      count: 0,
      totalAmount: new Prisma.Decimal(0),
      invoices: [],
    },
    DAYS_61_90: {
      bucket: 'DAYS_61_90',
      label: '61 – 90 Days Overdue',
      count: 0,
      totalAmount: new Prisma.Decimal(0),
      invoices: [],
    },
    DAYS_90_PLUS: {
      bucket: 'DAYS_90_PLUS',
      label: '90+ Days Overdue',
      count: 0,
      totalAmount: new Prisma.Decimal(0),
      invoices: [],
    },
  };

  let totalOutstanding = new Prisma.Decimal(0);
  let totalOverdue = new Prisma.Decimal(0);
  let totalDaysOverdueSum = 0;
  let overdueCount = 0;

  const debtorMap = new Map<
    string,
    {
      applicantId: string;
      applicantName: string;
      trackingNo?: string | null;
      applicantNumber?: string | null;
      passportNumber?: string | null;
      totalOutstanding: Prisma.Decimal;
      oldestDueDate?: Date | null;
      maxDaysOverdue: number;
      invoicesCount: number;
    }
  >();

  for (const inv of invoices) {
    const total = toDecimal(inv.totalAmount);
    const paid = toDecimal(inv.paidAmount);
    const balance = total.sub(paid);

    if (balance.lessThanOrEqualTo(0)) continue;

    const daysOverdue = calculateDaysOverdue(inv.dueDate, refDate);
    const bucketKey = classifyAgingBucket(inv.dueDate, refDate);

    const invSummary = {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      applicantId: inv.applicantId,
      applicantName: inv.applicant?.fullName || 'N/A',
      employerName: inv.employer?.companyName || 'N/A',
      jobTitle: inv.job?.title || 'N/A',
      dueDate: inv.dueDate,
      daysOverdue,
      totalAmount: total,
      paidAmount: paid,
      balance,
      status: inv.status,
    };

    buckets[bucketKey].count += 1;
    buckets[bucketKey].totalAmount = buckets[bucketKey].totalAmount.add(balance);
    buckets[bucketKey].invoices.push(invSummary);

    totalOutstanding = totalOutstanding.add(balance);

    if (daysOverdue > 0) {
      totalOverdue = totalOverdue.add(balance);
      totalDaysOverdueSum += daysOverdue;
      overdueCount += 1;
    }

    if (inv.applicantId) {
      const existing = debtorMap.get(inv.applicantId);
      if (existing) {
        existing.totalOutstanding = existing.totalOutstanding.add(balance);
        existing.invoicesCount += 1;
        if (daysOverdue > existing.maxDaysOverdue) {
          existing.maxDaysOverdue = daysOverdue;
        }
        if (inv.dueDate && (!existing.oldestDueDate || new Date(inv.dueDate) < new Date(existing.oldestDueDate))) {
          existing.oldestDueDate = inv.dueDate;
        }
      } else {
        debtorMap.set(inv.applicantId, {
          applicantId: inv.applicantId,
          applicantName: inv.applicant?.fullName || 'Candidate',
          trackingNo: inv.applicant?.applicantNumber || null,
          applicantNumber: inv.applicant?.applicantNumber || null,
          passportNumber: inv.applicant?.passportNumber || null,
          totalOutstanding: balance,
          oldestDueDate: inv.dueDate,
          maxDaysOverdue: daysOverdue,
          invoicesCount: 1,
        });
      }
    }
  }

  const topDebtors = Array.from(debtorMap.values()).sort((a, b) =>
    b.totalOutstanding.sub(a.totalOutstanding).toNumber()
  );

  return {
    generatedAt: refDate,
    totalOutstanding,
    totalOverdue,
    totalInvoicesCount: invoices.length,
    overdueInvoicesCount: overdueCount,
    averageDaysOverdue: overdueCount > 0 ? Math.round(totalDaysOverdueSum / overdueCount) : 0,
    buckets,
    topDebtors,
  };
}
