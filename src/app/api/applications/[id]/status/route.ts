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
        await tx.job.update({
          where: { id: application.jobId },
          data: { filledCount: { increment: 1 } },
        });
      } else if (toStatus === 'SHORTLISTED' && !application.shortlistedAt) {
        updateData.shortlistedAt = new Date();
      } else if (toStatus === 'INTERVIEWED' && !application.interviewedAt) {
        updateData.interviewedAt = new Date();
      } else if (toStatus === 'REJECTED') {
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = notes || 'Application rejected';
        if (fromStatus === 'SELECTED') {
          await tx.job.update({
            where: { id: application.jobId },
            data: { filledCount: { decrement: 1 } },
          });
        }
      } else if (toStatus === 'WITHDRAWN') {
        updateData.withdrawnAt = new Date();
        updateData.withdrawalReason = notes || 'Application withdrawn';
        if (fromStatus === 'SELECTED') {
          await tx.job.update({
            where: { id: application.jobId },
            data: { filledCount: { decrement: 1 } },
          });
        }
      } else if (toStatus === 'RECRUITMENT_COMPLETED' && !application.completedAt) {
        updateData.completedAt = new Date();
      }

      const updatedApplication = await tx.application.update({
        where: { id: application.id },
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
          applicationId: application.id,
          fromStage: fromStatus,
          toStage: toStatus,
          fromStatus,
          toStatus,
          changedById: currentUser.id,
          changedByRole: (currentUser as any).role?.name || 'STAFF',
          notes: notes || `Recruitment status moved from ${fromStatus} to ${toStatus}`,
        },
      });

      // Synchronize applicant status where applicable
      let newApplicantStatus: any = null;
      if (toStatus === 'SELECTED') {
        newApplicantStatus = 'SELECTED';
      } else if (toStatus === 'VISA_STAMPED' || toStatus === 'TICKET_CONFIRMED' || toStatus === 'DEPLOYED' || toStatus === 'RECRUITMENT_COMPLETED') {
        newApplicantStatus = 'DEPLOYED';
      } else if ((toStatus === 'REJECTED' || toStatus === 'WITHDRAWN') && application.applicant.status !== 'DEPLOYED') {
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
      applicantId: application.applicantId,
      actorType: 'STAFF',
      action: 'APPLICATION_STATUS_CHANGE',
      entity: 'APPLICATION',
      entityId: id,
      description: `Application ${application.applicationNumber} stage advanced from ${fromStatus} to ${toStatus} by ${currentUser.name}`,
      oldValue: { status: fromStatus },
      newValue: {
        status: toStatus,
        notes,
        applicationNumber: application.applicationNumber,
      },
    });

    // Notify candidate in portal
    await prisma.notification.create({
      data: {
        applicantId: application.applicantId,
        type: 'STATUS_UPDATED',
        title: 'আবেদনের অগ্রগতির স্ট্যাটাস আপডেট',
        message: `আপনার আবেদনের (${application.applicationNumber}) বর্তমান ধাপ পরিবর্তিত হয়ে "${toStatus.replace(/_/g, ' ')}" নির্ধারণ করা হয়েছে।`,
        link: '/portal/applications',
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
