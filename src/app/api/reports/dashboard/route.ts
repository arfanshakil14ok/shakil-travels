import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { parseDateFilter } from '@/lib/reports/date-filter';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('DASHBOARD_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const preset = searchParams.get('preset') || 'THIS_MONTH';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    const { prismaDateFilter, label } = parseDateFilter(preset, customStart, customEnd);
    const dateQuery = prismaDateFilter ? { createdAt: prismaDateFilter } : {};

    const [
      totalApplicants,
      newApplicantsInRange,
      activeApplications,
      placedCandidates,
      activeVisaCases,
      inquiriesCount,
      invoices,
      payments,
      jobsCount,
    ] = await Promise.all([
      prisma.applicant.count(),
      prisma.applicant.count({ where: dateQuery }),
      prisma.application.count({
        where: { status: { notIn: ['REJECTED', 'WITHDRAWN', 'COMPLETED'] } },
      }),
      prisma.application.count({
        where: {
          status: 'COMPLETED',
          ...(prismaDateFilter && { completedAt: prismaDateFilter }),
        },
      }),
      prisma.visaApplication.count({
        where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPOINTMENT_SCHEDULED', 'BIOMETRICS_DONE', 'MEDICAL_DONE', 'EMBASSY_PROCESSING'] } },
      }),
      prisma.inquiry.count({ where: dateQuery }),
      prisma.invoice.findMany({
        where: {
          status: { not: 'VOID' },
          ...(prismaDateFilter && { invoiceDate: prismaDateFilter }),
        },
        select: { totalAmount: true, paidAmount: true, dueAmount: true },
      }),
      prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          ...(prismaDateFilter && { paymentDate: prismaDateFilter }),
        },
        select: { amount: true },
      }),
      prisma.job.count({ where: { status: 'ACTIVE' } }),
    ]);

    let totalBilled = 0;
    let totalPaid = 0;
    let totalDue = 0;

    for (const inv of invoices) {
      totalBilled += Number(inv.totalAmount || 0);
      totalPaid += Number(inv.paidAmount || 0);
      totalDue += Number(inv.dueAmount || 0);
    }

    let periodCollections = 0;
    for (const pay of payments) {
      periodCollections += Number(pay.amount || 0);
    }

    return NextResponse.json({
      success: true,
      data: {
        filter: { preset, label },
        kpis: {
          totalApplicants,
          newApplicantsInRange,
          activeApplications,
          placedCandidates,
          activeVisaCases,
          inquiriesCount,
          activeJobs: jobsCount,
          totalBilled,
          totalPaid,
          totalDue,
          periodCollections,
        },
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Executive dashboard stats error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch executive dashboard metrics' }, { status: 500 });
  }
}
