import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, requireAuth, hasPermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('APPLICATION_VIEW');
    const { id } = await params;

    const application = await prisma.application.findFirst({
      where: {
        OR: [
          { id },
          { applicationCode: id },
          { applicationNumber: id },
        ],
      },
      include: {
        applicant: {
          include: {
            customer: true,
            preferredCountry: true,
            preferredJobCategory: true,
            assignedStaff: { select: { id: true, name: true, email: true } },
            candidateSkills: true,
          },
        },
        employer: true,
        country: true,
        job: {
          include: {
            employer: true,
            country: true,
            jobCategory: true,
          },
        },
        assignedStaff: {
          select: { id: true, name: true, email: true, phone: true },
        },
        screenings: {
          orderBy: { createdAt: 'desc' },
          include: {
            screenedBy: { select: { id: true, name: true, email: true } },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { id: true, name: true, email: true } },
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          include: {
            documentType: true,
            verifiedBy: { select: { id: true, name: true } },
          },
        },
        interviews: {
          orderBy: { scheduledAt: 'desc' },
          include: {
            interviewerUser: { select: { id: true, name: true, email: true } },
          },
        },
        visaApplications: true,
        processingCase: {
          include: {
            assignedOfficer: { select: { id: true, name: true, email: true } },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            payments: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const employer = application.job?.employer || application.employer || null;
    const country = application.job?.country || application.country || null;

    const normalizedApplication = {
      ...application,
      employer,
      country,
      assignedTo: application.assignedStaff || null,
      job: application.job
        ? {
            ...application.job,
            employer,
            country,
            remainingVacancies: Math.max(0, (application.job.vacancyCount || 0) - (application.job.filledCount || 0)),
          }
        : null,
    };

    return NextResponse.json({ success: true, data: normalizedApplication });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching application details:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch application details' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('APPLICATION_EDIT');
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.application.findFirst({
      where: {
        OR: [{ id }, { applicationCode: id }, { applicationNumber: id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const updated = await prisma.application.update({
      where: { id: existing.id },
      data: {
        priority: body.priority !== undefined ? body.priority : existing.priority,
        assignedStaffId: body.assignedStaffId !== undefined ? body.assignedStaffId : (body.assignedToId !== undefined ? body.assignedToId : existing.assignedStaffId),
        notes: body.notes !== undefined ? body.notes : existing.notes,
        internalNotes: body.internalNotes !== undefined ? body.internalNotes : existing.internalNotes,
      },
      include: {
        applicant: { select: { id: true, fullName: true, applicantNumber: true } },
        job: { select: { id: true, title: true } },
        assignedStaff: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'APPLICATION_EDIT',
      entity: 'APPLICATION',
      entityId: id,
      oldValue: {
        priority: existing.priority,
        assignedStaffId: existing.assignedStaffId,
        notes: existing.notes,
      },
      newValue: {
        priority: updated.priority,
        assignedStaffId: updated.assignedStaffId,
        notes: updated.notes,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        assignedTo: updated.assignedStaff,
      },
      message: 'Application updated successfully',
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating application:', error);
    return NextResponse.json({ success: false, error: 'Failed to update application' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const canDelete =
      currentUser.role?.name === 'SUPER_ADMIN' ||
      currentUser.role?.name === 'ADMIN' ||
      currentUser.role?.name === 'MANAGER' ||
      hasPermission(currentUser, 'APPLICATION_DELETE');

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'Access denied: You do not have permission to delete applications.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await prisma.application.findFirst({
      where: {
        OR: [{ id }, { applicationCode: id }, { applicationNumber: id }],
      },
      include: {
        processingCase: {
          select: { id: true },
        },
        visaApplications: {
          select: { id: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const appId = existing.id;
    const processingCaseId = existing.processingCase?.id;
    const visaAppIds = existing.visaApplications.map((v) => v.id);

    await prisma.$transaction(async (tx) => {
      // 1. If Processing Case exists, clean up all its related entities
      if (processingCaseId) {
        await tx.medicalCase.deleteMany({ where: { processingCaseId } });
        await tx.visaCase.deleteMany({ where: { processingCaseId } });
        await tx.clearanceCase.deleteMany({ where: { processingCaseId } });
        await tx.travelTicket.deleteMany({ where: { processingCaseId } });
        await tx.departureCase.deleteMany({ where: { processingCaseId } });
        await tx.joiningCase.deleteMany({ where: { processingCaseId } });

        await tx.processingStatusHistory.deleteMany({ where: { processingCaseId } });
        await tx.processingDocumentRequirement.deleteMany({ where: { processingCaseId } });

        await tx.recruitmentCost.updateMany({
          where: { processingCaseId },
          data: { processingCaseId: null },
        });
        await tx.invoice.updateMany({
          where: { processingCaseId },
          data: { processingCaseId: null },
        });
        await tx.payment.updateMany({
          where: { processingCaseId },
          data: { processingCaseId: null },
        });
        await tx.candidateLedgerEntry.updateMany({
          where: { processingCaseId },
          data: { processingCaseId: null },
        });
        await tx.paymentPlan.updateMany({
          where: { processingCaseId },
          data: { processingCaseId: null },
        });

        await tx.recruitmentProcessingCase.delete({ where: { id: processingCaseId } });
      }

      // 2. Clean up Visa Applications
      if (visaAppIds.length > 0) {
        await tx.visaAppointment.deleteMany({ where: { visaApplicationId: { in: visaAppIds } } });
        await tx.visaStatusHistory.deleteMany({ where: { visaApplicationId: { in: visaAppIds } } });
        await tx.visaApplication.deleteMany({ where: { id: { in: visaAppIds } } });
      }

      // 3. Clean up legacy / post-selection records directly linked to Application
      await tx.medicalRecord.deleteMany({ where: { applicationId: appId } });
      await tx.clearanceRecord.deleteMany({ where: { applicationId: appId } });
      await tx.departureRecord.deleteMany({ where: { applicationId: appId } });

      // 4. Clean up recruitment pipeline records
      await tx.interview.deleteMany({ where: { applicationId: appId } });
      await tx.applicationScreening.deleteMany({ where: { applicationId: appId } });
      await tx.applicationStatusHistory.deleteMany({ where: { applicationId: appId } });

      // 5. Unlink documents & financial records so candidate master records remain intact
      await tx.document.updateMany({
        where: { applicationId: appId },
        data: { applicationId: null },
      });
      await tx.invoice.updateMany({
        where: { applicationId: appId },
        data: { applicationId: null },
      });
      await tx.payment.updateMany({
        where: { applicationId: appId },
        data: { applicationId: null },
      });
      await tx.receipt.updateMany({
        where: { applicationId: appId },
        data: { applicationId: null },
      });
      await tx.refund.updateMany({
        where: { applicationId: appId },
        data: { applicationId: null },
      });
      await tx.financialAdjustment.updateMany({
        where: { applicationId: appId },
        data: { applicationId: null },
      });
      await tx.candidateLedgerEntry.updateMany({
        where: { applicationId: appId },
        data: { applicationId: null },
      });
      await tx.paymentPlan.updateMany({
        where: { applicationId: appId },
        data: { applicationId: null },
      });
      await tx.recruitmentCost.updateMany({
        where: { applicationId: appId },
        data: { applicationId: null },
      });

      // 6. If application was SELECTED, decrement job filledCount
      if (existing.status === 'SELECTED' || existing.currentStage === 'SELECTED') {
        const job = await tx.job.findUnique({ where: { id: existing.jobId } });
        if (job && job.filledCount > 0) {
          await tx.job.update({
            where: { id: existing.jobId },
            data: { filledCount: { decrement: 1 } },
          });
        }
      }

      // 7. Delete the application cleanly
      await tx.application.delete({
        where: { id: appId },
      });
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'APPLICATION_DELETE',
      entity: 'APPLICATION',
      entityId: appId,
      description: `Completely purged application ${existing.applicationCode || existing.applicationNumber} and all linked processing records from system`,
      oldValue: {
        applicationCode: existing.applicationCode,
        applicationNumber: existing.applicationNumber,
        status: existing.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `আবেদন ${existing.applicationCode || existing.applicationNumber} সম্পূর্ণ সিস্টেম থেকে সফলভাবে ডিলিট করা হয়েছে। / Application deleted from entire system successfully`,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting application:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete application' },
      { status: 500 }
    );
  }
}
