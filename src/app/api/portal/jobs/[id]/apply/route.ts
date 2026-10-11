import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth, calculateProfileCompletion } from '@/lib/portal-auth';
import { generateFormattedId } from '@/lib/id-generator';
import { dispatchCommunication } from '@/lib/comms/dispatcher';
import { calculateMatch } from '@/lib/matching';

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

    // 2. HARD LIMIT: Candidates cannot apply more than 3 times across the entire system
    const totalApplications = await prisma.application.count({
      where: { applicantId: applicant.id },
    });

    if (totalApplications >= 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'আপনি সর্বোচ্চ ৩ বার চাকরির জন্য আবেদন করতে পারবেন। আপনার আবেদনের কোটা (৩টি) পূর্ণ হয়েছে। / You cannot apply more than 3 times. Your application limit (3) has been reached.',
          currentCount: totalApplications,
          maxLimit: 3,
        },
        { status: 400 }
      );
    }

    // 3. Prevent duplicate active application for the same job
    const existingApp = await prisma.application.findFirst({
      where: {
        applicantId: applicant.id,
        jobId,
        status: { notIn: ['REJECTED', 'WITHDRAWN', 'CANCELLED'] },
      },
    });

    if (existingApp) {
      return NextResponse.json(
        {
          success: false,
          error: `You have already applied for this position (Application: ${existingApp.applicationCode || existingApp.applicationNumber}). / এই পদের জন্য আপনার সক্রিয় আবেদন ইতোমধ্যে জমা রয়েছে।`,
          applicationId: existingApp.id,
          applicationCode: existingApp.applicationCode || existingApp.applicationNumber,
        },
        { status: 409 }
      );
    }

    // 4. Fetch applicant profile details and strictly enforce 100% completion
    const fullApplicant = await prisma.applicant.findUnique({
      where: { id: applicant.id },
      include: {
        profile: true,
        preferredCountry: true,
        preferredJobCategory: true,
      },
    });

    const completion = calculateProfileCompletion(fullApplicant || applicant);
    if (completion.percentage < 100) {
      return NextResponse.json(
        {
          success: false,
          error: `চাকরির আবেদন জমা দিতে আপনার প্রোফাইল ১০০% সম্পন্ন হওয়া আবশ্যক। বর্তমানে সম্পন্ন: ${completion.percentage}%। অসম্পূর্ণ তথ্য পূরণ করুন: ${completion.missingFields.join(', ')} / Your profile must be 100% complete before applying. Missing: ${completion.missingFields.join(', ')}`,
          completion,
          missingFields: completion.missingFields,
        },
        { status: 400 }
      );
    }

    let notes: string | undefined;
    try {
      const body = await request.json();
      notes = body.notes;
    } catch {
      // notes is optional
    }

    const matchSnapshot = calculateMatch(fullApplicant || applicant, job);

    // 5. Generate sequential application code SGR-APP-2026-XXXXXX
    const applicationCode = await generateFormattedId(prisma, 'application');


    // 5. Create application with matching snapshot
    const application = await prisma.application.create({
      data: {
        applicationCode,
        applicationNumber: applicationCode,
        applicantId: applicant.id,
        jobId,
        employerId: job.employerId || null,
        countryId: job.countryId || null,
        currentStage: 'APPLIED',
        status: 'APPLIED',
        source: 'CANDIDATE_CREATED',
        priority: 'MEDIUM',
        notes: notes || null,
        matchingSnapshot: matchSnapshot as any,
        statusHistory: {
          create: {
            toStage: 'APPLIED',
            toStatus: 'APPLIED',
            changedByRole: 'APPLICANT',
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
      message: `Successfully applied to ${job.title}! Your application code is ${application.applicationCode}. / সফলভাবে আবেদন সম্পন্ন হয়েছে। আপনার আবেদন কোড: ${application.applicationCode}`,
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
