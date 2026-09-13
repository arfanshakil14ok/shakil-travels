import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { getCurrentUser } from '@/lib/auth';
import { jobSchema } from '@/lib/validations/job';
import { generateFormattedId } from '@/lib/id-generator';
import { createAuditLog } from '@/lib/audit';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const search = searchParams.get('search')?.trim();
    const countryId = searchParams.get('countryId');
    const categoryId = searchParams.get('categoryId');
    const employerId = searchParams.get('employerId');
    const requestedStatus = searchParams.get('status');
    const featured = searchParams.get('featured');
    const minSalary = searchParams.get('minSalary');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    // If user is not authenticated or candidate, strictly only allow PUBLISHED jobs from VERIFIED and ACTIVE employers
    const isStaff = Boolean(user && user.role?.name !== 'CANDIDATE');
    if (!isStaff) {
      where.status = 'PUBLISHED';
      where.employer = {
        is: {
          verificationStatus: 'VERIFIED',
          status: 'ACTIVE',
        },
      };
      // For public marketplace, optionally filter past deadlines if requested or keep visible with badge
    } else if (requestedStatus && requestedStatus !== 'ALL') {
      where.status = requestedStatus;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { titleLocal: { contains: search, mode: 'insensitive' } },
        { jobCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { skillsRequired: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { employer: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (countryId && countryId !== 'ALL') {
      where.countryId = countryId;
    }

    if (categoryId && categoryId !== 'ALL') {
      where.jobCategoryId = categoryId;
    }

    if (employerId && employerId !== 'ALL') {
      where.employerId = employerId;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    if (minSalary && !isNaN(Number(minSalary))) {
      where.salaryMin = { gte: Number(minSalary) };
    }

    const [total, rawItems] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          country: { select: { id: true, name: true, code: true, flag: true, slug: true } },
          jobCategory: { select: { id: true, name: true, slug: true, icon: true } },
          employer: {
            select: {
              id: true,
              employerCode: true,
              companyName: true,
              companyNameLocal: true,
              verificationStatus: true,
              status: true,
              city: true,
            },
          },
          _count: {
            select: { applications: true },
          },
        },
      }),
    ]);

    // Format items with remaining vacancies and sanitization for public
    const items = rawItems.map((job) => {
      const remainingVacancies = Math.max(0, (job.vacancyCount || 0) - (job.filledCount || 0));
      const isExpired = job.applicationDeadline ? new Date(job.applicationDeadline) < new Date() : false;

      if (!isStaff) {
        // Public sanitized DTO
        const { reviewNotes, createdBy, ...publicData } = job as any;
        return {
          ...publicData,
          remainingVacancies,
          isExpired,
        };
      }

      return {
        ...job,
        remainingVacancies,
        isExpired,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('JOB_CREATE');
    const body = await request.json();

    const parsed = jobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Invariant check if attempting to create as PUBLISHED
    if (data.status === 'PUBLISHED') {
      if (!data.employerId || !data.employerId.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'An employer must be assigned before publishing a job vacancy. / চাকরি প্রকাশ করার পূর্বে নিয়োগকর্তা নির্বাচন বাধ্যতামূলক।',
          },
          { status: 400 }
        );
      }

      const assignedEmployer = await prisma.employer.findUnique({
        where: { id: data.employerId },
      });

      if (!assignedEmployer) {
        return NextResponse.json({ success: false, error: 'Employer not found' }, { status: 404 });
      }

      if (assignedEmployer.verificationStatus !== 'VERIFIED' || assignedEmployer.status !== 'ACTIVE') {
        return NextResponse.json(
          {
            success: false,
            error: 'Only verified and active employers can have published job vacancies. Please verify the employer first or save job as DRAFT. / শুধুমাত্র যাচাইকৃত ও সক্রিয় নিয়োগকর্তার চাকরি প্রকাশ করা যাবে।',
          },
          { status: 400 }
        );
      }
    }

    // Generate unique jobCode: SGR-JOB-2026-XXXXXX
    const jobCode = await generateFormattedId(prisma, 'job');

    // Generate unique slug
    let baseSlug = slugify(data.title);
    if (!baseSlug) baseSlug = 'job';
    let uniqueSlug = `${baseSlug}-${jobCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const existingSlug = await prisma.job.findUnique({
      where: { slug: uniqueSlug },
    });
    if (existingSlug) {
      uniqueSlug = `${uniqueSlug}-${Date.now().toString(36)}`;
    }

    const isPublished = data.status === 'PUBLISHED';

    const job = await prisma.job.create({
      data: {
        jobCode,
        title: data.title,
        titleLocal: data.titleLocal || null,
        slug: uniqueSlug,
        countryId: data.countryId,
        city: data.city || null,
        jobCategoryId: data.jobCategoryId,
        employerId: data.employerId || null,
        description: data.description,
        descriptionLocal: data.descriptionLocal || null,
        salaryMin: data.salaryMin !== undefined && data.salaryMin !== null ? data.salaryMin : null,
        salaryMax: data.salaryMax !== undefined && data.salaryMax !== null ? data.salaryMax : null,
        currency: data.currency || 'BDT',
        salaryPeriod: data.salaryPeriod || 'MONTHLY',
        experienceRequired: data.experienceRequired,
        educationRequired: data.educationRequired || null,
        ageMin: data.ageMin || null,
        ageMax: data.ageMax || null,
        languageRequirements: data.languageRequirements || null,
        skillsRequired: data.skillsRequired || null,
        vacancyCount: data.vacancyCount,
        filledCount: data.filledCount || 0,
        accommodation: data.accommodation,
        food: data.food,
        transportation: data.transportation,
        medical: data.medical,
        airTicket: data.airTicket,
        workingHours: data.workingHours || null,
        contractDuration: data.contractDuration || null,
        applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
        status: data.status,
        featured: data.featured,
        createdBy: currentUser.id,
        publishedAt: isPublished ? new Date() : null,
        publishedById: isPublished ? currentUser.id : null,
      },
      include: {
        country: true,
        jobCategory: true,
        employer: true,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'JOB_CREATE',
      entity: 'Job',
      entityId: job.id,
      newValue: { jobCode: job.jobCode, title: job.title, status: job.status },
    });

    return NextResponse.json({ success: true, data: job }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating job:', error);
    return NextResponse.json({ success: false, error: 'Failed to create job posting' }, { status: 500 });
  }
}
