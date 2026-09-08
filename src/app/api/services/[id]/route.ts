import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { serviceSchema } from '@/lib/validations/accounting';
import { createAuditLog } from '@/lib/audit';
import { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('INVOICE_VIEW');
    const { id } = await params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: { select: { invoiceItems: true } },
      },
    });

    if (!service) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: service });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch service' }, { status: 500 });
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

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
    }

    const parsed = serviceSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: any = { ...data };
    if (data.defaultAmount !== undefined) {
      updateData.defaultAmount = new Prisma.Decimal(data.defaultAmount.toFixed(2));
    }

    const updated = await prisma.service.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'SERVICE_EDIT',
      entity: 'SERVICE',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Service updated successfully',
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('INVOICE_EDIT');
    const { id } = await params;

    const existing = await prisma.service.findUnique({
      where: { id },
      include: { _count: { select: { invoiceItems: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
    }

    if (existing._count.invoiceItems > 0) {
      // Soft-delete by setting isActive to false
      const deactivated = await prisma.service.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        data: deactivated,
        message: 'Service has existing invoice records. Deactivated instead of deleted.',
      });
    }

    await prisma.service.delete({ where: { id } });

    await createAuditLog({
      userId: currentUser.id,
      action: 'SERVICE_DELETE',
      entity: 'SERVICE',
      entityId: id,
      oldValue: existing,
    });

    return NextResponse.json({ success: true, message: 'Service deleted successfully' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to delete service' }, { status: 500 });
  }
}
