import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { clearanceCompleteSchema } from '@/lib/validations/processing';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const parsed = clearanceCompleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { smartCardNumber, certificateNumber, issueDate, expiryDate, documentId, notes } = parsed.data;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      include: { applicant: true, job: true },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    if (pc.overallStatus === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Cannot complete clearance for a cancelled case' }, { status: 400 });
    }

    const iDate = issueDate ? new Date(issueDate) : new Date();
    const expDate = expiryDate ? new Date(expiryDate) : null;

    const clearanceCase = await prisma.clearanceCase.upsert({
      where: { processingCaseId: pc.id },
      create: {
        processingCaseId: pc.id,
        candidateId: pc.applicantId,
        status: 'COMPLETED',
        smartCardNumber: smartCardNumber || null,
        certificateNumber: certificateNumber || null,
        issueDate: iDate,
        expiryDate: expDate,
        documentId: documentId || null,
        notes: notes || null,
      },
      update: {
        status: 'COMPLETED',
        smartCardNumber: smartCardNumber || undefined,
        certificateNumber: certificateNumber || undefined,
        issueDate: iDate,
        expiryDate: expDate,
        documentId: documentId || undefined,
        notes: notes || undefined,
      },
    });

    const previousStage = pc.currentStage;
    const newStage = 'CLEARANCE_COMPLETED';

    await prisma.$transaction([
      prisma.recruitmentProcessingCase.update({
        where: { id: pc.id },
        data: { currentStage: newStage },
      }),
      prisma.processingStatusHistory.create({
        data: {
          processingCaseId: pc.id,
          fromStage: previousStage,
          toStage: newStage,
          changedById: currentUser.id,
          reason: 'Clearance & BMET Smart Card issued successfully',
          notes: notes || `Smart Card: ${smartCardNumber || 'N/A'}, Cert: ${certificateNumber || 'N/A'}`,
        },
      }),
      prisma.notification.create({
        data: {
          applicantId: pc.applicantId,
          title: 'BMET Clearance & Smart Card Issued / বিএমইটি ছাড়পত্র সম্পন্ন',
          message: `Your BMET smart card and government emigration clearance for ${pc.job.title} have been issued.`,
          type: 'SUCCESS',
          link: `/portal/processing/${pc.id}`,
        },
      }),
    ]);

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'UPDATE',
      entity: 'CLEARANCE_CASE',
      entityId: clearanceCase.id,
      description: `Clearance completed for case ${pc.processingCode}`,
      metadata: { processingCaseId: pc.id, smartCardNumber, certificateNumber },
    });

    return NextResponse.json({
      success: true,
      message: 'Clearance completed successfully',
      data: clearanceCase,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error completing clearance:', error);
    return NextResponse.json({ success: false, error: 'Failed to complete clearance' }, { status: 500 });
  }
}
