import { PrismaClient, Prisma } from '@prisma/client';
import { generatePaymentPlanNumber } from '@/lib/id-generator';
import { toDecimal } from './invoice';
import { createAuditLog } from '@/lib/audit';

export interface CreatePaymentPlanParams {
  invoiceId: string;
  candidateId?: string | null;
  applicantId?: string | null;
  applicationId?: string | null;
  processingCaseId?: string | null;
  totalAmount: number | string | Prisma.Decimal;
  numberOfInstallments: number;
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM';
  startDate: Date | string;
  customAmounts?: Array<number | string | Prisma.Decimal>;
  notes?: string | null;
  createdById?: string | null;
  approvedById?: string | null;
  autoActivate?: boolean;
}

export async function createPaymentPlan(
  prisma: PrismaClient,
  params: CreatePaymentPlanParams
) {
  const total = toDecimal(params.totalAmount);
  const n = Math.max(2, Math.min(36, params.numberOfInstallments));

  if (total.lessThanOrEqualTo(0)) {
    throw new Error('Payment plan total amount must be greater than zero.');
  }

  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: params.invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found.');
    }

    if (total.greaterThan(invoice.totalAmount)) {
      throw new Error(
        `Payment plan total (${total}) cannot exceed invoice grand total (${invoice.totalAmount}).`
      );
    }

    const planNumber = await generatePaymentPlanNumber(prisma);
    const applicantId = params.applicantId || params.candidateId || invoice.applicantId;

    if (!applicantId) {
      throw new Error('Applicant ID is required for a payment plan.');
    }

    const start = new Date(params.startDate);
    const isAutoActive = params.autoActivate !== false;
    const status = isAutoActive ? 'ACTIVE' : 'DRAFT';

    // Calculate installment breakdowns
    const installmentsData: Array<{
      installmentNumber: number;
      dueDate: Date;
      amount: Prisma.Decimal;
      paidAmount: Prisma.Decimal;
      remainingAmount: Prisma.Decimal;
      status: string;
    }> = [];

    const equalAmount = total.div(n).toDecimalPlaces(2);
    let accumulated = new Prisma.Decimal(0);

    for (let i = 1; i <= n; i++) {
      let instAmount = equalAmount;
      if (params.customAmounts && params.customAmounts[i - 1]) {
        instAmount = toDecimal(params.customAmounts[i - 1]);
      } else if (i === n) {
        // Last installment gets the exact remainder to prevent 1-cent rounding drift
        instAmount = total.sub(accumulated).toDecimalPlaces(2);
      }

      accumulated = accumulated.add(instAmount);

      const dueDate = new Date(start);
      if (params.frequency === 'WEEKLY') {
        dueDate.setDate(dueDate.getDate() + (i - 1) * 7);
      } else if (params.frequency === 'BIWEEKLY') {
        dueDate.setDate(dueDate.getDate() + (i - 1) * 14);
      } else {
        // Monthly
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
      }

      installmentsData.push({
        installmentNumber: i,
        dueDate,
        amount: instAmount,
        paidAmount: new Prisma.Decimal(0),
        remainingAmount: instAmount,
        status: 'PENDING',
      });
    }

    const plan = await (tx as any).paymentPlan.create({
      data: {
        planNumber,
        applicantId,
        invoiceId: invoice.id,
        applicationId: params.applicationId || invoice.applicationId || null,
        processingCaseId: params.processingCaseId || invoice.processingCaseId || null,
        totalAmount: total,
        numberOfInstallments: n,
        frequency: params.frequency,
        startDate: start,
        status,
        notes: params.notes || null,
        createdById: params.createdById || null,
        approvedById: isAutoActive ? (params.approvedById || params.createdById || null) : null,
        installments: {
          create: installmentsData,
        },
      },
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
        applicant: true,
        invoice: true,
      },
    });

    await createAuditLog({
      actorUserId: params.createdById || null,
      action: 'PAYMENT_PLAN_CREATED',
      entity: 'PAYMENT_PLAN',
      entityId: plan.id,
      applicantId,
      description: `Created payment plan ${planNumber} for invoice ${invoice.invoiceNumber} with ${n} installments (${plan.totalAmount})`,
      newValue: {
        planNumber,
        totalAmount: plan.totalAmount.toString(),
        numberOfInstallments: n,
        frequency: params.frequency,
      },
    });

    return plan;
  });
}
