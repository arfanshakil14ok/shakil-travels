import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { visaInformationSchema } from '@/lib/validations/visa';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await prisma.visaInformation.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        country: true,
      },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Visa information not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error fetching visa info by ID/slug:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch visa info' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('VISA_INFO_MANAGE');
    const { id } = await params;
    const body = await request.json();

    const parsed = visaInformationSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.visaInformation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Visa information not found' }, { status: 404 });
    }

    const updated = await prisma.visaInformation.update({
      where: { id },
      data: {
        ...parsed.data,
        lastVerifiedAt: new Date(),
        updatedById: currentUser.id,
      },
      include: {
        country: { select: { id: true, name: true, code: true } },
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'VISA_INFO_EDIT',
      entity: 'VISA_INFORMATION',
      entityId: id,
      oldValue: { title: existing.title },
      newValue: { title: updated.title },
    });

    return NextResponse.json({ success: true, data: updated, message: 'Visa information updated' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating visa information:', error);
    return NextResponse.json({ success: false, error: 'Failed to update visa information' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('VISA_INFO_MANAGE');
    const { id } = await params;

    const existing = await prisma.visaInformation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Visa information not found' }, { status: 404 });
    }

    await prisma.visaInformation.delete({ where: { id } });

    await createAuditLog({
      userId: currentUser.id,
      action: 'VISA_INFO_DELETE',
      entity: 'VISA_INFORMATION',
      entityId: id,
      oldValue: { title: existing.title },
    });

    return NextResponse.json({ success: true, message: 'Visa information removed' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting visa information:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete visa information' }, { status: 500 });
  }
}
