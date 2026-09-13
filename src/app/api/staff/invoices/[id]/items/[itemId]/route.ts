import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { calculateInvoiceTotals } from '@/lib/finance/invoice';
import { createAuditLog } from '@/lib/audit';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id, itemId } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] },
      include: { items: true },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Can only delete items from DRAFT invoices.' },
        { status: 400 }
      );
    }

    const itemExists = invoice.items.find((it) => it.id === itemId);
    if (!itemExists) {
      return NextResponse.json({ success: false, error: 'Item not found in this invoice' }, { status: 404 });
    }

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.delete({
        where: { id: itemId },
      });

      const remainingItems = await tx.invoiceItem.findMany({ where: { invoiceId: invoice.id } });
      const totals = calculateInvoiceTotals(
        remainingItems.map((it) => ({
          description: it.description,
          category: it.category,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: it.discount,
          tax: it.tax,
        }))
      );

      const due = totals.totalAmount.sub(invoice.paidAmount);

      return await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotal: totals.subtotal,
          tax: totals.tax,
          discount: totals.discount,
          totalAmount: totals.totalAmount,
          dueAmount: due,
        },
        include: { items: true },
      });
    });

    await createAuditLog({
      actorUserId: currentUser.id,
      action: 'INVOICE_ITEM_DELETED',
      entity: 'INVOICE',
      entityId: invoice.id,
      applicantId: invoice.applicantId || undefined,
      description: `Deleted item "${itemExists.description}" from invoice ${invoice.invoiceNumber}`,
    });

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: 'Item removed from invoice successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting invoice item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete item' },
      { status: 500 }
    );
  }
}
