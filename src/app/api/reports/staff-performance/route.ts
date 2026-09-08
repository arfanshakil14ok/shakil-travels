import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { parseDateFilter } from '@/lib/reports/date-filter';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('REPORT_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const preset = searchParams.get('preset') || 'THIS_MONTH';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    const { prismaDateFilter, label } = parseDateFilter(preset, customStart, customEnd);
    const dateQuery = prismaDateFilter ? { createdAt: prismaDateFilter } : {};

    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        role: { select: { name: true } },
        createdInterviews: { where: dateQuery, select: { id: true } },
        statusChanges: { where: dateQuery, select: { id: true } },
        visaStatusChanges: { where: dateQuery, select: { id: true } },
        assignedApplications: {
          select: { id: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const report = users.map((u) => {
      const activeApps = u.assignedApplications.filter((a) =>
        !['REJECTED', 'WITHDRAWN', 'COMPLETED'].includes(a.status)
      ).length;
      const completedPlacements = u.assignedApplications.filter((a) => a.status === 'COMPLETED').length;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role.name,
        interviewsCreated: u.createdInterviews.length,
        pipelineTransitions: u.statusChanges.length,
        visaTransitions: u.visaStatusChanges.length,
        activeApplications: activeApps,
        completedPlacements,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        filter: { preset, label },
        staff: report,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Staff performance error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate staff report' }, { status: 500 });
  }
}
