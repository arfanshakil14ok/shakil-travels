import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { getCurrentUser } from '@/lib/auth';
import { getCurrentApplicant } from '@/lib/portal-auth';
import { jobBaseSchema } from '@/lib/validations/job';
import { calculateMatch, getMatchingApplicantsForJob } from '@/lib/matching';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const isStaff = Boolean(user && user.role?.name !== 'CANDIDATE');

    const job = await prisma.job.findFirst({
      where: {
        OR: [{ id }, { jobCode: id }, { slug: id }],
      },
      include: {
        country: true,
        jobCategory: true,
        employer: {
          select: {
            id: true,
            employerCode: true,
            companyName: true,
            companyNameLocal: true,
            city: true,
            industry: true,
            website: true,
            verificationStatus: true,
            status: true,
          },
        },
        createdByUser: { select: { id: true, name: true, email: true } },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const remainingVacancies = Math.max(0, (job.vacancyCount || 0) - (job.filledCount || 0));
    const isExpired = job.applicationDeadline ? new Date(job.applicationDeadline) < new Date() : false;

    // If public visitor or candidate, ensure published and active employer
    if (!isStaff) {
      if (
        job.status !== 'PUBLISHED' ||
        !job.employer ||
        job.employer.verificationStatus !== 'VERIFIED' ||
        job.employer.status !== 'ACTIVE'
      ) {
        return NextResponse.json(
          { success: false, error: 'Job posting is no longer active or employer is unverified' },
          { status: 404 }
        );
      }
    }

    let candidateMatch: any = null;
    let hasApplied = false;

    // If logged in as candidate (portal cookie or user session), calculate match against this job
    let applicant: any = null;
    const portalApplicant = await getCurrentApplicant();
    if (portalApplicant?.id) {
      applicant = await prisma.applicant.findUnique({
        where: { id: portalApplicant.id },
      });
    } else if (user && user.role?.name === 'CANDIDATE') {
      applicant = await prisma.applicant.findFirst({
        where: { email: user.email },
      });
    }

    if (applicant) {
      candidateMatch = calculateMatch(applicant, job);

      const applicationCount = await prisma.application.count({
        where: {
          jobId: job.id,
          applicantId: applicant.id,
        },
      });
      hasApplied = applicationCount > 0;
    }

    let matchingCandidates: any[] = [];
    if (isStaff) {
      matchingCandidates = await getMatchingApplicantsForJob(prisma, job.id, 8);
    }

    const responsePayload: any = {
      ...job,
      remainingVacancies,
      isExpired,
      candidateMatch,
      hasApplied,
      matchingCandidates: isStaff ? matchingCandidates : undefined,
    };

    if (!isStaff) {
      delete responsePayload.reviewNotes;
      delete responsePayload.createdBy;
      delete responsePayload.createdByUser;
    }

    return NextResponse.json({
      success: true,
      data: responsePayload,
    });
  } catch (error: any) {
    console.error('Error fetching job details:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch job details' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('JOB_EDIT');
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.job.findFirst({
      where: { OR: [{ id }, { jobCode: id }, { slug: id }] },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const parsed = jobBaseSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const targetStatus = data.status !== undefined ? data.status : existing.status;
    const targetEmployerId = data.employerId !== undefined ? data.employerId : existing.employerId;

    if (targetStatus === 'PUBLISHED') {
      if (!targetEmployerId || !targetEmployerId.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'An employer must be assigned before publishing a job vacancy. / চাকরি প্রকাশ করার পূর্বে নিয়োগকর্তা নির্বাচন বাধ্যতামূলক।',
          },
          { status: 400 }
        );
      }

      const assignedEmployer = await prisma.employer.findUnique({
        where: { id: targetEmployerId },
      });

      if (!assignedEmployer) {
        return NextResponse.json({ success: false, error: 'Employer not found' }, { status: 404 });
      }

      if (assignedEmployer.verificationStatus !== 'VERIFIED' || assignedEmployer.status !== 'ACTIVE') {
        return NextResponse.json(
          {
            success: false,
            error: 'Only verified and active employers can have published job vacancies. / শুধুমাত্র যাচাইকৃত ও সক্রিয় নিয়োগকর্তার চাকরি প্রকাশ করা যাবে।',
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.job.update({
      where: { id: existing.id },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        titleLocal: data.titleLocal !== undefined ? data.titleLocal : undefined,
        slug: data.slug !== undefined ? data.slug : undefined,
        countryId: data.countryId !== undefined ? data.countryId : undefined,
        city: data.city !== undefined ? data.city : undefined,
        jobCategoryId: data.jobCategoryId !== undefined ? data.jobCategoryId : undefined,
        employerId: data.employerId !== undefined ? data.employerId : undefined,
        description: data.description !== undefined ? data.description : undefined,
        descriptionLocal: data.descriptionLocal !== undefined ? data.descriptionLocal : undefined,
        salaryMin: data.salaryMin !== undefined ? data.salaryMin : undefined,
        salaryMax: data.salaryMax !== undefined ? data.salaryMax : undefined,
        currency: data.currency !== undefined ? data.currency : undefined,
        salaryPeriod: data.salaryPeriod !== undefined ? data.salaryPeriod : undefined,
        experienceRequired: data.experienceRequired !== undefined ? data.experienceRequired : undefined,
        educationRequired: data.educationRequired !== undefined ? data.educationRequired : undefined,
        ageMin: data.ageMin !== undefined ? data.ageMin : undefined,
        ageMax: data.ageMax !== undefined ? data.ageMax : undefined,
        languageRequirements: data.languageRequirements !== undefined ? data.languageRequirements : undefined,
        skillsRequired: data.skillsRequired !== undefined ? data.skillsRequired : undefined,
        vacancyCount: data.vacancyCount !== undefined ? data.vacancyCount : undefined,
        filledCount: data.filledCount !== undefined ? data.filledCount : undefined,
        accommodation: data.accommodation !== undefined ? data.accommodation : undefined,
        food: data.food !== undefined ? data.food : undefined,
        transportation: data.transportation !== undefined ? data.transportation : undefined,
        medical: data.medical !== undefined ? data.medical : undefined,
        airTicket: data.airTicket !== undefined ? data.airTicket : undefined,
        workingHours: data.workingHours !== undefined ? data.workingHours : undefined,
        contractDuration: data.contractDuration !== undefined ? data.contractDuration : undefined,
        applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
        status: data.status !== undefined ? data.status : undefined,
        featured: data.featured !== undefined ? data.featured : undefined,
        reviewNotes: (body as any).reviewNotes !== undefined ? (body as any).reviewNotes : undefined,
      },
      include: {
        country: true,
        jobCategory: true,
        employer: true,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'JOB_UPDATE',
      entity: 'Job',
      entityId: existing.id,
      oldValue: { status: existing.status, title: existing.title },
      newValue: { status: updated.status, title: updated.title },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating job:', error);
    return NextResponse.json({ success: false, error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('JOB_DELETE');
    const { id } = await params;

    const existing = await prisma.job.findFirst({
      where: { OR: [{ id }, { jobCode: id }, { slug: id }] },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const applicationCount = await prisma.application.count({
      where: { jobId: existing.id },
    });

    if (applicationCount > 0) {
      const updated = await prisma.job.update({
        where: { id: existing.id },
        data: { status: 'CLOSED' },
      });
      await createAuditLog({
        userId: currentUser.id,
        action: 'JOB_CLOSE',
        entity: 'Job',
        entityId: existing.id,
      });
      return NextResponse.json({
        success: true,
        message: 'Job has candidate applications. Status updated to CLOSED.',
        data: updated,
      });
    }

    await prisma.job.delete({ where: { id: existing.id } });

    await createAuditLog({
      userId: currentUser.id,
      action: 'JOB_DELETE',
      entity: 'Job',
      entityId: existing.id,
      oldValue: { jobCode: existing.jobCode, title: existing.title },
    });

    return NextResponse.json({ success: true, message: 'Job posting deleted' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting job:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete job' }, { status: 500 });
  }
}
