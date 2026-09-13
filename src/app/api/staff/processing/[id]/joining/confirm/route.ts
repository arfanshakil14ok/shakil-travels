import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { joiningConfirmSchema } from '@/lib/validations/processing';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const parsed = joiningConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { joiningDate, joiningLocation, employerContact, confirmationDocumentId, notes } = parsed.data;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      include: {
        applicant: true,
        job: true,
        employer: true,
      },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    if (pc.overallStatus === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Cannot confirm joining for a cancelled case' }, { status: 400 });
    }

    if (pc.currentStage !== 'DEPARTED' && !body.forceOverride) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot confirm joining. Candidate must be in DEPARTED stage (Current: ${pc.currentStage}).`,
        },
        { status: 400 }
      );
    }

    const jDate = new Date(joiningDate);
    const markCompleted = body.markCompleted !== false; // default true to complete recruitment

    const joiningCase = await prisma.joiningCase.upsert({
      where: { processingCaseId: pc.id },
      create: {
        processingCaseId: pc.id,
        candidateId: pc.applicantId,
        employerId: pc.employerId,
        joiningDate: jDate,
        joiningLocation: joiningLocation || pc.employer?.city || null,
        employerContact: employerContact || pc.employer?.phone || null,
        status: 'JOINED',
        confirmationDocumentId: confirmationDocumentId || null,
        notes: notes || null,
      },
      update: {
        joiningDate: jDate,
        joiningLocation: joiningLocation || undefined,
        employerContact: employerContact || undefined,
        status: 'JOINED',
        confirmationDocumentId: confirmationDocumentId || undefined,
        notes: notes || undefined,
      },
    });

    const previousStage = pc.currentStage;
    const finalStage = markCompleted ? 'COMPLETED' : 'JOINED';
    const finalOverallStatus = markCompleted ? 'COMPLETED' : 'ACTIVE';

    await prisma.$transaction([
      prisma.recruitmentProcessingCase.update({
        where: { id: pc.id },
        data: {
          currentStage: finalStage,
          overallStatus: finalOverallStatus,
        },
      }),
      prisma.processingStatusHistory.create({
        data: {
          processingCaseId: pc.id,
          fromStage: previousStage,
          toStage: finalStage,
          changedById: currentUser.id,
          reason: markCompleted
            ? 'Overseas joining confirmed and recruitment cycle completed successfully'
            : 'Candidate successfully joined overseas employer',
          notes: notes || `Joined on ${jDate.toISOString().split('T')[0]} at ${joiningLocation || 'Site'}`,
        },
      }),
      prisma.notification.create({
        data: {
          applicantId: pc.applicantId,
          title: 'Overseas Deployment Completed! / বিদেশি কর্মসংস্থান সম্পন্ন!',
          message: `Congratulations! Your arrival and joining at ${pc.employer?.companyName || 'your employer'} for ${pc.job.title} has been officially recorded.`,
          type: 'SUCCESS',
          link: `/portal/processing/${pc.id}`,
        },
      }),
    ]);

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'UPDATE',
      entity: 'JOINING_CASE',
      entityId: joiningCase.id,
      description: `Confirmed candidate joined employer for case ${pc.processingCode}`,
      metadata: { processingCaseId: pc.id, joiningDate: jDate, markCompleted },
    });

    return NextResponse.json({
      success: true,
      message: 'Candidate joining confirmed and recruitment completed successfully',
      data: joiningCase,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error confirming joining:', error);
    return NextResponse.json({ success: false, error: 'Failed to confirm joining' }, { status: 500 });
  }
}
