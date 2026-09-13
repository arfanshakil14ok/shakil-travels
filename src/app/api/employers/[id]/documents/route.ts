import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const documentSchema = z.object({
  documentType: z.enum([
    'COMPANY_REGISTRATION',
    'DEMAND_LETTER',
    'RECRUITMENT_AGREEMENT',
    'JOB_ORDER',
    'AUTHORIZATION_LETTER',
    'OTHER',
  ]),
  title: z.string().min(2, 'Document title is required'),
  fileUrl: z.string().min(1, 'fileUrl is required'),
  verificationStatus: z.enum(['STAFF_ONLY', 'VERIFIED', 'REJECTED']).default('STAFF_ONLY'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('EMPLOYER_VIEW');
    const { id } = await params;

    const employer = await prisma.employer.findFirst({
      where: { OR: [{ id }, { employerCode: id }] },
    });

    if (!employer) {
      return NextResponse.json({ success: false, error: 'Employer not found' }, { status: 404 });
    }

    const documents = await prisma.employerDocument.findMany({
      where: { employerId: employer.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: documents });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching employer documents:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('EMPLOYER_EDIT');
    const { id } = await params;
    const body = await request.json();

    const employer = await prisma.employer.findFirst({
      where: { OR: [{ id }, { employerCode: id }] },
    });

    if (!employer) {
      return NextResponse.json({ success: false, error: 'Employer not found' }, { status: 404 });
    }

    const parsed = documentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const doc = await prisma.employerDocument.create({
      data: {
        employerId: employer.id,
        documentType: parsed.data.documentType,
        title: parsed.data.title,
        fileUrl: parsed.data.fileUrl,
        verificationStatus: parsed.data.verificationStatus,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'EMPLOYER_DOCUMENT_UPLOAD',
      entity: 'EmployerDocument',
      entityId: doc.id,
      newValue: doc,
    });

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating employer document:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload document' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('EMPLOYER_EDIT');
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ success: false, error: 'documentId is required' }, { status: 400 });
    }

    const employer = await prisma.employer.findFirst({
      where: { OR: [{ id }, { employerCode: id }] },
    });

    if (!employer) {
      return NextResponse.json({ success: false, error: 'Employer not found' }, { status: 404 });
    }

    const existing = await prisma.employerDocument.findFirst({
      where: { id: documentId, employerId: employer.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    await prisma.employerDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting document:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete document' }, { status: 500 });
  }
}
