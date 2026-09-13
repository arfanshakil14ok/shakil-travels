import { PrismaClient, Prisma } from '@prisma/client';
import { generateCostNumber } from '@/lib/id-generator';
import { toDecimal } from './invoice';
import { createAuditLog } from '@/lib/audit';

export interface RecordRecruitmentCostParams {
  category:
    | 'MEDICAL'
    | 'VISA'
    | 'BMET'
    | 'DOCUMENTATION'
    | 'TRAINING'
    | 'TICKET'
    | 'ACCOMMODATION'
    | 'TRANSPORT'
    | 'AGENCY_COST'
    | 'EMPLOYER_COST'
    | 'OTHER'
    | 'ATTESTATION'
    | 'EMBASSY_VISA_FEE'
    | 'BMET_SMART_CARD'
    | 'AIR_TICKET'
    | 'AGENT_COMMISSION'
    | 'MISCELLANEOUS'
    | string;
  description: string;
  amount: number | string | Prisma.Decimal;
  currency?: string;
  applicantId?: string | null;
  candidateId?: string | null;
  applicationId?: string | null;
  processingCaseId?: string | null;
  jobId?: string | null;
  employerId?: string | null;
  vendorName?: string | null;
  referenceNo?: string | null;
  receiptUrl?: string | null;
  costDate?: Date | string;
  isRecoverableFromCandidate?: boolean;
  isRecoverableFromEmployer?: boolean;
  notes?: string | null;
  createdById?: string | null;
}

export async function recordRecruitmentCost(
  prisma: PrismaClient,
  params: RecordRecruitmentCostParams
) {
  const costNumber = await generateCostNumber(prisma);
  const amount = toDecimal(params.amount);
  const applicantId = params.applicantId || params.candidateId || null;

  if (amount.lessThanOrEqualTo(0)) {
    throw new Error('Cost amount must be greater than zero.');
  }

  const cost = await (prisma as any).recruitmentCost.create({
    data: {
      costNumber,
      category: params.category,
      description: params.description,
      amount,
      currency: params.currency || 'BDT',
      applicant: applicantId ? { connect: { id: applicantId } } : undefined,
      application: params.applicationId ? { connect: { id: params.applicationId } } : undefined,
      processingCase: params.processingCaseId ? { connect: { id: params.processingCaseId } } : undefined,
      job: params.jobId ? { connect: { id: params.jobId } } : undefined,
      employer: params.employerId ? { connect: { id: params.employerId } } : undefined,
      vendor: params.vendorName || null,
      referenceNumber: params.referenceNo || null,
      costDate: params.costDate ? new Date(params.costDate) : new Date(),
      status: 'APPROVED',
      notes: params.notes || null,
      createdBy: params.createdById ? { connect: { id: params.createdById } } : undefined,
    },
    include: {
      applicant: true,
      job: true,
      employer: true,
    },
  });

  await createAuditLog({
    actorUserId: params.createdById || null,
    action: 'RECRUITMENT_COST_RECORDED',
    entity: 'RECRUITMENT_COST',
    entityId: cost.id,
    applicantId: applicantId || undefined,
    description: `Recorded recruitment cost ${costNumber} of ${cost.amount} ${cost.currency} for ${cost.category}: ${cost.description}`,
    newValue: {
      costNumber,
      amount: cost.amount.toString(),
      category: cost.category,
      vendor: cost.vendor,
    },
  });

  return cost;
}

export interface ProfitabilityItem {
  id: string;
  name: string;
  code?: string | null;
  totalRevenue: Prisma.Decimal;
  totalCollected: Prisma.Decimal;
  totalCost: Prisma.Decimal;
  grossProfit: Prisma.Decimal;
  profitMarginPercent: number;
  costBreakdown: Record<string, Prisma.Decimal>;
}

