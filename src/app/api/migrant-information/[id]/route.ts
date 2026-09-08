import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { migrantInformationSchema } from '@/lib/validations/migrant';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await prisma.migrantInformation.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        countryRef: true,
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Migrant advisory not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error fetching migrant advisory:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch migrant advisory' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('MIGRANT_INFO_EDIT');
    const { id } = await params;
    const body = await request.json();

    const parsed = migrantInformationSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.migrantInformation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Migrant advisory not found' }, { status: 404 });
    }

    const updated = await prisma.migrantInformation.update({
      where: { id },
      data: {
        ...parsed.data,
        lastVerifiedAt: new Date(),
        updatedById: currentUser.id,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'MIGRANT_INFO_EDIT',
      entity: 'MIGRANT_INFORMATION',
      entityId: id,
      oldValue: { title: existing.title, status: existing.status },
      newValue: { title: updated.title, status: updated.status },
    });

    return NextResponse.json({ success: true, data: updated, message: 'Advisory updated successfully' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating migrant advisory:', error);
    return NextResponse.json({ success: false, error: 'Failed to update migrant advisory' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('MIGRANT_INFO_DELETE');
    const { id } = await params;

    const existing = await prisma.migrantInformation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Migrant advisory not found' }, { status: 404 });
    }

    await prisma.migrantInformation.delete({ where: { id } });

    await createAuditLog({
      userId: currentUser.id,
      action: 'MIGRANT_INFO_DELETE',
      entity: 'MIGRANT_INFORMATION',
      entityId: id,
      oldValue: { title: existing.title },
    });

    return NextResponse.json({ success: true, message: 'Migrant advisory removed' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting migrant advisory:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete migrant advisory' }, { status: 500 });
  }
}
