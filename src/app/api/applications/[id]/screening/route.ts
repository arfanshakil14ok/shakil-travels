import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { applicationScreeningSchema } from '@/lib/validations/application';
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
        OR: [{ id }, { applicationCode: id }, { applicationNumber: id }],
      },
      select: { id: true, applicationCode: true, status: true, applicantId: true, jobId: true },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const screenings = await prisma.applicationScreening.findMany({
      where: { applicationId: application.id },
      orderBy: { createdAt: 'desc' },
      include: {
        screenedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        applicationId: application.id,
        screenings,
        latestScreening: screenings[0] || null,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching screening:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch screening' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('APPLICATION_EDIT');
    const { id } = await params;
    const body = await request.json();

    const parsed = applicationScreeningSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { overallResult, checklist, notes, autoShortlist } = parsed.data;

    const application = await prisma.application.findFirst({
      where: {
        OR: [{ id }, { applicationCode: id }, { applicationNumber: id }],
      },
      include: { applicant: true, job: true },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const screening = await tx.applicationScreening.create({
        data: {
          applicationId: application.id,
          screenedById: currentUser.id,
          overallResult,
          checklist: checklist || {},
          notes: notes || null,
          screenedAt: new Date(),
        },
        include: {
          screenedBy: { select: { id: true, name: true, email: true } },
        },
      });

      const updateData: any = {
        screenedAt: new Date(),
      };

      let newStatus = application.status;
      if (overallResult === 'PASS' && autoShortlist) {
        newStatus = 'SHORTLISTED';
        updateData.shortlistedAt = new Date();
      } else if (application.status === 'APPLIED' || application.status === 'NEW' || application.status === 'SUBMITTED') {
        newStatus = 'SCREENING';
      }

      if (newStatus !== application.status) {
        updateData.status = newStatus;
        updateData.currentStage = newStatus;

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: application.id,
            fromStage: application.status,
            toStage: newStatus,
            fromStatus: application.status,
            toStatus: newStatus,
            changedById: currentUser.id,
            changedByRole: (currentUser as any).role?.name || 'STAFF',
            notes: `Screening evaluation completed: result = ${overallResult}. Notes: ${notes || 'None'}`,
          },
        });
      }

      const updatedApp = await tx.application.update({
        where: { id: application.id },
        data: updateData,
      });

      return { screening, updatedApp };
    });

    // Audit log
    await createAuditLog({
      userId: currentUser.id,
      applicantId: application.applicantId,
      actorType: 'STAFF',
      action: 'APPLICATION_STATUS_CHANGE',
      entity: 'APPLICATION',
      entityId: application.id,
      description: `Screening evaluation completed for ${application.applicationCode}: Result = ${overallResult}`,
      newValue: {
        overallResult,
        newStatus: result.updatedApp.status,
        screenedById: currentUser.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: result.screening,
      applicationStatus: result.updatedApp.status,
      message: `Screening evaluated successfully as ${overallResult}`,
    }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error saving screening evaluation:', error);
    return NextResponse.json({ success: false, error: 'Failed to save screening' }, { status: 500 });
  }
}
