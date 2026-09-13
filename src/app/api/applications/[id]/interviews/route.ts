import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { interviewSchema } from '@/lib/validations/interview';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('INTERVIEW_VIEW');
    const { id } = await params;

    const application = await prisma.application.findFirst({
      where: {
        OR: [{ id }, { applicationCode: id }, { applicationNumber: id }],
      },
      select: { id: true },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const interviews = await prisma.interview.findMany({
      where: { applicationId: application.id },
      orderBy: { scheduledAt: 'desc' },
      include: {
        applicant: { select: { id: true, fullName: true, phone: true } },
        interviewerUser: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: interviews });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching application interviews:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch interviews' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('INTERVIEW_CREATE');
    const { id } = await params;
    const body = await request.json();

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

    const parsed = interviewSchema.safeParse({
      ...body,
      applicantId: application.applicantId,
      applicationId: application.id,
      jobId: application.jobId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const interview = await prisma.$transaction(async (tx) => {
      const scheduleTime = data.scheduledAt || data.scheduledDate;
      const created = await tx.interview.create({
        data: {
          applicantId: application.applicantId,
          applicationId: application.id,
          jobId: application.jobId,
          interviewType: data.interviewType || 'ONLINE',
          scheduledAt: scheduleTime ? new Date(scheduleTime) : new Date(),
          durationMinutes: data.durationMinutes || 30,
          location: data.location || null,
          meetingLink: data.meetingLink || null,
          interviewer: (data as any).interviewerName || (data as any).interviewer || null,
          interviewerId: (data as any).interviewerId || null,
          notes: data.notes || null,
          candidateNotes: (data as any).candidateNotes || null,
          status: 'SCHEDULED',
          result: 'PENDING',
          createdById: currentUser.id,
        },
        include: {
          applicant: { select: { id: true, fullName: true, phone: true } },
          interviewerUser: { select: { id: true, name: true } },
        },
      });

      // Transition application to INTERVIEW_SCHEDULED if not already selected
      if (application.status !== 'SELECTED') {
        const fromStatus = application.status;
        const toStatus = 'INTERVIEW_SCHEDULED';

        await tx.application.update({
          where: { id: application.id },
          data: {
            status: toStatus,
            currentStage: toStatus,
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
            notes: `Interview scheduled: ${created.interviewType} on ${new Date(created.scheduledAt).toLocaleString()}`,
          },
        });
      }

      return created;
    });

    // Audit log
    await createAuditLog({
      userId: currentUser.id,
      applicantId: application.applicantId,
      actorType: 'STAFF',
      action: 'INTERVIEW_SCHEDULE',
      entity: 'INTERVIEW',
      entityId: interview.id,
      description: `Interview (${interview.interviewType}) scheduled for ${application.applicant?.fullName} -> ${application.job?.title}`,
      newValue: {
        scheduledAt: interview.scheduledAt,
        type: interview.interviewType,
      },
    });

    // Notify candidate in portal
    await prisma.notification.create({
      data: {
        applicantId: application.applicantId,
        type: 'INTERVIEW_SCHEDULED',
        title: 'সাক্ষাৎকার (ইন্টারভিউ) নির্ধারিত হয়েছে',
        message: `আপনার "${application.job?.title}" পদের জন্য একটি সাক্ষাৎকার নির্ধারণ করা হয়েছে। তারিখ: ${new Date(interview.scheduledAt).toLocaleDateString()}।`,
        link: `/portal/applications/${application.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: interview,
      message: 'Interview scheduled successfully',
    }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error scheduling interview:', error);
    return NextResponse.json({ success: false, error: 'Failed to schedule interview' }, { status: 500 });
  }
}
