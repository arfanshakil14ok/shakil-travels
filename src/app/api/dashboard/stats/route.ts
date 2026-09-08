import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';

export async function GET() {
  try {
    const currentUser = await requirePermission('DASHBOARD_VIEW');

    const [
      totalStaff,
      activeStaff,
      inactiveStaff,
      unreadNotifications,
      totalAuditLogs,
      recentActivity,
      applicantCount,
      activeApplicantCount,
      totalJobCount,
      publishedJobCount,
      totalEmployerCount,
      totalCountryCount,
      applicationCount,
      invoiceCount,
      paymentAggregate,
      activeVisaCount,
      inquiryCount,
      placedCount,
      invoiceAggregate,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.notification.count({ where: { userId: currentUser.id, isRead: false } }),
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.applicant.count(),
      prisma.applicant.count({ where: { status: 'ACTIVE' } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: 'PUBLISHED' } }),
      prisma.employer.count(),
      prisma.country.count({ where: { isActive: true } }),
      prisma.application.count(),
      prisma.invoice.count(),
      prisma.payment.aggregate({
        _sum: { amount: true },
      }),
      prisma.visaApplication.count({
        where: { status: { notIn: ['APPROVED', 'STAMPED', 'REJECTED', 'CANCELLED'] } },
      }),
      prisma.inquiry.count({ where: { status: 'NEW' } }),
      prisma.application.count({ where: { status: 'COMPLETED' } }),
      prisma.invoice.aggregate({
        _sum: { dueAmount: true },
        where: { status: { not: 'VOID' } },
      }),
    ]);

    const totalPayments = Number(paymentAggregate._sum.amount || 0);
    const totalDues = Number(invoiceAggregate._sum.dueAmount || 0);

    return NextResponse.json({
      success: true,
      data: {
        staff: {
          total: totalStaff,
          active: activeStaff,
          inactive: inactiveStaff,
        },
        notifications: unreadNotifications,
        totalAuditLogs,
        recentActivity,
        business: {
          applicants: applicantCount,
          activeApplicants: activeApplicantCount,
          jobs: totalJobCount,
          publishedJobs: publishedJobCount,
          employers: totalEmployerCount,
          countries: totalCountryCount,
          applications: applicationCount,
          invoices: invoiceCount,
          payments: totalPayments,
          dues: totalDues,
          activeVisas: activeVisaCount,
          newInquiries: inquiryCount,
          placements: placedCount,
        },
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}
