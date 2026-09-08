import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { documentTypeSchema } from '@/lib/validations/document';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('DOCUMENT_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (isActive !== null && isActive !== undefined && isActive !== 'ALL') {
      where.isActive = isActive === 'true';
    }

    const documentTypes = await prisma.documentType.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { documents: true } },
      },
    });

    return NextResponse.json({ success: true, data: documentTypes });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching document types:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch document types' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('SETTINGS_MANAGE');
    const body = await request.json();

    const parsed = documentTypeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existing = await prisma.documentType.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Document type with code "${data.code}" already exists.` },
        { status: 409 }
      );
    }

    const documentType = await prisma.documentType.create({
      data: {
        name: data.name,
        code: data.code,
        isRequired: data.isRequired || false,
        description: data.description || null,
        requiresExpiry: (data as any).requiresExpiry || false,
        applicableCategoryId: (data as any).applicableCategoryId || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'DOCUMENT_TYPE_CREATE',
      entity: 'DOCUMENT_TYPE',
      entityId: documentType.id,
      newValue: documentType,
    });

    return NextResponse.json({
      success: true,
      data: documentType,
      message: `Document type "${documentType.name}" created successfully`,
    }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating document type:', error);
    return NextResponse.json({ success: false, error: 'Failed to create document type' }, { status: 500 });
  }
}
