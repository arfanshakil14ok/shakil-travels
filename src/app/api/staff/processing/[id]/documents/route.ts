import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { documentRequirementCreateSchema } from '@/lib/validations/processing';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      select: { id: true, applicantId: true },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    const [requirements, applicantDocuments] = await Promise.all([
      prisma.processingDocumentRequirement.findMany({
        where: { processingCaseId: pc.id },
        include: {
          document: true,
          verifiedBy: { select: { id: true, name: true } },
        },
        orderBy: [{ required: 'desc' }, { createdAt: 'asc' }],
      }),
      prisma.document.findMany({
        where: { applicantId: pc.applicantId },
        include: { documentType: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        requirements,
        applicantDocuments,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching processing documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch processing documents' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const parsed = documentRequirementCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    const createdReq = await prisma.processingDocumentRequirement.create({
      data: {
        processingCaseId: pc.id,
        documentType: parsed.data.documentType,
        title: parsed.data.title,
        titleLocal: parsed.data.titleLocal || null,
        required: parsed.data.required,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        notes: parsed.data.notes || null,
        status: 'REQUIRED',
      },
    });

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'CREATE',
      entity: 'DOCUMENT_REQUIREMENT',
      entityId: createdReq.id,
      description: `Added document requirement "${createdReq.title}" to processing case ${pc.processingCode}`,
      metadata: { processingCaseId: pc.id, documentType: createdReq.documentType },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Document requirement added successfully',
        data: createdReq,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error adding document requirement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add document requirement' },
      { status: 500 }
    );
  }
}
