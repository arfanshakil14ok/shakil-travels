import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';

interface CachedDashboardStats {
  data: any;
  cachedAt: number;
}

let _statsCache: CachedDashboardStats | null = null;
const DASHBOARD_CACHE_TTL_MS = 15000; // 15 seconds cache

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requirePermission('DASHBOARD_VIEW');
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    const now = Date.now();
    if (!forceRefresh && _statsCache && now - _statsCache.cachedAt < DASHBOARD_CACHE_TTL_MS) {
      // Unread notifications are user-specific; update for current user
      const unread = await prisma.notification.count({
        where: { userId: currentUser.id, isRead: false },
      });
      return NextResponse.json({
        success: true,
        data: {
          ..._statsCache.data,
          notifications: unread,
        },
        cached: true,
      });
    }

    const [
      staffGroups,
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
      prisma.user.groupBy({
        by: ['isActive'],
        _count: { _all: true },
      }),
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

    let activeStaff = 0;
    let inactiveStaff = 0;
    for (const g of staffGroups) {
      if (g.isActive) activeStaff += g._count._all;
      else inactiveStaff += g._count._all;
    }
    const totalStaff = activeStaff + inactiveStaff;

    const totalPayments = Number(paymentAggregate._sum.amount || 0);
    const totalDues = Number(invoiceAggregate._sum.dueAmount || 0);

    const data = {
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
    };

    _statsCache = {
      data,
      cachedAt: now,
    };

    return NextResponse.json({
      success: true,
      data,
      cached: false,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}
