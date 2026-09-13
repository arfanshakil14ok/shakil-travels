import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { createApplicationSchema } from '@/lib/validations/application';
import { generateFormattedId } from '@/lib/id-generator';
import { createAuditLog } from '@/lib/audit';
import { calculateMatch } from '@/lib/matching';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requirePermission('APPLICATION_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');
    const jobId = searchParams.get('jobId');
    const applicantId = searchParams.get('applicantId');
    const employerId = searchParams.get('employerId');
    const countryId = searchParams.get('countryId');
    const assignedToId = searchParams.get('assignedToId');
    const assignedToMe = searchParams.get('assignedToMe') === 'true';
    const priority = searchParams.get('priority');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where: any = {};
    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { applicationNumber: { contains: search, mode: 'insensitive' } },
          { applicationCode: { contains: search, mode: 'insensitive' } },
          { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
          { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
          { applicant: { passportNumber: { contains: search, mode: 'insensitive' } } },
          { job: { title: { contains: search, mode: 'insensitive' } } },
          { job: { jobCode: { contains: search, mode: 'insensitive' } } },
          { job: { employer: { companyName: { contains: search, mode: 'insensitive' } } } },
          { job: { country: { name: { contains: search, mode: 'insensitive' } } } },
          { employer: { companyName: { contains: search, mode: 'insensitive' } } },
          { country: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (status && status !== 'ALL') {
      // Map general statuses
      if (status === 'APPLIED') {
        andConditions.push({ status: { in: ['APPLIED', 'SUBMITTED', 'NEW'] } });
      } else if (status === 'SCREENING') {
        andConditions.push({ status: { in: ['SCREENING', 'UNDER_REVIEW'] } });
      } else if (status === 'INTERVIEW') {
        andConditions.push({ status: { in: ['INTERVIEW_SCHEDULED', 'INTERVIEW', 'INTERVIEWED', 'INTERVIEW_PASSED'] } });
      } else {
        andConditions.push({
          OR: [
            { currentStatus: status },
            { status: status },
            { currentStage: status },
          ],
        });
      }
    }

    if (jobId && jobId !== 'ALL') {
      andConditions.push({ jobId });
    }

    if (applicantId && applicantId !== 'ALL') {
      andConditions.push({ applicantId });
    }

    if (employerId && employerId !== 'ALL') {
      if (employerId === 'UNASSIGNED') {
        andConditions.push({
          AND: [
            { employerId: null },
            { job: { employerId: null } },
          ],
        });
      } else {
        andConditions.push({
          OR: [
            { employerId },
            { job: { employerId } },
          ],
        });
      }
    }

    if (countryId && countryId !== 'ALL') {
      andConditions.push({
        OR: [
          { countryId },
          { job: { countryId } },
        ],
      });
    }

    if (assignedToMe) {
      andConditions.push({ assignedStaffId: currentUser.id });
    } else if (assignedToId && assignedToId !== 'ALL') {
      andConditions.push({ assignedStaffId: assignedToId });
    }

    if (priority && priority !== 'ALL') {
      andConditions.push({ priority });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [total, items, statusGroupCounts, totalAll] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          applicant: {
            select: {
              id: true,
              applicantNumber: true,
              fullName: true,
              phone: true,
              email: true,
              passportNumber: true,
              profilePhoto: true,
              skills: true,
              yearsOfExperience: true,
              education: true,
              candidateType: true,
            },
          },
          job: {
            select: {
              id: true,
              jobCode: true,
              title: true,
              titleLocal: true,
              vacancyCount: true,
              filledCount: true,
              status: true,
              salaryMin: true,
              salaryMax: true,
              currency: true,
              salaryPeriod: true,
              employer: { select: { id: true, companyName: true, verificationStatus: true } },
              country: { select: { id: true, name: true, flag: true, code: true } },
            },
          },
          employer: { select: { id: true, companyName: true, verificationStatus: true } },
          country: { select: { id: true, name: true, flag: true, code: true } },
          assignedStaff: {
            select: { id: true, name: true, email: true },
          },
          screenings: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { id: true, overallResult: true, screenedAt: true },
          },
          _count: {
            select: {
              documents: true,
              interviews: true,
              statusHistory: true,
              screenings: true,
            },
          },
        },
      }),
      prisma.application.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.application.count(),
    ]);

    const pipelineCounts: Record<string, number> = {
      ALL: totalAll,
      APPLIED: 0,
      SCREENING: 0,
      SHORTLISTED: 0,
      INTERVIEW: 0,
      SELECTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };

    statusGroupCounts.forEach((sc) => {
      const s = (sc.status || '').toUpperCase();
      if (s === 'APPLIED' || s === 'SUBMITTED' || s === 'NEW') {
        pipelineCounts.APPLIED += sc._count._all;
      } else if (s === 'SCREENING' || s === 'UNDER_REVIEW') {
        pipelineCounts.SCREENING += sc._count._all;
      } else if (s === 'SHORTLISTED') {
        pipelineCounts.SHORTLISTED += sc._count._all;
      } else if (s === 'INTERVIEW_SCHEDULED' || s === 'INTERVIEW' || s === 'INTERVIEWED' || s === 'INTERVIEW_PASSED') {
        pipelineCounts.INTERVIEW += sc._count._all;
      } else if (s === 'SELECTED' || s === 'OFFER_ACCEPTED') {
        pipelineCounts.SELECTED += sc._count._all;
      } else if (s === 'REJECTED') {
        pipelineCounts.REJECTED += sc._count._all;
      } else if (s === 'WITHDRAWN') {
        pipelineCounts.WITHDRAWN += sc._count._all;
      }
    });

    const formattedItems = items.map((item: any) => {
      const employer = item.job?.employer || item.employer || null;
      const country = item.job?.country || item.country || null;
      const vacancies = item.job?.vacancies ?? item.job?.vacancyCount ?? 0;
      const filled = item.job?.filledCount ?? 0;

      return {
        ...item,
        currentStatus: item.currentStatus || item.status || 'APPLIED',
        status: item.status || item.currentStatus || 'APPLIED',
        applicationNumber: item.applicationNumber || item.applicationCode || item.id,
        applicationCode: item.applicationCode || item.applicationNumber || item.id,
        job: item.job
          ? {
              ...item.job,
              employer,
              country,
              vacancies,
              remainingVacancies: Math.max(0, vacancies - filled),
            }
          : null,
        employer,
        country,
        assignedTo: item.assignedStaff || null,
        vacancies,
        salaryAmount: item.job?.salaryMin ?? null,
        salaryCurrency: item.job?.currency ?? 'BDT',
        latestScreening: item.screenings?.[0] || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: formattedItems,
        pipelineCounts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching applications:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('APPLICATION_CREATE');
    const body = await request.json();

    const parsed = createApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if candidate already has an active application for this exact job
    const existing = await prisma.application.findFirst({
      where: {
        applicantId: data.applicantId,
        jobId: data.jobId,
        status: {
          notIn: ['REJECTED', 'WITHDRAWN', 'CANCELLED'],
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Candidate already has an active application (${existing.applicationNumber || existing.applicationCode}) for this job vacancy. Multiple active submissions are not permitted.`,
          applicationId: existing.id,
          applicationCode: existing.applicationCode || existing.applicationNumber,
        },
        { status: 409 }
      );
    }

    // Verify applicant and job exist
    const [applicant, job] = await Promise.all([
      prisma.applicant.findUnique({
        where: { id: data.applicantId },
        include: { preferredCountry: true, preferredJobCategory: true },
      }),
      prisma.job.findUnique({
        where: { id: data.jobId },
        include: { country: true, employer: true },
      }),
    ]);

    if (!applicant) {
      return NextResponse.json({ success: false, error: 'Applicant not found' }, { status: 404 });
    }
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    if (job.status === 'CLOSED' || job.status === 'EXPIRED') {
      return NextResponse.json(
        { success: false, error: 'This job vacancy is no longer open for recruitment.' },
        { status: 400 }
      );
    }

    // Compute matching snapshot via Phase 3 deterministic matching engine
    const matchSnapshot = calculateMatch(applicant, job);

    // Generate unique sequential business ID: SGR-APP-2026-XXXXXX
    const applicationNumber = await generateFormattedId(prisma, 'application');

    const application = await prisma.$transaction(async (tx) => {
      const stage = (data as any).appliedStage || (data as any).status || 'APPLIED';
      const created = await tx.application.create({
        data: {
          applicationCode: applicationNumber,
          applicationNumber,
          applicantId: data.applicantId,
          jobId: data.jobId,
          employerId: job.employerId || null,
          countryId: job.countryId || null,
          currentStage: stage,
          status: stage,
          priority: data.priority || 'MEDIUM',
          source: data.source || 'STAFF_CREATED',
          assignedStaffId: (data as any).assignedStaffId || (data as any).assignedToId || null,
          notes: (data as any).notes || (data as any).internalNotes || null,
          internalNotes: (data as any).internalNotes || null,
          matchingSnapshot: matchSnapshot as any,
        },
        include: {
          applicant: { select: { id: true, fullName: true, applicantNumber: true } },
          job: { select: { id: true, title: true, jobCode: true, employerId: true, countryId: true } },
          employer: { select: { id: true, companyName: true } },
          country: { select: { id: true, name: true } },
        },
      });

      // Record initial status history
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: created.id,
          fromStage: null,
          toStage: created.status,
          fromStatus: null,
          toStatus: created.status,
          changedById: currentUser.id,
          changedByRole: (currentUser as any).role?.name || 'STAFF',
          notes: 'Application initiated in recruitment system',
        },
      });

      return created;
    });

    // Audit log
    await createAuditLog({
      userId: currentUser.id,
      applicantId: application.applicantId,
      actorType: 'STAFF',
      action: 'APPLICATION_CREATE',
      entity: 'APPLICATION',
      entityId: application.id,
      description: `Recruitment application ${application.applicationNumber} initiated for ${application.applicant?.fullName} -> ${application.job?.title}`,
      newValue: {
        applicationNumber: application.applicationNumber,
        applicantName: application.applicant?.fullName,
        jobTitle: application.job?.title,
        status: application.status,
        matchScore: matchSnapshot.score,
      },
    });

    // Notify candidate in portal
    await prisma.notification.create({
      data: {
        applicantId: application.applicantId,
        type: 'APPLICATION_CREATED',
        title: 'নতুন চাকরির আবেদন শুরু হয়েছে',
        message: `আপনার জন্য "${application.job?.title}" পদের নিয়োগ প্রক্রিয়া শুরু হয়েছে। আবেদন কোড: ${application.applicationNumber}।`,
        link: '/portal/applications',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: application,
        message: `Application ${application.applicationNumber} created successfully`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating application:', error);
    return NextResponse.json({ success: false, error: 'Failed to create application' }, { status: 500 });
  }
}
