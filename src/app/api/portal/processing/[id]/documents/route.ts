import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const applicant = await requireApplicantAuth();
    const { id } = await params;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { processingCode: id }] },
          { applicantId: applicant.id },
        ],
      },
      select: { id: true },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    const requirements = await prisma.processingDocumentRequirement.findMany({
      where: { processingCaseId: pc.id },
      include: { document: true },
      orderBy: [{ required: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ success: true, data: requirements });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal processing documents list error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const applicant = await requireApplicantAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const { requirementId, fileUrl, title, fileType, fileSize } = body;

    if (!requirementId) {
      return NextResponse.json({ success: false, error: 'requirementId is required' }, { status: 400 });
    }
    if (!fileUrl) {
      return NextResponse.json({ success: false, error: 'fileUrl is required' }, { status: 400 });
    }

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { processingCode: id }] },
          { applicantId: applicant.id },
        ],
      },
      include: {
        application: true,
      },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    const requirement = await prisma.processingDocumentRequirement.findFirst({
      where: {
        id: requirementId,
        processingCaseId: pc.id,
      },
    });

    if (!requirement) {
      return NextResponse.json({ success: false, error: 'Document requirement not found' }, { status: 404 });
    }

    let docType = await prisma.documentType.findFirst({
      where: { code: requirement.documentType },
    });
    if (!docType) {
      docType = await prisma.documentType.findFirst();
    }
    if (!docType) {
      docType = await prisma.documentType.create({
        data: {
          code: requirement.documentType,
          name: requirement.title,
        },
      });
    }

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        applicantId: applicant.id,
        applicationId: pc.applicationId,
        documentTypeId: docType.id,
        fileName: `${requirement.documentType.toLowerCase()}.pdf`,
        filePath: fileUrl,
        fileUrl,
        fileSize: fileSize || 102400,
        mimeType: fileType || 'application/pdf',
        status: 'PENDING',
      },
    });

    // Link document to requirement and mark as UPLOADED
    const updatedRequirement = await prisma.processingDocumentRequirement.update({
      where: { id: requirement.id },
      data: {
        documentId: document.id,
        status: 'UPLOADED',
        rejectionReason: null,
      },
      include: { document: true },
    });

    // Check if case is in DOCUMENT_PROCESSING and all required documents are uploaded
    const unuploadedRequired = await prisma.processingDocumentRequirement.findMany({
      where: {
        processingCaseId: pc.id,
        required: true,
        status: 'REQUIRED',
      },
    });

    if (pc.currentStage === 'DOCUMENT_PROCESSING' && unuploadedRequired.length === 0) {
      // Auto-advance to DOCUMENT_VERIFICATION
      await prisma.$transaction([
        prisma.recruitmentProcessingCase.update({
          where: { id: pc.id },
          data: { currentStage: 'DOCUMENT_VERIFICATION' },
        }),
        prisma.processingStatusHistory.create({
          data: {
            processingCaseId: pc.id,
            fromStage: 'DOCUMENT_PROCESSING',
            toStage: 'DOCUMENT_VERIFICATION',
            reason: 'All mandatory documents uploaded by candidate',
          },
        }),
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      data: updatedRequirement,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal upload document error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload document' }, { status: 500 });
  }
}
