import { PrismaClient, Prisma } from '@prisma/client';
import { generateRefundNumber } from '@/lib/id-generator';
import { toDecimal, deriveInvoiceStatus } from './invoice';
import { createRefundLedgerEntry } from './ledger';
import { createAuditLog } from '@/lib/audit';

export interface RequestRefundParams {
  invoiceId: string;
  paymentId?: string | null;
  candidateId?: string | null;
  applicantId?: string | null;
  applicationId?: string | null;
  amount: number | string | Prisma.Decimal;
  currency?: string;
  reason: string;
  refundMethod?: string;
  notes?: string | null;
  beneficiaryDetails?: string | null;
  requestedById?: string | null;
  autoApprove?: boolean;
}

export async function requestRefund(
  prisma: PrismaClient,
  params: RequestRefundParams
) {
  const refundAmount = toDecimal(params.amount);

  if (refundAmount.lessThanOrEqualTo(0)) {
    throw new Error('Refund amount must be greater than zero.');
  }

  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: params.invoiceId },
      include: { refunds: true },
    });

    if (!invoice) {
      throw new Error('Invoice not found.');
    }

    const currentPaid = new Prisma.Decimal(invoice.paidAmount);

    // Calculate total already refunded
    let alreadyRefunded = new Prisma.Decimal(0);
    for (const r of invoice.refunds) {
      if (r.status !== 'REJECTED' && r.status !== 'CANCELLED') {
        alreadyRefunded = alreadyRefunded.add(r.amount);
      }
    }

    const maxRefundable = currentPaid.sub(alreadyRefunded);

    if (refundAmount.greaterThan(maxRefundable)) {
      throw new Error(
        `Refund amount (${invoice.currency} ${refundAmount.toFixed(2)}) exceeds maximum refundable amount (${invoice.currency} ${maxRefundable.toFixed(2)}).`
      );
    }

    const refundNumber = await generateRefundNumber(prisma);
    const applicantId = params.applicantId || params.candidateId || invoice.applicantId || null;
    const applicationId = params.applicationId || invoice.applicationId || null;
    const isApproved = params.autoApprove === true;
    const status = isApproved ? 'APPROVED' : 'PENDING';

    const refund = await tx.refund.create({
      data: {
        refundNumber,
        invoiceId: invoice.id,
        paymentId: params.paymentId || null,
        applicantId,
        applicationId,
        amount: refundAmount,
        reason: params.reason,
        refundMethod: params.refundMethod || 'CASH',
        refundedById: isApproved ? params.requestedById : null,
        requestedById: params.requestedById || null,
        approvedById: isApproved ? params.requestedById : null,
        refundDate: new Date(),
        status,
        notes: params.notes || null,
      },
      include: {
        invoice: true,
        applicant: true,
      },
    });

    if (isApproved) {
      // Adjust invoice paid and due amounts
      const newPaid = currentPaid.sub(refundAmount);
      const newDue = new Prisma.Decimal(invoice.totalAmount).sub(newPaid);
      const newStatus = deriveInvoiceStatus(invoice.status, invoice.totalAmount, newPaid, invoice.dueDate);

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaid.lessThan(0) ? new Prisma.Decimal(0) : newPaid,
          dueAmount: newDue.lessThan(0) ? new Prisma.Decimal(0) : newDue,
          status: newStatus,
        },
      });

      // Write Candidate Ledger
      if (applicantId) {
        await createRefundLedgerEntry(tx as any, {
          applicantId,
          applicationId,
          processingCaseId: invoice.processingCaseId,
          invoiceId: invoice.id,
          refundId: refund.id,
          refundNumber: refund.refundNumber,
          amount: refundAmount,
          currency: invoice.currency,
          reason: params.reason,
          createdById: params.requestedById,
        });
      }

      // Notify candidate
      if (applicantId) {
        await tx.notification.create({
          data: {
            applicantId,
            title: 'Refund Approved / রিফান্ড অনুমোদিত হয়েছে',
            message: `A refund of ${invoice.currency} ${refundAmount} for invoice ${invoice.invoiceNumber} has been approved (${refundNumber}).`,
            type: 'PAYMENT',
            link: `/portal/invoices`,
          },
        });
      }
    }

    await createAuditLog({
      actorUserId: params.requestedById || null,
      action: isApproved ? 'REFUND_APPROVED' : 'REFUND_REQUESTED',
      entity: 'REFUND',
      entityId: refund.id,
      applicantId,
      description: `Refund ${refund.refundNumber} of ${invoice.currency} ${refund.amount} ${status} for invoice ${invoice.invoiceNumber}`,
      newValue: {
        refundNumber: refund.refundNumber,
        amount: refund.amount.toString(),
        status,
      },
    });

    return refund;
  });
}

export async function approveRefund(
  prisma: PrismaClient,
  arg2: string | { refundId: string; approvedById?: string | null; notes?: string | null },
  arg3?: string | null
) {
  const refundId = typeof arg2 === 'object' ? arg2.refundId : arg2;
  const approvedById = typeof arg2 === 'object' ? (arg2.approvedById || '') : (arg3 || '');

  return await prisma.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({
      where: { id: refundId },
      include: { invoice: true, applicant: true },
    });

    if (!refund) {
      throw new Error('Refund not found');
    }

    if (refund.status === 'APPROVED' || refund.status === 'PROCESSED' || refund.status === 'COMPLETED') {
      return refund;
    }

    const invoice = refund.invoice;
    const refundAmount = refund.amount;
    const currentPaid = new Prisma.Decimal(invoice.paidAmount);

    const updated = await tx.refund.update({
      where: { id: refund.id },
      data: {
        status: 'APPROVED',
        approvedById,
        refundedById: approvedById,
      },
    });

    // Update invoice
    const newPaid = currentPaid.sub(refundAmount);
    const newDue = new Prisma.Decimal(invoice.totalAmount).sub(newPaid);
    const newStatus = deriveInvoiceStatus(invoice.status, invoice.totalAmount, newPaid, invoice.dueDate);

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaid.lessThan(0) ? new Prisma.Decimal(0) : newPaid,
        dueAmount: newDue.lessThan(0) ? new Prisma.Decimal(0) : newDue,
        status: newStatus,
      },
    });

    // Write Ledger
    if (refund.applicantId) {
      await createRefundLedgerEntry(tx as any, {
        applicantId: refund.applicantId,
        applicationId: refund.applicationId,
        processingCaseId: invoice.processingCaseId,
        invoiceId: invoice.id,
        refundId: refund.id,
        refundNumber: refund.refundNumber,
        amount: refundAmount,
        currency: invoice.currency,
        reason: refund.reason,
        createdById: approvedById,
      });

      await tx.notification.create({
        data: {
          applicantId: refund.applicantId,
          title: 'Refund Approved / রিফান্ড অনুমোদিত হয়েছে',
          message: `Your refund of ${invoice.currency} ${refundAmount} for invoice ${invoice.invoiceNumber} has been approved.`,
          type: 'PAYMENT',
          link: `/portal/invoices`,
        },
      });
    }

    await createAuditLog({
      actorUserId: approvedById,
      action: 'REFUND_APPROVED',
      entity: 'REFUND',
      entityId: refund.id,
      applicantId: refund.applicantId,
      description: `Approved refund ${refund.refundNumber} for ${invoice.currency} ${refund.amount}`,
      newValue: { status: 'APPROVED' },
    });

    return updated;
  });
}
