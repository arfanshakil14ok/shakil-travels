import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { applicationRejectionSchema } from '@/lib/validations/application';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('APPLICATION_STATUS_CHANGE');
    const { id } = await params;
    const body = await request.json();

    const parsed = applicationRejectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { rejectionReason, internalNotes, candidateFeedback } = parsed.data;

    const application = await prisma.application.findFirst({
      where: {
        OR: [{ id }, { applicationCode: id }, { applicationNumber: id }],
      },
      include: {
        applicant: true,
        job: true,
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const fromStatus = application.status;
    const toStatus = 'REJECTED';

    const updated = await prisma.$transaction(async (tx) => {
      // If was previously selected, revert filled count and candidate status
      if (fromStatus === 'SELECTED') {
        await tx.job.update({
          where: { id: application.jobId },
          data: { filledCount: { decrement: 1 } },
        });

        await tx.applicant.update({
          where: { id: application.applicantId },
          data: { status: 'ACTIVE' },
        });
      }

      const app = await tx.application.update({
        where: { id: application.id },
        data: {
          status: toStatus,
          currentStage: toStatus,
          rejectedAt: new Date(),
          rejectionReason,
          internalNotes: internalNotes || application.internalNotes || null,
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStage: fromStatus,
          toStage: toStatus,
          fromStatus,
          toStatus,
          changedById: currentUser.id,
          changedByRole: (currentUser as any).role?.name || 'STAFF',
          reason: rejectionReason,
          notes: `Application rejected. Reason: ${rejectionReason}. ${internalNotes ? `Internal note: ${internalNotes}` : ''}`,
        },
      });

      return app;
    });

    // Audit log
    await createAuditLog({
      userId: currentUser.id,
      applicantId: application.applicantId,
      actorType: 'STAFF',
      action: 'APPLICATION_STATUS_CHANGE',
      entity: 'APPLICATION',
      entityId: application.id,
      description: `Application ${application.applicationCode} REJECTED for ${application.applicant?.fullName}. Reason: ${rejectionReason}`,
      newValue: {
        fromStatus,
        toStatus,
        rejectionReason,
      },
    });

    // Safe candidate notification (excluding private internal notes)
    const safeFeedbackMessage = candidateFeedback
      ? candidateFeedback
      : `আপনার "${application.job?.title}" পদের আবেদনটি এই মুহূর্তে বিবেচনা করা সম্ভব হচ্ছে না। পরবর্তীতে অন্য নিয়োগ সার্কুলারে আবেদন করার অনুরোধ করা হচ্ছে।`;

    await prisma.notification.create({
      data: {
        applicantId: application.applicantId,
        type: 'APPLICATION_STATUS_CHANGED',
        title: 'আবেদনের ফলাফল আপডেট',
        message: safeFeedbackMessage,
        link: `/portal/applications/${application.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Application rejected successfully',
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Rejection error:', error);
    return NextResponse.json({ success: false, error: 'Failed to reject application' }, { status: 500 });
  }
}
