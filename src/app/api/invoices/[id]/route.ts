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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
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

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (existing.status === 'VOID') {
      return NextResponse.json({ success: false, error: 'Cannot modify a voided invoice' }, { status: 400 });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        terms: body.terms !== undefined ? body.terms : existing.terms,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'INVOICE_EDIT',
      entity: 'INVOICE',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Invoice updated successfully',
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
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

    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (existing.payments.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete invoice with recorded payments. Use the Void action instead.' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Delete invoice items
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      // Delete invoice
      await tx.invoice.delete({ where: { id } });

      // Post reversing transaction if was issued
      if (existing.status === 'ISSUED') {
        const lastTx = await tx.financialTransaction.findFirst({
          where: existing.customerId ? { customerId: existing.customerId } : { applicantId: existing.applicantId! },
          orderBy: { createdAt: 'desc' },
        });

        const prevBalance = lastTx ? lastTx.balance : toDecimal('0.00');
        const newBalance = prevBalance.minus(existing.totalAmount);

        await tx.financialTransaction.create({
          data: {
            transactionType: 'INVOICE',
            referenceNumber: `DEL-${existing.invoiceNumber}`,
            customerId: existing.customerId,
            applicantId: existing.applicantId,
            debit: toDecimal('0.00'),
            credit: existing.totalAmount,
            balance: newBalance,
            notes: `Invoice deleted/reversal: ${existing.invoiceNumber}`,
          },
        });
      }
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'INVOICE_DELETE',
      entity: 'INVOICE',
      entityId: id,
      oldValue: existing,
    });

    return NextResponse.json({ success: true, message: `Invoice ${existing.invoiceNumber} deleted successfully` });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to delete invoice' }, { status: 500 });
  }
}
