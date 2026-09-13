import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { invoiceItemSchema } from '@/lib/validations/finance';
import { calculateLineItem, calculateInvoiceTotals, toDecimal } from '@/lib/finance/invoice';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const validation = invoiceItemSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const item = validation.data;
    const invoice = await prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] },
      include: { items: true },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Can only add items to DRAFT invoices.' },
        { status: 400 }
      );
    }

    const calculated = calculateLineItem(item);

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          category: (item as any).category || (item as any).feeType || 'PROCESSING_FEE',
          description: item.description,
          descriptionLocal: (item as any).descriptionLocal || null,
          quantity: item.quantity,
          unitPrice: toDecimal(item.unitPrice),
          discount: toDecimal(item.discount || 0),
          tax: toDecimal(item.tax || 0),
          lineTotal: calculated.totalAmount,
        },
      });

      const allItems = await tx.invoiceItem.findMany({ where: { invoiceId: invoice.id } });
      const totals = calculateInvoiceTotals(
        allItems.map((it) => ({
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
      action: 'INVOICE_ITEM_ADDED',
      entity: 'INVOICE',
      entityId: invoice.id,
      applicantId: invoice.applicantId || undefined,
      description: `Added item "${item.description}" to invoice ${invoice.invoiceNumber}`,
    });

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: 'Item added to invoice successfully.',
    });
  } catch (error: any) {
    console.error('Error adding invoice item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add item' },
      { status: 500 }
    );
  }
}
