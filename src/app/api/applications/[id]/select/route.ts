import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { applicationSelectionSchema } from '@/lib/validations/application';
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

    const parsed = applicationSelectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { selectionNotes, selectedPosition, forceOverride, overrideReason } = parsed.data;

    const application = await prisma.application.findFirst({
      where: {
        OR: [{ id }, { applicationCode: id }, { applicationNumber: id }],
      },
      include: {
        applicant: true,
        job: {
          include: {
            employer: true,
            country: true,
            jobCategory: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    if (application.status === 'SELECTED') {
      return NextResponse.json(
        { success: false, error: 'This candidate application is already selected.' },
        { status: 400 }
      );
    }

    // Vacancy limit check
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

    const fromStatus = application.status;
    const toStatus = 'SELECTED';

    // Prepare immutable historical snapshots
    const jobSnapshot = {
      id: application.job.id,
      jobCode: application.job.jobCode,
      title: application.job.title,
      titleLocal: application.job.titleLocal,
      country: application.job.country?.name,
      category: application.job.jobCategory?.name,
    };

    const employerSnapshot = application.job.employer
      ? {
          id: application.job.employer.id,
          employerCode: application.job.employer.employerCode,
          companyName: application.job.employer.companyName,
        }
      : null;

    const salarySnapshot = {
      salaryMin: application.job.salaryMin,
      salaryMax: application.job.salaryMax,
      currency: application.job.currency,
      salaryPeriod: application.job.salaryPeriod,
    };

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update application
      const updatedApp = await tx.application.update({
        where: { id: application.id },
        data: {
          status: toStatus,
          currentStage: toStatus,
          selectedAt: new Date(),
          selectionNotes: selectionNotes || null,
          selectedPosition: selectedPosition || application.job.title,
          jobSnapshot: jobSnapshot as any,
          employerSnapshot: employerSnapshot as any,
          salarySnapshot: salarySnapshot as any,
        },
      });

      // 2. Increment filledCount on Job
      await tx.job.update({
        where: { id: application.jobId },
        data: {
          filledCount: { increment: 1 },
        },
      });

      // 3. Update candidate status to SELECTED
      await tx.applicant.update({
        where: { id: application.applicantId },
        data: { status: 'SELECTED' },
      });

      // 4. Create status history
      const historyNotes = forceOverride && overrideReason
        ? `Candidate selected for ${application.job.title}. (Quota override granted: ${overrideReason})`
        : `Candidate selected for overseas vacancy ${application.job.title}. Selection notes: ${selectionNotes || 'None'}`;

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStage: fromStatus,
          toStage: toStatus,
          fromStatus,
          toStatus,
          changedById: currentUser.id,
          changedByRole: (currentUser as any).role?.name || 'STAFF',
          notes: historyNotes,
        },
      });

      return updatedApp;
    });

    // Audit log
    await createAuditLog({
      userId: currentUser.id,
      applicantId: application.applicantId,
      actorType: 'STAFF',
      action: 'APPLICATION_STATUS_CHANGE',
      entity: 'APPLICATION',
      entityId: application.id,
      description: `Candidate ${application.applicant.fullName} SELECTED for ${application.job.title}${forceOverride ? ' (Quota Override)' : ''}`,
      newValue: {
        fromStatus,
        toStatus,
        selectedPosition: selectedPosition || application.job.title,
        jobCode: application.job.jobCode,
        forceOverride,
        overrideReason: overrideReason || null,
      },
    });

    // Notify candidate
    await prisma.notification.create({
      data: {
        applicantId: application.applicantId,
        type: 'APPLICATION_STATUS_CHANGED',
        title: 'অভিনন্দন! আপনি চূড়ান্তভাবে নির্বাচিত হয়েছেন',
        message: `আপনার "${application.job.title}" পদের আবেদন গৃহীত হয়েছে এবং আপনি চূড়ান্তভাবে নির্বাচিত হয়েছেন। পরবর্তী প্রসেসিং (মেডিকেল ও ভিসা) এর জন্য প্রস্তুত থাকুন।`,
        link: `/portal/applications/${application.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Candidate ${application.applicant.fullName} successfully selected for ${application.job.title}`,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Selection error:', error);
    return NextResponse.json({ success: false, error: 'Failed to select candidate' }, { status: 500 });
  }
}
