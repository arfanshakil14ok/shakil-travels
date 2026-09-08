import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { documentTypeSchema } from '@/lib/validations/document';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('DOCUMENT_VIEW');
    const { id } = await params;

    const docType = await prisma.documentType.findUnique({
      where: { id },
      include: {
        _count: { select: { documents: true } },
      },
    });

    if (!docType) {
      return NextResponse.json({ success: false, error: 'Document type not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: docType });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch document type' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('SETTINGS_MANAGE');
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.documentType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Document type not found' }, { status: 404 });
    }

    const parsed = documentTypeSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.documentType.update({
      where: { id },
      data: parsed.data,
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'DOCUMENT_TYPE_EDIT',
      entity: 'DOCUMENT_TYPE',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Document type updated successfully',
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to update document type' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('SETTINGS_MANAGE');
    const { id } = await params;

    const existing = await prisma.documentType.findUnique({
      where: { id },
      include: { _count: { select: { documents: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Document type not found' }, { status: 404 });
    }

    if (existing._count.documents > 0) {
      // Soft-delete by setting isActive to false
      const disabled = await prisma.documentType.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        data: disabled,
        message: 'Document type has associated candidate documents. Deactivated instead of deleted.',
      });
    }

    await prisma.documentType.delete({ where: { id } });

    await createAuditLog({
      userId: currentUser.id,
      action: 'DOCUMENT_TYPE_DELETE',
      entity: 'DOCUMENT_TYPE',
      entityId: id,
      oldValue: existing,
    });

    return NextResponse.json({ success: true, message: 'Document type deleted successfully' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to delete document type' }, { status: 500 });
  }
}
