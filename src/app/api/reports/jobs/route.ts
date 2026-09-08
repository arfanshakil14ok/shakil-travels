import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { parseDateFilter } from '@/lib/reports/date-filter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('REPORT_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const preset = searchParams.get('preset') || 'THIS_YEAR';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    const { prismaDateFilter, label } = parseDateFilter(preset, customStart, customEnd);

    const jobs = await prisma.job.findMany({
      where: prismaDateFilter ? { createdAt: prismaDateFilter } : {},
      include: {
        country: { select: { name: true, code: true } },
        jobCategory: { select: { name: true } },
        employer: { select: { companyName: true } },
        applications: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const report = jobs.map((job) => {
      const totalApps = job.applications.length;
      const shortlisted = job.applications.filter((a) =>
        ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'OFFER_ACCEPTED', 'MEDICAL_PASSED', 'VISA_PROCESSING', 'VISA_APPROVED', 'COMPLETED'].includes(a.status)
      ).length;
      const selected = job.applications.filter((a) =>
        ['SELECTED', 'OFFER_ACCEPTED', 'MEDICAL_PASSED', 'VISA_PROCESSING', 'VISA_APPROVED', 'COMPLETED'].includes(a.status)
      ).length;
      const placed = job.applications.filter((a) => a.status === 'COMPLETED').length;

      const vacancies = job.vacancyCount || 1;
      const fillRate = Math.min(100, Math.round((placed / vacancies) * 100));

      return {
        id: job.id,
        jobCode: job.jobCode,
        title: job.title,
        country: job.country?.name || 'Unassigned',
        category: job.jobCategory?.name || 'General',
        employer: job.employer?.companyName || 'Direct',
        vacancies,
        totalApplications: totalApps,
        shortlisted,
        selected,
        placed,
        fillRate,
        status: job.status,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        filter: { preset, label },
        jobs: report,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Jobs report error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate jobs report' }, { status: 500 });
  }
}
