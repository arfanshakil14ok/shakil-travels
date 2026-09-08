import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { updateApplicationStatusSchema } from '@/lib/validations/application';
import { validateVacancyLimit } from '@/lib/recruitment/vacancy';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('APPLICATION_STATUS_CHANGE');
    const { id } = await params;
    const body = await request.json();

    const parsed = updateApplicationStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { toStatus, notes } = parsed.data;
    const forceOverride = body.forceOverride === true;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        applicant: true,
        job: true,
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const fromStatus = application.status || application.currentStage;

    // Check vacancy limits if transitioning to SELECTED
    if (toStatus === 'SELECTED' && fromStatus !== 'SELECTED') {
      const vacancyCheck = await validateVacancyLimit(prisma, application.jobId, forceOverride);
      if (!vacancyCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: vacancyCheck.reason,
            data: {
              vacancyStats: vacancyCheck.stats,
              requiresOverride: true,
            },
          },
          { status: 400 }
        );
      }
    }

    // Execute state transition atomically
    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: toStatus,
        currentStage: toStatus,
      };

      if (toStatus === 'SELECTED' && !application.selectedAt) {
        updateData.selectedAt = new Date();
      } else if (toStatus === 'REJECTED') {
        updateData.rejectionReason = notes || 'Application rejected';
      } else if (toStatus === 'RECRUITMENT_COMPLETED' && !application.completedAt) {
        updateData.completedAt = new Date();
      }

      const updatedApplication = await tx.application.update({
        where: { id },
        data: updateData,
        include: {
          applicant: true,
          job: true,
          assignedStaff: { select: { id: true, name: true } },
        },
      });

      // Insert status history entry
      const historyEntry = await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStage: fromStatus,
          toStage: toStatus,
          changedById: currentUser.id,
          notes: notes || `Recruitment status moved from ${fromStatus} to ${toStatus}`,
        },
      });

      // Synchronize applicant status where applicable
      let newApplicantStatus: any = null;
      if (toStatus === 'SELECTED') {
        newApplicantStatus = 'SELECTED';
      } else if (toStatus === 'VISA_STAMPED' || toStatus === 'TICKET_CONFIRMED' || toStatus === 'DEPLOYED' || toStatus === 'RECRUITMENT_COMPLETED') {
        newApplicantStatus = 'DEPLOYED';
      } else if (toStatus === 'REJECTED' && application.applicant.status !== 'DEPLOYED') {
        newApplicantStatus = 'ACTIVE';
      }

      if (newApplicantStatus && newApplicantStatus !== application.applicant.status) {
        await tx.applicant.update({
          where: { id: application.applicantId },
          data: { status: newApplicantStatus },
        });
      }

      return { updatedApplication, historyEntry };
    });

    // Audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'APPLICATION_STATUS_CHANGE',
      entity: 'APPLICATION',
      entityId: id,
      oldValue: { status: fromStatus },
      newValue: {
        status: toStatus,
        notes,
        applicationNumber: application.applicationNumber,
      },
    });

    return NextResponse.json({
      success: true,
      data: result.updatedApplication,
      history: result.historyEntry,
      message: `Application status transitioned from ${fromStatus} to ${toStatus}`,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error changing application status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update application status' }, { status: 500 });
  }
}
