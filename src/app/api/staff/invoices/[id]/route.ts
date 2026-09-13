import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { updateInvoiceSchema } from '@/lib/validations/finance';
import { calculateInvoiceTotals, deriveInvoiceStatus } from '@/lib/finance/invoice';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        applicant: {
          select: {
            id: true,
            fullName: true,
            applicantNumber: true,
            passportNumber: true,
            phone: true,
            email: true,
            fatherName: true,
          },
        },
        employer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            jobCode: true,
            country: true,
          },
        },
        application: {
          select: {
            id: true,
            applicationNumber: true,
            status: true,
          },
        },
        processingCase: {
          select: {
            id: true,
            processingCode: true,
            currentStage: true,
            overallStatus: true,
          },
        },
        items: {
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          include: {
            receipts: true,
            receivedBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { paymentDate: 'desc' },
        },
        receipts: {
          orderBy: { receiptDate: 'desc' },
        },
        adjustments: {
          orderBy: { createdAt: 'desc' },
        },
        refunds: {
          orderBy: { createdAt: 'desc' },
        },
        paymentPlans: {
          include: {
            installments: {
              orderBy: { installmentNumber: 'asc' },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    console.error('Error fetching invoice detail:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const validation = updateInvoiceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;
    const existing = await prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (existing.status === 'PAID' || existing.status === 'VOID') {
      return NextResponse.json(
        { success: false, error: `Cannot modify an invoice with status ${existing.status}` },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.terms !== undefined) updateData.terms = data.terms;
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.status) updateData.status = data.status;
    if (data.discount !== undefined) updateData.discount = data.discount;
    if (data.tax !== undefined) updateData.tax = data.tax;
    if (data.adjustment !== undefined) updateData.adjustment = data.adjustment;

    const updated = await prisma.invoice.update({
      where: { id: existing.id },
      data: updateData,
      include: { items: true },
    });

    await createAuditLog({
      actorUserId: currentUser.id,
      action: 'INVOICE_UPDATED',
      entity: 'INVOICE',
      entityId: existing.id,
      applicantId: existing.applicantId || undefined,
      description: `Updated invoice ${existing.invoiceNumber}`,
      oldValue: { status: existing.status },
      newValue: { status: updated.status },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Invoice updated successfully.',
    });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update invoice' },
      { status: 500 }
    );
  }
}
