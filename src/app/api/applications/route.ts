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
    const assignedToId = searchParams.get('assignedToId');
    const priority = searchParams.get('priority');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    if (search) {
      where.OR = [
        { applicationNumber: { contains: search, mode: 'insensitive' } },
        { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
        { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
        { applicant: { passportNumber: { contains: search, mode: 'insensitive' } } },
        { job: { title: { contains: search, mode: 'insensitive' } } },
        { job: { jobCode: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status && status !== 'ALL') {
      where.currentStatus = status;
    }

    if (jobId && jobId !== 'ALL') {
      where.jobId = jobId;
    }

    if (applicantId && applicantId !== 'ALL') {
      where.applicantId = applicantId;
    }

    if (employerId && employerId !== 'ALL') {
      where.job = { ...where.job, employerId };
    }

    if (assignedToId && assignedToId !== 'ALL') {
      where.assignedToId = assignedToId;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
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

    const formattedItems = items.map((item: any) => ({
      ...item,
      assignedTo: item.assignedStaff,
      vacancies: item.job?.vacancyCount,
      salaryAmount: item.job?.salaryMin,
      salaryCurrency: item.job?.currency,
    }));

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

    // Generate unique sequential business ID: SGR-APP-2026-XXXXXX
    const applicationNumber = await generateFormattedId(prisma, 'application');

    const application = await prisma.$transaction(async (tx) => {
      const stage = (data as any).appliedStage || 'APPLIED';
      const created = await tx.application.create({
        data: {
          applicationCode: applicationNumber,
          applicationNumber,
          applicantId: data.applicantId,
          jobId: data.jobId,
          currentStage: stage,
          status: stage,
          priority: data.priority || 'MEDIUM',
          source: data.source || applicant.source || 'DIRECT_WALK_IN',
          assignedStaffId: (data as any).assignedStaffId || (data as any).assignedToId || null,
          notes: (data as any).notes || (data as any).internalNotes || null,
        },
        include: {
          applicant: { select: { id: true, fullName: true, applicantNumber: true } },
          job: { select: { id: true, title: true, jobCode: true } },
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
        applicantName: application.applicant.fullName,
        jobTitle: application.job.title,
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
