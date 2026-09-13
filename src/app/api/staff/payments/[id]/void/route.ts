import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/rbac';
import { createReversalEntry } from '@/lib/finance/ledger';
import { deriveInvoiceStatus, toDecimal } from '@/lib/finance/invoice';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Payment voided by staff';

    const payment = await prisma.payment.findFirst({
      where: { OR: [{ id }, { paymentNumber: id }, { transactionId: id }] },
      include: { invoice: true, receipts: true },
    });

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'VOID' || payment.status === 'REJECTED') {
      return NextResponse.json(
        { success: false, error: `Payment is already ${payment.status}.` },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'VOID',
          notes: payment.notes ? `${payment.notes}\n[VOID]: ${reason}` : `[VOID]: ${reason}`,
        },
      });

      // Update invoice if payment was confirmed
      if (payment.status === 'CONFIRMED' && payment.invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
        if (invoice) {
          const newPaid = Prisma.Decimal.max(
            new Prisma.Decimal(0),
            invoice.paidAmount.sub(payment.amount)
          );
          const newDue = invoice.totalAmount.sub(newPaid);
          const newStatus = deriveInvoiceStatus(invoice.status, invoice.totalAmount, newPaid, invoice.dueDate);

          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              paidAmount: newPaid,
              dueAmount: newDue,
              status: newStatus,
            },
          });
        }
      }

      // Void receipts if exists
      if (payment.receipts && payment.receipts.length > 0) {
        for (const rec of payment.receipts) {
          await (tx as any).receipt.update({
            where: { id: rec.id },
            data: { status: 'VOID' },
          });
        }
      }

      // Reverse candidate ledger entry if candidate payment
      if (payment.applicantId && payment.status === 'CONFIRMED') {
        const originalEntry = await (tx as any).candidateLedgerEntry.findFirst({
          where: {
            applicantId: payment.applicantId,
            referenceType: 'PAYMENT',
            referenceId: payment.id,
            isReversed: false,
          },
        });

        if (originalEntry) {
          await createReversalEntry(
            tx as any,
            originalEntry.id,
            `Reversal for voided payment ${payment.paymentNumber}: ${reason}`,
            currentUser.id
          );
        }
      }

      await createAuditLog({
        actorUserId: currentUser.id,
        action: 'PAYMENT_VOIDED',
        entity: 'PAYMENT',
        entityId: payment.id,
        applicantId: payment.applicantId || undefined,
        description: `Voided payment ${payment.paymentNumber}. Reason: ${reason}`,
      });

      return updatedPayment;
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Payment ${updated.paymentNumber} has been voided.`,
    });
  } catch (error: any) {
    console.error('Error voiding payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to void payment' },
      { status: 500 }
    );
  }
}
