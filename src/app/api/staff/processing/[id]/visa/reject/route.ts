import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { visaRejectSchema } from '@/lib/validations/processing';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const parsed = visaRejectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { rejectionReason, notes } = parsed.data;

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
      return NextResponse.json({ success: false, error: 'Cannot reject visa for a cancelled case' }, { status: 400 });
    }

    const visaCase = await prisma.visaCase.upsert({
      where: { processingCaseId: pc.id },
      create: {
        processingCaseId: pc.id,
        candidateId: pc.applicantId,
        country: 'Saudi Arabia',
        visaType: 'EMPLOYMENT_VISA',
        status: 'REJECTED',
        rejectionReason,
        notes: notes || null,
      },
      update: {
        status: 'REJECTED',
        rejectionReason,
        notes: notes || undefined,
      },
    });

    const previousStage = pc.currentStage;
    const newStage = 'VISA_REJECTED';

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
          reason: `Visa rejected: ${rejectionReason}`,
          notes: notes || null,
        },
      }),
      prisma.notification.create({
        data: {
          applicantId: pc.applicantId,
          title: 'Visa Application Update / ভিসা আবেদন আপডেট',
          message: `Your visa application was rejected by the embassy. Reason: ${rejectionReason}. Our team will contact you.`,
          type: 'WARNING',
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
      description: `Visa rejected for case ${pc.processingCode}: ${rejectionReason}`,
      metadata: { processingCaseId: pc.id, rejectionReason },
    });

    return NextResponse.json({
      success: true,
      message: 'Visa rejection recorded',
      data: visaCase,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error rejecting visa:', error);
    return NextResponse.json({ success: false, error: 'Failed to record visa rejection' }, { status: 500 });
  }
}
