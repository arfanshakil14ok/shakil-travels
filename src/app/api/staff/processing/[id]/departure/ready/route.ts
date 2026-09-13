import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { checkDepartureReadiness } from '@/lib/processing/state-machine';
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
      select: { id: true },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    const readiness = await checkDepartureReadiness(prisma, pc.id);

    return NextResponse.json({ success: true, data: readiness });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error checking departure readiness:', error);
    return NextResponse.json({ success: false, error: 'Failed to check departure readiness' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

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

    const readiness = await checkDepartureReadiness(prisma, pc.id);

    const { forceOverride, overrideReason, notes } = body;

    if (!readiness.ready && !forceOverride) {
      return NextResponse.json(
        {
          success: false,
          error: 'Candidate is not departure ready. 5-pillar checks incomplete.',
          blockers: readiness.blockers,
          pillarStatus: readiness.pillarStatus,
        },
        { status: 400 }
      );
    }

    const previousStage = pc.currentStage;
    const newStage = 'DEPARTURE_READY';

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
          reason: forceOverride
            ? `Admin Override: ${overrideReason || 'Bypassed blockers'}`
            : 'All 5 departure readiness pillars verified successfully',
          notes: notes || null,
        },
      }),
      prisma.notification.create({
        data: {
          applicantId: pc.applicantId,
          title: 'Ready for Overseas Departure! / বিদেশ যাত্রার জন্য সম্পূর্ণ প্রস্তুত!',
          message: `All documentation, medical, visa, clearance, and flight arrangements for ${pc.job.title} are verified. You are departure ready!`,
          type: 'SUCCESS',
          link: `/portal/processing/${pc.id}`,
        },
      }),
    ]);

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'UPDATE',
      entity: 'RECRUITMENT_PROCESSING_CASE',
      entityId: pc.id,
      description: `Marked case ${pc.processingCode} as DEPARTURE_READY`,
      metadata: { processingCaseId: pc.id, readiness, forceOverride },
    });

    return NextResponse.json({
      success: true,
      message: 'Case successfully marked as DEPARTURE_READY',
      data: { stage: newStage, readiness },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error confirming departure readiness:', error);
    return NextResponse.json({ success: false, error: 'Failed to confirm departure readiness' }, { status: 500 });
  }
}
