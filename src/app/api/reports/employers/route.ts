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

    const employers = await prisma.employer.findMany({
      orderBy: { companyName: 'asc' },
      include: {
        country: { select: { name: true } },
        jobs: {
          where: prismaDateFilter ? { createdAt: prismaDateFilter } : {},
          include: {
            applications: {
              select: { id: true, status: true },
            },
          },
        },
        customer: {
          include: {
            invoices: {
              where: prismaDateFilter ? { createdAt: prismaDateFilter } : {},
              select: { totalAmount: true, paidAmount: true },
            },
          },
        },
      },
    });

    const report = employers.map((emp) => {
      let totalJobs = emp.jobs.length;
      let totalVacancies = 0;
      let totalApplications = 0;
      let totalPlacements = 0;

      for (const j of emp.jobs) {
        totalVacancies += j.vacancyCount || 0;
        totalApplications += j.applications.length;
        totalPlacements += j.applications.filter((a) => a.status === 'COMPLETED').length;
      }

      let totalBilled = 0;
      let totalPaid = 0;
      if (emp.customer?.invoices) {
        for (const inv of emp.customer.invoices) {
          totalBilled += Number(inv.totalAmount || 0);
          totalPaid += Number(inv.paidAmount || 0);
        }
      }

      return {
        id: emp.id,
        employerCode: emp.id.slice(0, 8).toUpperCase(),
        companyName: emp.companyName,
        country: emp.country?.name || 'Unassigned',
        contactPerson: emp.contactPerson,
        phone: emp.phone,
        totalJobs,
        totalVacancies,
        totalApplications,
        totalPlacements,
        totalBilled,
        totalPaid,
        status: emp.verificationStatus,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        filter: { preset, label },
        employers: report,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Employer report error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate employer report' }, { status: 500 });
  }
}
