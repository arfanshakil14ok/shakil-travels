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

    const countries = await prisma.country.findMany({
      orderBy: { name: 'asc' },
      include: {
        jobs: {
          where: prismaDateFilter ? { createdAt: prismaDateFilter } : {},
          select: { id: true, vacancyCount: true, applications: { select: { status: true } } },
        },
        visaApplications: {
          where: prismaDateFilter ? { createdAt: prismaDateFilter } : {},
          select: { id: true, status: true },
        },
      },
    });

    const report = countries.map((c: any) => {
      let totalVacancies = 0;
      let totalApplications = 0;
      let placedCount = 0;

      for (const j of c.jobs || []) {
        totalVacancies += j.vacancyCount || 0;
        totalApplications += j.applications?.length || 0;
        placedCount += (j.applications || []).filter((a: any) => a.status === 'COMPLETED').length;
      }

      const totalVisaCases = c.visaApplications?.length || 0;
      const approvedVisas = (c.visaApplications || []).filter((v: any) =>
        ['APPROVED', 'STAMPED'].includes(v.status)
      ).length;
      const rejectedVisas = (c.visaApplications || []).filter((v: any) => v.status === 'REJECTED').length;

      const visaApprovalRate =
        totalVisaCases > 0 ? Math.round((approvedVisas / totalVisaCases) * 100) : 0;

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        flagEmoji: c.flag,
        recruitmentStatus: c.recruitmentStatus,
        activeJobsCount: c.jobs?.length || 0,
        totalVacancies,
        totalApplications,
        placedCount,
        totalVisaCases,
        approvedVisas,
        rejectedVisas,
        visaApprovalRate,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        filter: { preset, label },
        countries: report,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Country report error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate country report' }, { status: 500 });
  }
}
