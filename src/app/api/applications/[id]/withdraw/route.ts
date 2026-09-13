import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getCurrentApplicant } from '@/lib/portal-auth';
import { applicationWithdrawalSchema } from '@/lib/validations/application';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = applicationWithdrawalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { withdrawalReason, notes } = parsed.data;

    // Dual auth check: Staff OR Candidate owner
    const [user, applicant] = await Promise.all([
      getCurrentUser(),
      getCurrentApplicant(),
    ]);

    if (!user && !applicant) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

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

    // IDOR authorization check
    let actorType: 'STAFF' | 'APPLICANT' = 'STAFF';
    let actorId = '';
    let actorRole = 'STAFF';

    if (applicant) {
      if (application.applicantId !== applicant.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized to withdraw this application' }, { status: 403 });
      }
      actorType = 'APPLICANT';
      actorId = applicant.id;
      actorRole = 'APPLICANT';
    } else if (user) {
      actorType = 'STAFF';
      actorId = user.id;
      actorRole = (user as any).role?.name || 'STAFF';
    }

    if (application.status === 'WITHDRAWN') {
      return NextResponse.json(
        { success: false, error: 'This application has already been withdrawn' },
        { status: 400 }
      );
    }

    const fromStatus = application.status;
    const toStatus = 'WITHDRAWN';

    const updated = await prisma.$transaction(async (tx) => {
      // If was selected, decrement filled count
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
          withdrawnAt: new Date(),
          withdrawalReason,
          notes: notes ? `${application.notes || ''}\nWithdrawal notes: ${notes}`.trim() : application.notes,
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStage: fromStatus,
          toStage: toStatus,
          fromStatus,
          toStatus,
          changedById: actorType === 'STAFF' ? actorId : null,
          changedByRole: actorRole,
          reason: withdrawalReason,
          notes: `Application withdrawn by ${actorType.toLowerCase()}. Reason: ${withdrawalReason}`,
        },
      });

      return app;
    });

    // Audit log
    await createAuditLog({
      userId: actorType === 'STAFF' ? actorId : undefined,
      applicantId: application.applicantId,
      actorType,
      action: 'APPLICATION_STATUS_CHANGE',
      entity: 'APPLICATION',
      entityId: application.id,
      description: `Application ${application.applicationCode} WITHDRAWN by ${actorRole}. Reason: ${withdrawalReason}`,
      newValue: {
        fromStatus,
        toStatus,
        withdrawalReason,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Application withdrawn successfully',
    });
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return NextResponse.json({ success: false, error: 'Failed to withdraw application' }, { status: 500 });
  }
}
