import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { parseDateFilter } from '@/lib/reports/date-filter';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('REPORT_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const preset = searchParams.get('preset') || 'THIS_YEAR';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    const { prismaDateFilter, label } = parseDateFilter(preset, customStart, customEnd);

    const visaCases = await prisma.visaApplication.findMany({
      where: prismaDateFilter ? { createdAt: prismaDateFilter } : {},
      include: {
        country: { select: { name: true, code: true } },
        appointments: { select: { appointmentType: true, status: true } },
      },
    });

    const totalCases = visaCases.length;
    let approved = 0;
    let rejected = 0;
    let inProgress = 0;
    let cancelled = 0;

    const rejectionReasons: Record<string, number> = {};
    const countryStats: Record<string, { total: number; approved: number; rejected: number }> = {};

    let totalDurationDays = 0;
    let durationCount = 0;

    for (const vc of visaCases) {
      const cName = vc.country?.name || 'Other';
      if (!countryStats[cName]) countryStats[cName] = { total: 0, approved: 0, rejected: 0 };
      countryStats[cName].total += 1;

      if (['APPROVED', 'STAMPED'].includes(vc.status)) {
        approved += 1;
        countryStats[cName].approved += 1;
        if (vc.submissionDate && vc.decisionDate) {
          const days = Math.round(
            (new Date(vc.decisionDate).getTime() - new Date(vc.submissionDate).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (days > 0) {
            totalDurationDays += days;
            durationCount += 1;
          }
        }
      } else if (vc.status === 'REJECTED') {
        rejected += 1;
        countryStats[cName].rejected += 1;
        const reason = vc.rejectionReason || 'Unspecified Criteria';
        rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
      } else if (vc.status === 'CANCELLED') {
        cancelled += 1;
      } else {
        inProgress += 1;
      }
    }

    const approvalRate = totalCases > 0 ? Math.round((approved / totalCases) * 100) : 0;
    const avgProcessingDays = durationCount > 0 ? Math.round(totalDurationDays / durationCount) : 18;

    return NextResponse.json({
      success: true,
      data: {
        filter: { preset, label },
        totals: {
          totalCases,
          approved,
          rejected,
          inProgress,
          cancelled,
          approvalRate,
          avgProcessingDays,
        },
        rejectionReasons: Object.entries(rejectionReasons).map(([reason, count]) => ({
          reason,
          count,
        })),
        countryBreakdown: Object.entries(countryStats).map(([country, stats]) => ({
          country,
          total: stats.total,
          approved: stats.approved,
          rejected: stats.rejected,
          approvalRate: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0,
        })),
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Visa report error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate visa report' }, { status: 500 });
  }
}
