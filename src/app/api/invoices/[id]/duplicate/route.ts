import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { generateFormattedId } from '@/lib/id-generator';
import { createAuditLog } from '@/lib/audit';
import { toDecimal } from '@/lib/accounting/calculations';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('INVOICE_CREATE');
    const { id } = await params;

    const source = await prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] },
      include: { items: true },
    });

    if (!source) {
      return NextResponse.json({ success: false, error: 'Source invoice not found' }, { status: 404 });
    }

    const newInvoiceNumber = await generateFormattedId(prisma as any, 'invoice');

    const result = await prisma.$transaction(async (tx) => {
      // Calculate due date (default to 14 days from today or copy source interval)
      const newIssueDate = new Date();
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 14);

      // Create new invoice in DRAFT status with 0 paidAmount and full dueAmount
      const duplicated = await tx.invoice.create({
        data: {
          invoiceNumber: newInvoiceNumber,
          customerId: source.customerId,
          applicantId: source.applicantId,
          applicationId: source.applicationId,
          invoiceDate: newIssueDate,
          dueDate: newDueDate,
          subtotal: source.subtotal,
          discount: source.discount,
          tax: source.tax,
          adjustment: source.adjustment,
          totalAmount: source.totalAmount,
          paidAmount: toDecimal('0.00'),
          dueAmount: source.totalAmount,
          status: 'DRAFT',
          notes: source.notes ? `[Duplicated from ${source.invoiceNumber}]\n${source.notes}` : `[Duplicated from ${source.invoiceNumber}]`,
          terms: source.terms,
          createdById: currentUser.id,
        },
      });

      // Clone line items
      if (source.items && source.items.length > 0) {
        await tx.invoiceItem.createMany({
          data: source.items.map((item) => ({
            invoiceId: duplicated.id,
            serviceId: item.serviceId,
            serviceCode: item.serviceCode,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            tax: item.tax,
            lineTotal: item.lineTotal,
          })),
        });
      }

      return duplicated;
    });

    await createAuditLog({
      userId: currentUser.id,
      actorUserId: currentUser.id,
      actorType: 'STAFF',
      applicantId: source.applicantId,
      action: 'INVOICE_DUPLICATED',
      entity: 'INVOICE',
      entityId: result.id,
      description: `Invoice duplicated from ${source.invoiceNumber} -> new invoice ${result.invoiceNumber}`,
      metadata: {
        sourceInvoiceId: source.id,
        sourceInvoiceNumber: source.invoiceNumber,
        newInvoiceNumber: result.invoiceNumber,
        totalAmount: result.totalAmount.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Invoice duplicated successfully as ${result.invoiceNumber}`,
    }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Invoice duplication error:', error);
    return NextResponse.json({ success: false, error: 'Failed to duplicate invoice' }, { status: 500 });
  }
}
