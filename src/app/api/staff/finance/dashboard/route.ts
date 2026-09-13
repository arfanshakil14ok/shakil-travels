import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { generateAgingReport } from '@/lib/finance/aging';
import { generateProfitabilityReport } from '@/lib/finance/profitability';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();

    // Calculate start of today and start of month
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      invoiceAgg,
      totalPaymentsAgg,
      todayPaymentsAgg,
      monthPaymentsAgg,
      costsAgg,
      aging,
      recentPayments,
      recentInvoices,
      methodBreakdown,
    ] = await Promise.all([
      // Total Invoiced & Due
      prisma.invoice.aggregate({
        where: { status: { notIn: ['VOID', 'CANCELLED', 'DRAFT'] } },
        _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
        _count: { id: true },
      }),
      // Total Lifetime Collections
      prisma.payment.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Today's Collections
      prisma.payment.aggregate({
        where: {
          status: 'CONFIRMED',
          paymentDate: { gte: startOfToday },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Month to Date Collections
      prisma.payment.aggregate({
        where: {
          status: 'CONFIRMED',
          paymentDate: { gte: startOfMonth },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Total Recruitment Direct Costs
      (prisma as any).recruitmentCost.aggregate({
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Accounts Receivable Aging
      generateAgingReport(prisma),
      // Recent Payments
      prisma.payment.findMany({
        where: { status: 'CONFIRMED' },
        include: {
          applicant: { select: { fullName: true, applicantNumber: true } },
          invoice: { select: { invoiceNumber: true } },
        },
        orderBy: { paymentDate: 'desc' },
        take: 5,
      }),
      // Recent Invoices
      prisma.invoice.findMany({
        include: {
          applicant: { select: { fullName: true, applicantNumber: true } },
          employer: { select: { companyName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Collection Breakdown by Payment Method (Month to Date)
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: {
          status: 'CONFIRMED',
          paymentDate: { gte: startOfMonth },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalInvoiced = invoiceAgg._sum.totalAmount || new Prisma.Decimal(0);
    const totalCollected = totalPaymentsAgg._sum.amount || new Prisma.Decimal(0);
    const totalDirectCosts = costsAgg._sum.amount || new Prisma.Decimal(0);
    const grossProfit = (totalInvoiced as Prisma.Decimal).sub(totalDirectCosts);
    const netCashMargin = (totalCollected as Prisma.Decimal).sub(totalDirectCosts);

    return NextResponse.json({
      success: true,
      summary: {
        totalInvoiced,
        totalCollected,
        totalOutstanding: aging.totalOutstanding,
        totalOverdue: aging.totalOverdue,
        totalDirectCosts,
        grossProfit,
        netCashMargin,
        todayCollection: todayPaymentsAgg._sum.amount || 0,
        todayCount: todayPaymentsAgg._count.id || 0,
        monthCollection: monthPaymentsAgg._sum.amount || 0,
        monthCount: monthPaymentsAgg._count.id || 0,
        invoicesCount: invoiceAgg._count.id || 0,
      },
      agingSummary: {
        buckets: aging.buckets,
        averageDaysOverdue: aging.averageDaysOverdue,
        overdueCount: aging.overdueInvoicesCount,
      },
      topDebtors: aging.topDebtors.slice(0, 5),
      methodBreakdown: methodBreakdown.map((m) => ({
        method: m.paymentMethod,
        amount: m._sum.amount || 0,
        count: m._count.id,
      })),
      recentPayments,
      recentInvoices,
    });
  } catch (error: any) {
    console.error('Error fetching finance dashboard:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
