import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { interviewSchema } from '@/lib/validations/interview';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('INTERVIEW_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const applicantId = searchParams.get('applicantId');
    const applicationId = searchParams.get('applicationId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search')?.trim();

    const where: any = {};
    if (applicantId && applicantId !== 'ALL') where.applicantId = applicantId;
    if (applicationId && applicationId !== 'ALL') where.applicationId = applicationId;
    if (status && status !== 'ALL') where.status = status;
    if (type && type !== 'ALL') where.interviewType = type;

    if (search) {
      where.OR = [
        { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
        { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
        { application: { applicationNumber: { contains: search, mode: 'insensitive' } } },
        { interviewerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const interviews = await prisma.interview.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: {
        applicant: {
          select: { id: true, fullName: true, applicantNumber: true, phone: true, profilePhoto: true },
        },
        application: {
          select: {
            id: true,
            applicationNumber: true,
            status: true,
            currentStage: true,
            job: { select: { id: true, title: true, jobCode: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: interviews });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching interviews:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch interviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('INTERVIEW_CREATE');
    const body = await request.json();

    const parsed = interviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    let resolvedJobId = data.jobId;
    let applicationRecord: any = null;

    if (data.applicationId) {
      applicationRecord = await prisma.application.findUnique({
        where: { id: data.applicationId },
        select: { id: true, jobId: true, currentStage: true },
      });
      if (applicationRecord && !resolvedJobId) {
        resolvedJobId = applicationRecord.jobId;
      }
    }

    if (!resolvedJobId || !data.applicationId) {
      return NextResponse.json(
        { success: false, error: 'Valid application and job are required to schedule an interview' },
        { status: 400 }
      );
    }

    const interview = await prisma.$transaction(async (tx) => {
      const created = await tx.interview.create({
        data: {
          applicantId: data.applicantId,
          applicationId: data.applicationId!,
          jobId: resolvedJobId!,
          interviewType: data.interviewType,
          scheduledAt: new Date(data.scheduledAt || data.scheduledDate),
          durationMinutes: data.durationMinutes || 30,
          location: data.location || null,
          meetingLink: data.meetingLink || null,
          interviewer: data.interviewer || data.interviewerName || null,
          notes: data.notes || null,
          status: 'SCHEDULED',
          createdById: currentUser.id,
        },
        include: {
          applicant: { select: { id: true, fullName: true } },
        },
      });

      // If application is linked and current stage is APPLIED or SCREENING or SHORTLISTED, update to INTERVIEW_SCHEDULED
      if (applicationRecord && ['APPLIED', 'SCREENING', 'SHORTLISTED'].includes(applicationRecord.currentStage)) {
        await tx.application.update({
          where: { id: applicationRecord.id },
          data: { currentStage: 'INTERVIEW_SCHEDULED', status: 'INTERVIEW_SCHEDULED' },
        });

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: applicationRecord.id,
            fromStage: applicationRecord.currentStage,
            toStage: 'INTERVIEW_SCHEDULED',
            changedById: currentUser.id,
            notes: `Interview scheduled on ${new Date(data.scheduledDate).toLocaleString()}`,
          },
        });
      }

      return created;
    });

    await createAuditLog({
      userId: currentUser.id,
      applicantId: data.applicantId,
      actorType: 'STAFF',
      action: 'INTERVIEW_CREATE',
      entity: 'INTERVIEW',
      entityId: interview.id,
      description: `Interview scheduled for ${interview.applicant.fullName}: ${interview.interviewType} on ${new Date(interview.scheduledAt).toLocaleString()}`,
      newValue: {
        applicant: interview.applicant.fullName,
        scheduledDate: interview.scheduledAt,
        type: interview.interviewType,
      },
    });

    await prisma.notification.create({
      data: {
        applicantId: data.applicantId,
        type: 'INTERVIEW_SCHEDULED',
        title: 'সাক্ষাৎকার / ইন্টারভিউ নির্ধারিত হয়েছে',
        message: `আপনার জন্য একটি ${interview.interviewType} ইন্টারভিউ নির্ধারণ করা হয়েছে: ${new Date(interview.scheduledAt).toLocaleDateString()}। বিস্তারিত জানতে ইন্টারভিউ সেকশনে যান।`,
        link: '/portal/interviews',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: interview,
        message: 'Interview scheduled successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error scheduling interview:', error);
    return NextResponse.json({ success: false, error: 'Failed to schedule interview' }, { status: 500 });
  }
}
