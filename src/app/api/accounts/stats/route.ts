import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { toDecimal } from '@/lib/accounting/calculations';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('INVOICE_VIEW');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      invoiceAgg,
      overdueAgg,
      todayAgg,
      monthAgg,
      refundAgg,
      invoiceStatusCounts,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: { status: { not: 'VOID' } },
        _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: {
          status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
          dueDate: { lt: new Date() },
        },
        _sum: { dueAmount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          paymentDate: { gte: today },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          paymentDate: { gte: firstDayOfMonth },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.refund.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.invoice.groupBy({
        by: ['status'],
        where: { status: { not: 'VOID' } },
        _count: true,
      }),
    ]);

    const totalInvoiced = toDecimal(invoiceAgg._sum.totalAmount);
    const totalCollected = toDecimal(invoiceAgg._sum.paidAmount);
    const totalDue = toDecimal(invoiceAgg._sum.dueAmount);

    const overdueCount = overdueAgg._count || 0;
    const overdueAmount = toDecimal(overdueAgg._sum.dueAmount);

    const todayCollected = toDecimal(todayAgg._sum.amount);
    const monthCollected = toDecimal(monthAgg._sum.amount);
    const totalRefunded = toDecimal(refundAgg._sum.amount);

    const statusMap = Object.fromEntries(invoiceStatusCounts.map((c) => [c.status, c._count]));
    const paidInvoicesCount = statusMap['PAID'] || 0;
    const partiallyPaidCount = statusMap['PARTIALLY_PAID'] || 0;
    const unpaidCount = statusMap['ISSUED'] || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalInvoiced: totalInvoiced.toFixed(2),
        totalCollected: totalCollected.toFixed(2),
        totalDue: totalDue.toFixed(2),
        overdueCount,
        overdueAmount: overdueAmount.toFixed(2),
        todayCollected: todayCollected.toFixed(2),
        monthCollected: monthCollected.toFixed(2),
        totalRefunded: totalRefunded.toFixed(2),
        invoiceCount: invoiceAgg._count || 0,
        breakdown: {
          paidCount: paidInvoicesCount,
          partiallyPaidCount,
          unpaidCount,
        },
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching accounting stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch accounting statistics' }, { status: 500 });
  }
}
