import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Invoice cancelled by staff';

    const invoice = await prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] },
      include: { payments: true },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'CANCELLED' || invoice.status === 'VOID') {
      return NextResponse.json(
        { success: false, error: `Invoice is already ${invoice.status}.` },
        { status: 400 }
      );
    }

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'CANCELLED',
        notes: invoice.notes ? `${invoice.notes}\n[CANCELLED]: ${reason}` : `[CANCELLED]: ${reason}`,
      },
    });

    await createAuditLog({
      actorUserId: currentUser.id,
      action: 'INVOICE_CANCELLED',
      entity: 'INVOICE',
      entityId: updated.id,
      applicantId: updated.applicantId || undefined,
      description: `Cancelled invoice ${updated.invoiceNumber}. Reason: ${reason}`,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Invoice ${updated.invoiceNumber} has been cancelled.`,
    });
  } catch (error: any) {
    console.error('Error cancelling invoice:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel invoice' },
      { status: 500 }
    );
  }
}