export interface AgencyProfitabilitySummary {
  generatedAt: Date;
  totalInvoicedRevenue: Prisma.Decimal;
  totalCashCollected: Prisma.Decimal;
  totalRecruitmentCosts: Prisma.Decimal;
  grossProfit: Prisma.Decimal;
  netCashMargin: Prisma.Decimal;
  grossProfitMarginPercent: number;
  costBreakdownByCategory: Record<string, Prisma.Decimal>;
  byApplicant: ProfitabilityItem[];
  byJob: ProfitabilityItem[];
  byEmployer: ProfitabilityItem[];
  byCountry: ProfitabilityItem[];
}

export async function generateProfitabilityReport(
  prisma: PrismaClient,
  options?: {
    startDate?: Date;
    endDate?: Date;
    employerId?: string;
    jobId?: string;
  }
): Promise<AgencyProfitabilitySummary> {
  const invoiceWhere: Prisma.InvoiceWhereInput = {
    status: { notIn: ['VOID', 'DRAFT'] },
  };
  const costWhere: Prisma.RecruitmentCostWhereInput = {};
  const paymentWhere: Prisma.PaymentWhereInput = {
    status: { in: ['CONFIRMED', 'COMPLETED'] },
  };

  if (options?.employerId) {
    invoiceWhere.employerId = options.employerId;
    costWhere.employerId = options.employerId;
  }
  if (options?.jobId) {
    invoiceWhere.jobId = options.jobId;
    costWhere.jobId = options.jobId;
  }
  if (options?.startDate || options?.endDate) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (options?.startDate) dateFilter.gte = options.startDate;
    if (options?.endDate) dateFilter.lte = options.endDate;
    invoiceWhere.invoiceDate = dateFilter;
    costWhere.costDate = dateFilter;
    paymentWhere.paymentDate = dateFilter;
  }

  const [invoices, costs, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: invoiceWhere,
      include: {
        applicant: true,
        employer: {
          include: {
            country: true,
          },
        },
        job: {
          include: {
            country: true,
          },
        },
      },
    }),
    (prisma as any).recruitmentCost.findMany({
      where: costWhere,
      include: {
        applicant: true,
        employer: {
          include: {
            country: true,
          },
        },
        job: {
          include: {
            country: true,
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: paymentWhere,
      include: {
        applicant: true,
      },
    }),
  ]);

  let totalInvoicedRevenue = new Prisma.Decimal(0);
  let totalCashCollected = new Prisma.Decimal(0);
  let totalRecruitmentCosts = new Prisma.Decimal(0);

  const costBreakdownByCategory: Record<string, Prisma.Decimal> = {};

  for (const inv of invoices) {
    totalInvoicedRevenue = totalInvoicedRevenue.add(toDecimal(inv.totalAmount));
  }

  for (const pay of payments) {
    totalCashCollected = totalCashCollected.add(toDecimal(pay.amount));
  }

  for (const c of costs) {
    const amt = toDecimal(c.amount);
    const cat = String(c.category || 'OTHER');
    totalRecruitmentCosts = totalRecruitmentCosts.add(amt);
    costBreakdownByCategory[cat] = (costBreakdownByCategory[cat] || new Prisma.Decimal(0)).add(amt);
  }

  const grossProfit = totalInvoicedRevenue.sub(totalRecruitmentCosts);
  const netCashMargin = totalCashCollected.sub(totalRecruitmentCosts);
  const grossProfitMarginPercent =
    totalInvoicedRevenue.greaterThan(0)
      ? grossProfit.div(totalInvoicedRevenue).mul(100).toDecimalPlaces(2).toNumber()
      : 0;

  interface AccumulatorEntry {
    name: string;
    code?: string;
    revenue: Prisma.Decimal;
    collected: Prisma.Decimal;
    cost: Prisma.Decimal;
    costBreakdown: Record<string, Prisma.Decimal>;
  }

  // Breakdown by Applicant
  const applicantMap = new Map<string, AccumulatorEntry>();

  for (const inv of invoices) {
    if (!inv.applicantId) continue;
    const key = inv.applicantId;
    const entry: AccumulatorEntry = applicantMap.get(key) || {
      name: inv.applicant?.fullName || 'Candidate',
      code: inv.applicant?.applicantNumber || undefined,
      revenue: new Prisma.Decimal(0),
      collected: new Prisma.Decimal(0),
      cost: new Prisma.Decimal(0),
      costBreakdown: {},
    };
    entry.revenue = entry.revenue.add(toDecimal(inv.totalAmount));
    entry.collected = entry.collected.add(toDecimal(inv.paidAmount));
    applicantMap.set(key, entry);
  }

  for (const c of costs) {
    if (!c.applicantId) continue;
    const key = c.applicantId;
    const entry: AccumulatorEntry = applicantMap.get(key) || {
      name: c.applicant?.fullName || 'Candidate',
      code: c.applicant?.applicantNumber || undefined,
      revenue: new Prisma.Decimal(0),
      collected: new Prisma.Decimal(0),
      cost: new Prisma.Decimal(0),
      costBreakdown: {},
    };
    const amt = toDecimal(c.amount);
    const cat = String(c.category || 'OTHER');
    entry.cost = entry.cost.add(amt);
    entry.costBreakdown[cat] = (entry.costBreakdown[cat] || new Prisma.Decimal(0)).add(amt);
    applicantMap.set(key, entry);
  }

  const byApplicant: ProfitabilityItem[] = Array.from(applicantMap.entries()).map(([id, data]) => {
    const gp = data.revenue.sub(data.cost);
    const margin = data.revenue.greaterThan(0)
      ? gp.div(data.revenue).mul(100).toDecimalPlaces(2).toNumber()
      : 0;
    return {
      id,
      name: data.name,
      code: data.code,
      totalRevenue: data.revenue,
      totalCollected: data.collected,
      totalCost: data.cost,
      grossProfit: gp,
      profitMarginPercent: margin,
      costBreakdown: data.costBreakdown,
    };
  });

  // Breakdown by Job
  const jobMap = new Map<string, AccumulatorEntry>();

  for (const inv of invoices) {
    if (!inv.jobId) continue;
    const key = inv.jobId;
    const entry: AccumulatorEntry = jobMap.get(key) || {
      name: inv.job?.title || 'Job Position',
      revenue: new Prisma.Decimal(0),
      collected: new Prisma.Decimal(0),
      cost: new Prisma.Decimal(0),
      costBreakdown: {},
    };
    entry.revenue = entry.revenue.add(toDecimal(inv.totalAmount));
    entry.collected = entry.collected.add(toDecimal(inv.paidAmount));
    jobMap.set(key, entry);
  }

  for (const c of costs) {
    if (!c.jobId) continue;
    const key = c.jobId;
    const entry: AccumulatorEntry = jobMap.get(key) || {
      name: c.job?.title || 'Job Position',
      revenue: new Prisma.Decimal(0),
      collected: new Prisma.Decimal(0),
      cost: new Prisma.Decimal(0),
      costBreakdown: {},
    };
    const amt = toDecimal(c.amount);
    const cat = String(c.category || 'OTHER');
    entry.cost = entry.cost.add(amt);
    entry.costBreakdown[cat] = (entry.costBreakdown[cat] || new Prisma.Decimal(0)).add(amt);
    jobMap.set(key, entry);
  }

  const byJob: ProfitabilityItem[] = Array.from(jobMap.entries()).map(([id, data]) => {
    const gp = data.revenue.sub(data.cost);
    const margin = data.revenue.greaterThan(0)
      ? gp.div(data.revenue).mul(100).toDecimalPlaces(2).toNumber()
      : 0;
    return {
      id,
      name: data.name,
      totalRevenue: data.revenue,
      totalCollected: data.collected,
      totalCost: data.cost,
      grossProfit: gp,
      profitMarginPercent: margin,
      costBreakdown: data.costBreakdown,
    };
  });

  // Breakdown by Employer
  const employerMap = new Map<string, AccumulatorEntry>();

  for (const inv of invoices) {
    if (!inv.employerId) continue;
    const key = inv.employerId;
    const entry: AccumulatorEntry = employerMap.get(key) || {
      name: inv.employer?.companyName || 'Employer',
      revenue: new Prisma.Decimal(0),
      collected: new Prisma.Decimal(0),
      cost: new Prisma.Decimal(0),
      costBreakdown: {},
    };
    entry.revenue = entry.revenue.add(toDecimal(inv.totalAmount));
    entry.collected = entry.collected.add(toDecimal(inv.paidAmount));
    employerMap.set(key, entry);
  }

  for (const c of costs) {
    if (!c.employerId) continue;
    const key = c.employerId;
    const entry: AccumulatorEntry = employerMap.get(key) || {
      name: c.employer?.companyName || 'Employer',
      revenue: new Prisma.Decimal(0),
      collected: new Prisma.Decimal(0),
      cost: new Prisma.Decimal(0),
      costBreakdown: {},
    };
    const amt = toDecimal(c.amount);
    const cat = String(c.category || 'OTHER');
    entry.cost = entry.cost.add(amt);
    entry.costBreakdown[cat] = (entry.costBreakdown[cat] || new Prisma.Decimal(0)).add(amt);
    employerMap.set(key, entry);
  }

  const byEmployer: ProfitabilityItem[] = Array.from(employerMap.entries()).map(([id, data]) => {
    const gp = data.revenue.sub(data.cost);
    const margin = data.revenue.greaterThan(0)
      ? gp.div(data.revenue).mul(100).toDecimalPlaces(2).toNumber()
      : 0;
    return {
      id,
      name: data.name,
      totalRevenue: data.revenue,
      totalCollected: data.collected,
      totalCost: data.cost,
      grossProfit: gp,
      profitMarginPercent: margin,
      costBreakdown: data.costBreakdown,
    };
  });

  // Breakdown by Country
  const countryMap = new Map<string, AccumulatorEntry>();

  for (const inv of invoices) {
    const countryName = inv.job?.country?.name || inv.employer?.country?.name || 'Unassigned';
    const entry: AccumulatorEntry = countryMap.get(countryName) || {
      name: countryName,
      revenue: new Prisma.Decimal(0),
      collected: new Prisma.Decimal(0),
      cost: new Prisma.Decimal(0),
      costBreakdown: {},
    };
    entry.revenue = entry.revenue.add(toDecimal(inv.totalAmount));
    entry.collected = entry.collected.add(toDecimal(inv.paidAmount));
    countryMap.set(countryName, entry);
  }

  for (const c of costs) {
    const countryName = c.job?.country?.name || c.employer?.country?.name || 'Unassigned';
    const entry: AccumulatorEntry = countryMap.get(countryName) || {
      name: countryName,
      revenue: new Prisma.Decimal(0),
      collected: new Prisma.Decimal(0),
      cost: new Prisma.Decimal(0),
      costBreakdown: {},
    };
    const amt = toDecimal(c.amount);
    const cat = String(c.category || 'OTHER');
    entry.cost = entry.cost.add(amt);
    entry.costBreakdown[cat] = (entry.costBreakdown[cat] || new Prisma.Decimal(0)).add(amt);
    countryMap.set(countryName, entry);
  }

  const byCountry: ProfitabilityItem[] = Array.from(countryMap.entries()).map(([country, data]) => {
    const gp = data.revenue.sub(data.cost);
    const margin = data.revenue.greaterThan(0)
      ? gp.div(data.revenue).mul(100).toDecimalPlaces(2).toNumber()
      : 0;
    return {
      id: country,
      name: country,
      totalRevenue: data.revenue,
      totalCollected: data.collected,
      totalCost: data.cost,
      grossProfit: gp,
      profitMarginPercent: margin,
      costBreakdown: data.costBreakdown,
    };
  });

  return {
    generatedAt: new Date(),
    totalInvoicedRevenue,
    totalCashCollected,
    totalRecruitmentCosts,
    grossProfit,
    netCashMargin,
    grossProfitMarginPercent,
    costBreakdownByCategory,
    byApplicant,
    byJob,
    byEmployer,
    byCountry,
  };
}
