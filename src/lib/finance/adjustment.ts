import { PrismaClient, Prisma } from '@prisma/client';
import { generateAdjustmentNumber } from '@/lib/id-generator';
import { toDecimal, deriveInvoiceStatus } from './invoice';
import { createAdjustmentLedgerEntry } from './ledger';
import { createAuditLog } from '@/lib/audit';

export interface CreateAdjustmentParams {
  invoiceId: string;
  candidateId?: string | null;
  applicantId?: string | null;
  applicationId?: string | null;
  type?: 'DISCOUNT' | 'WAIVER' | 'CREDIT' | 'DEBIT' | 'CORRECTION' | 'ROUNDING' | string;
  adjustmentType?: 'DISCOUNT' | 'WAIVER' | 'CREDIT' | 'DEBIT' | 'CORRECTION' | 'ROUNDING' | string;
  amount: number | string | Prisma.Decimal;
  reason: string;
  createdById?: string | null;
  approvedById?: string | null;
  autoApprove?: boolean;
}

export async function createFinancialAdjustment(
  prisma: PrismaClient,
  params: CreateAdjustmentParams
) {
  const adjAmount = toDecimal(params.amount);

  if (adjAmount.lessThanOrEqualTo(0)) {
    throw new Error('Adjustment amount must be greater than zero.');
  }

  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: params.invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found.');
    }

    const adjustmentNumber = await generateAdjustmentNumber(prisma);
    const applicantId = params.applicantId || params.candidateId || invoice.applicantId || null;
    const applicationId = params.applicationId || invoice.applicationId || null;
    const isApproved = params.autoApprove !== false;
    const status = isApproved ? 'APPROVED' : 'REQUESTED';
    const adjType = params.adjustmentType || params.type || 'DISCOUNT';

    const adjustment = await (tx as any).financialAdjustment.create({
      data: {
        adjustmentNumber,
        invoiceId: invoice.id,
        applicantId,
        applicationId,
        type: adjType,
        adjustmentType: adjType,
        amount: adjAmount,
        reason: params.reason,
        status,
        createdById: params.createdById || null,
        approvedById: isApproved ? (params.approvedById || params.createdById || null) : null,
      },
      include: {
        invoice: true,
        applicant: true,
      },
    });

    if (isApproved) {
      // Calculate adjusted totals on invoice
      let newDiscount = new Prisma.Decimal(invoice.discount || 0);
      let newAdjustment = new Prisma.Decimal(invoice.adjustment || 0);

      if (adjType === 'DISCOUNT' || adjType === 'WAIVER' || adjType === 'WRITE_OFF') {
        newDiscount = newDiscount.add(adjAmount);
      } else if (adjType === 'CREDIT') {
        newAdjustment = newAdjustment.sub(adjAmount);
      } else if (adjType === 'DEBIT' || adjType === 'PENALTY' || adjType === 'SURCHARGE') {
        newAdjustment = newAdjustment.add(adjAmount);
      }

      const newTotal = new Prisma.Decimal(invoice.subtotal).sub(newDiscount).add(invoice.tax).add(newAdjustment);
      const safeTotal = newTotal.lessThan(0) ? new Prisma.Decimal(0) : newTotal;
      const newDue = safeTotal.sub(invoice.paidAmount);
      const safeDue = newDue.lessThan(0) ? new Prisma.Decimal(0) : newDue;
      const newStatus = deriveInvoiceStatus(invoice.status, safeTotal, invoice.paidAmount, invoice.dueDate);

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          discount: newDiscount,
          adjustment: newAdjustment,
          totalAmount: safeTotal,
          dueAmount: safeDue,
          status: newStatus,
        },
      });

      // Write Ledger
      if (applicantId) {
        await createAdjustmentLedgerEntry(tx as any, {
          applicantId,
          applicationId,
          processingCaseId: invoice.processingCaseId,
          invoiceId: invoice.id,
          adjustmentId: adjustment.id,
          adjustmentNumber: adjustment.adjustmentNumber || adjustmentNumber,
          type: adjType,
          amount: adjAmount,
          currency: invoice.currency,
          reason: params.reason,
          createdById: params.createdById || params.approvedById,
        });
      }
    }

    await createAuditLog({
      actorUserId: params.createdById || null,
      action: isApproved ? 'ADJUSTMENT_APPROVED' : 'ADJUSTMENT_REQUESTED',
      entity: 'FINANCIAL_ADJUSTMENT',
      entityId: adjustment.id,
      applicantId,
      description: `Adjustment ${adjustmentNumber} (${params.type}: ${invoice.currency} ${adjAmount}) on invoice ${invoice.invoiceNumber}`,
      newValue: {
        adjustmentNumber,
        type: params.type,
        amount: adjAmount.toString(),
        status,
      },
    });

    return adjustment;
  });
}
