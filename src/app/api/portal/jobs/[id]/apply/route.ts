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

    // 2. HARD LIMIT: Candidates cannot apply more than 3 times across the entire system (excluding drafts & rejected)
    const totalApplications = await prisma.application.count({
      where: {
        applicantId: applicant.id,
        status: { notIn: ['DRAFT', 'REJECTED', 'WITHDRAWN', 'CANCELLED'] },
      },
    });

    if (totalApplications >= 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'আপনি সর্বোচ্চ ৩ বার চাকরির জন্য আবেদন করতে পারবেন। আপনার সক্রিয় আবেদনের কোটা (৩টি) পূর্ণ হয়েছে। / You cannot apply more than 3 times. Your active application limit (3) has been reached.',
          currentCount: totalApplications,
          maxLimit: 3,
        },
        { status: 400 }
      );
    }

    // 3. Prevent duplicate active submitted application for the same job
    const existingSubmittedApp = await prisma.application.findFirst({
      where: {
        applicantId: applicant.id,
        jobId,
        status: { notIn: ['DRAFT', 'REJECTED', 'WITHDRAWN', 'CANCELLED'] },
      },
    });

    if (existingSubmittedApp) {
      return NextResponse.json(
        {
          success: false,
          error: `You have already applied for this position (Application: ${existingSubmittedApp.applicationCode || existingSubmittedApp.applicationNumber}). / এই পদের জন্য আপনার সক্রিয় আবেদন ইতোমধ্যে জমা রয়েছে।`,
          applicationId: existingSubmittedApp.id,
          applicationCode: existingSubmittedApp.applicationCode || existingSubmittedApp.applicationNumber,
        },
        { status: 409 }
      );
    }

    // 4. Fetch applicant profile details
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
    let eligibilitySnapshot: any = null;
    let documentIds: string[] = [];
    try {
      const body = await request.json();
      notes = body.notes;
      eligibilitySnapshot = body.eligibilitySnapshot || null;
      if (Array.isArray(body.documentIds)) {
        documentIds = body.documentIds;
      }
    } catch {
      // optional
    }

    const matchSnapshot = calculateMatch(fullApplicant || applicant, job);

    // 5. Generate sequential application code SGR-APP-2026-XXXXXX
    const applicationCode = await generateFormattedId(prisma, 'application');

    // 6. Check for existing draft to transition or create fresh
    const existingDraft = await prisma.application.findFirst({
      where: {
        applicantId: applicant.id,
        jobId,
        status: 'DRAFT',
      },
    });

    let application;
    if (existingDraft) {
      application = await prisma.application.update({
        where: { id: existingDraft.id },
        data: {
          applicationCode,
          applicationNumber: applicationCode,
          employerId: job.employerId || null,
          countryId: job.countryId || null,
          currentStage: 'APPLIED',
          status: 'APPLIED',
          source: 'CANDIDATE_CREATED',
          priority: 'MEDIUM',
          notes: notes || null,
          matchingSnapshot: matchSnapshot as any,
          eligibilitySnapshot: eligibilitySnapshot || existingDraft.eligibilitySnapshot,
          statusHistory: {
            create: {
              toStage: 'APPLIED',
              toStatus: 'APPLIED',
              changedByRole: 'APPLICANT',
              notes: 'Applicant completed wizard and self-applied via candidate portal',
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
            },
          },
        },
      });
    } else {
      application = await prisma.application.create({
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
          eligibilitySnapshot: eligibilitySnapshot as any,
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
            },
          },
        },
      });
    }

    // 7. Link candidate documents to this application
    if (documentIds.length > 0) {
      await prisma.document.updateMany({
        where: {
          id: { in: documentIds },
          applicantId: applicant.id,
        },
        data: {
          applicationId: application.id,
        },
      });
    }

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
