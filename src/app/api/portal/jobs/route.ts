import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentApplicant } from '@/lib/portal-auth';

export async function GET(request: NextRequest) {
  try {
    const applicant = await getCurrentApplicant();

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const search = searchParams.get('search') || '';
    const countryId = searchParams.get('countryId') || '';
    const categoryId = searchParams.get('categoryId') || '';

    const where: any = {
      status: { in: ['ACTIVE', 'PUBLISHED'] },
    };

    if (countryId && countryId !== 'ALL') where.countryId = countryId;
    if (categoryId && categoryId !== 'ALL') where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { jobCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, jobs, applicantApplications] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          country: { select: { id: true, name: true, code: true, flag: true } },
          jobCategory: { select: { id: true, name: true, slug: true } },
          employer: { select: { id: true, companyName: true } },
        },
      }),
      applicant
        ? prisma.application.findMany({
            where: { applicantId: applicant.id },
            select: { jobId: true, id: true, status: true, applicationCode: true },
          })
        : Promise.resolve([]),
    ]);

    const appliedJobMap = new Map(applicantApplications.map((a) => [a.jobId, a]));

    const enrichedJobs = jobs.map((job) => {
      const application = appliedJobMap.get(job.id);
      return {
        ...job,
        category: job.jobCategory,
        country: job.country ? { ...job.country, flagEmoji: job.country.flag } : null,
        hasApplied: !!application,
        applicationId: application?.id || null,
        applicationStatus: application?.status || null,
        applicationCode: application?.applicationCode || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: enrichedJobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Portal jobs error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
