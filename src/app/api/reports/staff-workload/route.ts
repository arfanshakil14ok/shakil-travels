import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';

export async function GET() {
  try {
    await requirePermission('REPORT_VIEW');

    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        role: { select: { name: true } },
        assignedApplicants: {
          where: { status: { in: ['NEW', 'ACTIVE', 'SHORTLISTED'] } },
          select: { id: true },
        },
        assignedApplications: {
          where: { status: { notIn: ['REJECTED', 'WITHDRAWN', 'COMPLETED'] } },
          select: { id: true, status: true },
        },
        assignedVisaApps: {
          where: { status: { notIn: ['APPROVED', 'STAMPED', 'REJECTED', 'CANCELLED'] } },
          select: { id: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const report = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role.name,
      activeApplicants: u.assignedApplicants.length,
      activeApplications: u.assignedApplications.length,
      activeVisaCases: u.assignedVisaApps.length,
      totalActiveWorkload:
        u.assignedApplicants.length +
        u.assignedApplications.length +
        u.assignedVisaApps.length,
    }));

    return NextResponse.json({
      success: true,
      data: {
        staffWorkload: report,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Staff workload error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate staff workload report' }, { status: 500 });
  }
}
