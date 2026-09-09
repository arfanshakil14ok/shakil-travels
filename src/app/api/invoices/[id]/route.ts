import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';
import { toDecimal } from '@/lib/accounting/calculations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('INVOICE_VIEW');
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        customer: true,
        applicant: {
          select: {
            id: true,
            applicantNumber: true,
            fullName: true,
            phone: true,
            email: true,
            passportNumber: true,
            address: true,
          },
        },
        application: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                jobCode: true,
                employer: { select: { companyName: true } },
                country: { select: { name: true } },
              },
            },
          },
        },
        items: {
          include: { service: true },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            receivedBy: { select: { id: true, name: true } },
          },
        },
        refunds: {
          orderBy: { refundDate: 'desc' },
          include: {
            refundedBy: { select: { id: true, name: true } },
          },
        },
        adjustments: {
          orderBy: { createdAt: 'desc' },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('INVOICE_EDIT');
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] },
      include: { items: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (existing.status === 'VOID' || existing.status === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify a paid or voided invoice' },
        { status: 400 }
      );
    }

    let updatedInvoice: any = null;

    if (Array.isArray(body.items) && body.items.length > 0) {
      // Recalculate financial breakdown using Decimal
      let calcSubtotal = toDecimal('0.00');
      let calcTax = toDecimal('0.00');
      let calcDiscount = toDecimal('0.00');

      const processedItems = body.items.map((item: any) => {
        const qty = parseInt(item.quantity) || 1;
        const uPrice = toDecimal(item.unitPrice || '0.00');
        const itemDisc = toDecimal(item.discount || '0.00');
        const itemTax = toDecimal(item.tax || '0.00');
        const lTotal = uPrice.times(qty).minus(itemDisc).plus(itemTax);

        calcSubtotal = calcSubtotal.plus(uPrice.times(qty));
        calcTax = calcTax.plus(itemTax);
        calcDiscount = calcDiscount.plus(itemDisc);

        return {
          invoiceId: existing.id,
          serviceId: item.serviceId || null,
          serviceCode: item.serviceCode || null,
          description: item.description || 'Service',
          quantity: qty,
          unitPrice: uPrice,
          discount: itemDisc,
          tax: itemTax,
          lineTotal: lTotal,
        };
      });

      const adjustmentVal = body.adjustment !== undefined ? toDecimal(body.adjustment) : existing.adjustment;
      const calcTotal = calcSubtotal.minus(calcDiscount).plus(calcTax).plus(adjustmentVal);
      const calcDue = calcTotal.minus(existing.paidAmount);

      updatedInvoice = await prisma.$transaction(async (tx) => {
        // Delete old items and re-insert
        await tx.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });
        await tx.invoiceItem.createMany({ data: processedItems });

        return await tx.invoice.update({
          where: { id: existing.id },
          data: {
            dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate,
            notes: body.notes !== undefined ? body.notes : existing.notes,
            terms: body.terms !== undefined ? body.terms : existing.terms,
            subtotal: calcSubtotal,
            tax: calcTax,
            discount: calcDiscount,
            adjustment: adjustmentVal,
            totalAmount: calcTotal,
            dueAmount: calcDue,
            updatedById: currentUser.id,
          },
          include: { items: true },
        });
      });
    } else {
      updatedInvoice = await prisma.invoice.update({
        where: { id: existing.id },
        data: {
          dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate,
          notes: body.notes !== undefined ? body.notes : existing.notes,
          terms: body.terms !== undefined ? body.terms : existing.terms,
          updatedById: currentUser.id,
        },
        include: { items: true },
      });
    }

    await createAuditLog({
      userId: currentUser.id,
      actorUserId: currentUser.id,
      actorType: 'STAFF',
      applicantId: existing.applicantId,
      action: 'INVOICE_EDIT',
      entity: 'INVOICE',
      entityId: id,
      description: `Invoice ${existing.invoiceNumber} updated by staff`,
      oldValue: {
        totalAmount: existing.totalAmount.toString(),
        status: existing.status,
        dueDate: existing.dueDate,
      },
      newValue: {
        totalAmount: updatedInvoice.totalAmount.toString(),
        status: updatedInvoice.status,
        dueDate: updatedInvoice.dueDate,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: 'Invoice updated successfully',
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Invoice update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('INVOICE_EDIT');
    const { id } = await params;

    const existing = await prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] },
      include: { payments: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    // Protection: PAID or PARTIALLY_PAID invoices MUST be blocked
    if (existing.status === 'PAID' || existing.status === 'PARTIALLY_PAID') {
      return NextResponse.json(
        {
          success: false,
          error: 'পরিশোধিত ইনভয়েস মুছে ফেলা যাবে না / Paid invoices cannot be deleted. Please void the invoice instead.',
        },
        { status: 400 }
      );
    }

    // Protection: invoices with recorded payments cannot be deleted
    if (existing.payments && existing.payments.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete invoice with recorded payments. Use the Void action instead.',
        },
        { status: 400 }
      );
    }

    // Protection: only DRAFT invoices may be directly deleted
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: 'শুধুমাত্র ড্রাফট ইনভয়েস মুছে ফেলা যাবে / Only draft invoices can be deleted. Please void issued invoices.',
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Delete invoice items
      await tx.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });
      // Delete invoice
      await tx.invoice.delete({ where: { id: existing.id } });
    });

    await createAuditLog({
      userId: currentUser.id,
      actorUserId: currentUser.id,
      actorType: 'STAFF',
      applicantId: existing.applicantId,
      action: 'INVOICE_DELETE',
      entity: 'INVOICE',
      entityId: id,
      description: `Draft invoice ${existing.invoiceNumber} deleted`,
      oldValue: {
        invoiceNumber: existing.invoiceNumber,
        status: existing.status,
        totalAmount: existing.totalAmount.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Invoice ${existing.invoiceNumber} deleted successfully`,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Invoice deletion error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete invoice' }, { status: 500 });
  }
}
