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
      prisma.invoice.aggregate({
        where: {
          status: { not: 'VOID' },
          ...(prismaDateFilter && { invoiceDate: prismaDateFilter }),
        },
        _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          ...(prismaDateFilter && { paymentDate: prismaDateFilter }),
        },
        _sum: { amount: true },
      }),
      prisma.job.count({ where: { status: 'ACTIVE' } }),
    ]);

    const totalBilled = Number(invoices._sum.totalAmount || 0);
    const totalPaid = Number(invoices._sum.paidAmount || 0);
    const totalDue = Number(invoices._sum.dueAmount || 0);
    const periodCollections = Number(payments._sum.amount || 0);

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
