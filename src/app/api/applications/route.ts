import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { createApplicationSchema } from '@/lib/validations/application';
import { generateFormattedId } from '@/lib/id-generator';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('APPLICATION_VIEW');

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
      andConditions.push({
        OR: [
          { currentStatus: status },
          { status: status },
        ],
      });
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

    if (assignedToId && assignedToId !== 'ALL') {
      andConditions.push({ assignedStaffId: assignedToId });
    }

    if (priority && priority !== 'ALL') {
      andConditions.push({ priority });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [total, items] = await Promise.all([
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
            },
          },
          job: {
            select: {
              id: true,
              jobCode: true,
              title: true,
              vacancyCount: true,
              salaryMin: true,
              salaryMax: true,
              currency: true,
              employer: { select: { id: true, companyName: true } },
              country: { select: { id: true, name: true, flag: true, code: true } },
            },
          },
          employer: { select: { id: true, companyName: true } },
          country: { select: { id: true, name: true, flag: true, code: true } },
          assignedStaff: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              documents: true,
              interviews: true,
              statusHistory: true,
            },
          },
        },
      }),
    ]);

    const formattedItems = items.map((item: any) => {
      const employer = item.job?.employer || item.employer || null;
      const country = item.job?.country || item.country || null;

      return {
        ...item,
        currentStatus: item.currentStatus || item.status || 'SUBMITTED',
        status: item.status || item.currentStatus || 'SUBMITTED',
        applicationNumber: item.applicationNumber || item.applicationCode || item.id,
        applicationCode: item.applicationCode || item.applicationNumber || item.id,
        job: item.job
          ? {
              ...item.job,
              employer,
              country,
              vacancies: item.job.vacancyCount,
            }
          : null,
        employer,
        country,
        assignedTo: item.assignedStaff || null,
        vacancies: item.job?.vacancyCount ?? 0,
        salaryAmount: item.job?.salaryMin ?? null,
        salaryCurrency: item.job?.currency ?? 'BDT',
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: formattedItems,
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
          notIn: ['REJECTED', 'CANCELLED', 'RECRUITMENT_COMPLETED'],
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Candidate already has an active application (${existing.applicationNumber || existing.applicationCode}) for this job vacancy.`,
        },
        { status: 409 }
      );
    }

    // Verify applicant and job exist
    const [applicant, job] = await Promise.all([
      prisma.applicant.findUnique({ where: { id: data.applicantId } }),
      prisma.job.findUnique({ where: { id: data.jobId } }),
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

    // Generate unique sequential business ID: SGR-APP-2026-XXXXXX
    const applicationNumber = await generateFormattedId(prisma, 'application');

    const application = await prisma.$transaction(async (tx) => {
      const stage = (data as any).appliedStage || (data as any).status || 'SUBMITTED';
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
          source: data.source || applicant.source || 'DIRECT_WALK_IN',
          assignedStaffId: (data as any).assignedStaffId || (data as any).assignedToId || null,
          notes: (data as any).notes || (data as any).internalNotes || null,
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
          changedById: currentUser.id,
          notes: 'Application registered in system',
        },
      });

      return created;
    });

    // Audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'APPLICATION_CREATE',
      entity: 'APPLICATION',
      entityId: application.id,
      newValue: {
        applicationNumber: application.applicationNumber,
        applicantName: application.applicant?.fullName,
        jobTitle: application.job?.title,
        status: application.status,
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
