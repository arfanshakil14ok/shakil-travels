import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { visaApproveSchema } from '@/lib/validations/processing';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const parsed = visaApproveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { approvedDate, expiryDate, visaDocumentId, notes } = parsed.data;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      include: {
        applicant: true,
        job: true,
      },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    if (pc.overallStatus === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Cannot approve visa for a cancelled case' }, { status: 400 });
    }

    const appDate = approvedDate ? new Date(approvedDate) : new Date();
    const expDate = expiryDate ? new Date(expiryDate) : null;

    const visaCase = await prisma.visaCase.upsert({
      where: { processingCaseId: pc.id },
      create: {
        processingCaseId: pc.id,
        candidateId: pc.applicantId,
        country: 'Saudi Arabia',
        visaType: 'EMPLOYMENT_VISA',
        status: 'APPROVED',
        approvedDate: appDate,
        expiryDate: expDate,
        visaDocumentId: visaDocumentId || null,
        notes: notes || null,
      },
      update: {
        status: 'APPROVED',
        approvedDate: appDate,
        expiryDate: expDate,
        visaDocumentId: visaDocumentId || undefined,
        notes: notes || undefined,
      },
    });

    const previousStage = pc.currentStage;
    const newStage = 'VISA_APPROVED';

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
          reason: 'Visa approved by embassy/consulate',
          notes: notes || `Approved on ${appDate.toISOString().split('T')[0]}`,
        },
      }),
      prisma.notification.create({
        data: {
          applicantId: pc.applicantId,
          title: 'Visa Approved! / ভিসা অনুমোদিত হয়েছে!',
          message: `Great news! Your employment visa for ${pc.job.title} has been approved.`,
          type: 'SUCCESS',
          link: `/portal/processing/${pc.id}`,
        },
      }),
    ]);

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'UPDATE',
      entity: 'VISA_CASE',
      entityId: visaCase.id,
      description: `Visa approved for case ${pc.processingCode}`,
      metadata: { processingCaseId: pc.id, approvedDate: appDate, expiryDate: expDate },
    });

    return NextResponse.json({
      success: true,
      message: 'Visa approved successfully',
      data: visaCase,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error approving visa:', error);
    return NextResponse.json({ success: false, error: 'Failed to approve visa' }, { status: 500 });
  }
}
