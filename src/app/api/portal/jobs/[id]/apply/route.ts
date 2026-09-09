import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';
import { generateFormattedId } from '@/lib/id-generator';
import { dispatchCommunication } from '@/lib/comms/dispatcher';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const applicant = await requireApplicantAuth();
    const { id: jobId } = await params;

    // 1. Verify Job exists and is open
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        country: { select: { name: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job position not found' }, { status: 404 });
    }

    if (!['ACTIVE', 'PUBLISHED'].includes(job.status)) {
      return NextResponse.json(
        { success: false, error: 'This job position is no longer accepting new applications.' },
        { status: 400 }
      );
    }

    // 2. CRITICAL: Prevent duplicate application for the same job
    const existingApp = await prisma.application.findFirst({
      where: {
        applicantId: applicant.id,
        jobId,
      },
    });

    if (existingApp) {
      return NextResponse.json(
        {
          success: false,
          error: `You have already applied for this position (Application: ${existingApp.applicationCode}). Multiple submissions for the same job are not permitted.`,
          applicationId: existingApp.id,
          applicationCode: existingApp.applicationCode,
        },
        { status: 409 }
      );
    }

    let notes: string | undefined;
    try {
      const body = await request.json();
      notes = body.notes;
    } catch {
      // notes is optional
    }

    // 3. Generate sequential application code SGR-APP-2026-XXXXXX
    const applicationCode = await generateFormattedId(prisma, 'application');

    // 4. Create application
    const application = await prisma.application.create({
      data: {
        applicationCode,
        applicationNumber: applicationCode,
        applicantId: applicant.id,
        jobId,
        employerId: job.employerId || null,
        countryId: job.countryId || null,
        currentStage: 'SUBMITTED',
        status: 'SUBMITTED',
        priority: 'MEDIUM',
        notes: notes || null,
        statusHistory: {
          create: {
            toStage: 'SUBMITTED',
            notes: 'Applicant self-applied via applicant portal',
          },
        },
      },
      include: {
        job: {
          select: {
            title: true,
            jobCode: true,
            employerId: true,
            countryId: true,
            country: { select: { name: true } },
          },
        },
        employer: { select: { id: true, companyName: true } },
        country: { select: { id: true, name: true } },
      },
    });

    // 6. Notify candidate (In-app + comms dispatcher)
    await dispatchCommunication(prisma, {
      applicantId: applicant.id,
      channel: 'IN_APP',
      subject: `Application Received: ${job.title}`,
      message: `Your application (${application.applicationCode}) for "${job.title}" has been successfully submitted and is pending initial screening.`,
      link: `/portal/applications/${application.id}`,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully applied to ${job.title}! Your application code is ${application.applicationCode}.`,
      data: application,
    }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Please log in to apply for jobs' }, { status: 401 });
    }
    console.error('Apply job error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit application' }, { status: 500 });
  }
}
