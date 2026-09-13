import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('APPLICATION_STATUS_CHANGE');
    const { id } = await params;

    let bodyNotes: string | undefined;
    try {
      const body = await request.json();
      bodyNotes = body.notes;
    } catch {
      // notes is optional
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

    if (application.status === 'SELECTED' || application.status === 'REJECTED' || application.status === 'WITHDRAWN') {
      return NextResponse.json(
        { success: false, error: `Cannot shortlist an application that is currently ${application.status}` },
        { status: 400 }
      );
    }

    const fromStatus = application.status;
    const toStatus = 'SHORTLISTED';

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: application.id },
        data: {
          status: toStatus,
          currentStage: toStatus,
          shortlistedAt: new Date(),
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
          notes: bodyNotes || `Candidate shortlisted for ${application.job?.title || 'position'}`,
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
      description: `Candidate ${application.applicant?.fullName} shortlisted for ${application.job?.title}`,
      newValue: {
        fromStatus,
        toStatus,
        shortlistedAt: new Date().toISOString(),
      },
    });

    // Notify candidate
    await prisma.notification.create({
      data: {
        applicantId: application.applicantId,
        type: 'APPLICATION_STATUS_CHANGED',
        title: 'আপনার আবেদন শর্টলিস্ট করা হয়েছে',
        message: `আপনার "${application.job?.title}" পদের আবেদন শর্টলিস্ট করা হয়েছে। পরবর্তী ধাপ ইন্টারভিউ।`,
        link: `/portal/applications/${application.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Candidate shortlisted successfully',
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Shortlist error:', error);
    return NextResponse.json({ success: false, error: 'Failed to shortlist candidate' }, { status: 500 });
  }
}
