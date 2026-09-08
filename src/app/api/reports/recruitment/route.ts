import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { parseDateFilter } from '@/lib/reports/date-filter';
import { calculateRecruitmentFunnel } from '@/lib/reports/funnel';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('REPORT_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const preset = searchParams.get('preset') || 'THIS_MONTH';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    const { prismaDateFilter, label } = parseDateFilter(preset, customStart, customEnd);

    const funnel = await calculateRecruitmentFunnel(prisma, prismaDateFilter);

    // Also get distribution by status
    const statusCounts = await prisma.application.groupBy({
      by: ['status'],
      where: prismaDateFilter ? { createdAt: prismaDateFilter } : {},
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        filter: { preset, label },
        funnel,
        statusDistribution: statusCounts.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Recruitment report error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate recruitment report' }, { status: 500 });
  }
}
