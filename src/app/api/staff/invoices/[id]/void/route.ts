import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { createReversalEntry } from '@/lib/finance/ledger';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Invoice voided by staff';

    const invoice = await prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] },
      include: { payments: true },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'VOID') {
      return NextResponse.json({ success: false, error: 'Invoice is already void.' }, { status: 400 });
    }

    const hasConfirmedPayments = invoice.payments.some((p) => p.status === 'CONFIRMED');
    if (hasConfirmedPayments) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot void an invoice with confirmed payments. Please refund or reallocate payments first.',
        },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'VOID',
          notes: invoice.notes ? `${invoice.notes}\n[VOID REASON]: ${reason}` : `[VOID REASON]: ${reason}`,
        },
      });

      // Find original invoice ledger entry to reverse
      if (inv.applicantId) {
        const originalEntry = await (tx as any).candidateLedgerEntry.findFirst({
          where: {
            applicantId: inv.applicantId,
            referenceType: 'INVOICE',
            referenceId: inv.id,
            isReversed: false,
          },
        });

        if (originalEntry) {
          await createReversalEntry(
            tx as any,
            originalEntry.id,
            `Reversal for voided invoice ${inv.invoiceNumber}: ${reason}`,
            currentUser.id
          );
        }
      }

      await createAuditLog({
        actorUserId: currentUser.id,
        action: 'INVOICE_VOIDED',
        entity: 'INVOICE',
        entityId: inv.id,
        applicantId: inv.applicantId || undefined,
        description: `Voided invoice ${inv.invoiceNumber}. Reason: ${reason}`,
      });

      return inv;
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Invoice ${updated.invoiceNumber} has been voided.`,
    });
  } catch (error: any) {
    console.error('Error voiding invoice:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to void invoice' },
      { status: 500 }
    );
  }
}
