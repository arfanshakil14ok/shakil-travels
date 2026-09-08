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
      invoices,
      overdueInvoices,
      todayPayments,
      monthPayments,
      allRefunds,
    ] = await Promise.all([
      prisma.invoice.findMany({
        where: { status: { not: 'VOID' } },
        select: { totalAmount: true, paidAmount: true, dueAmount: true, status: true },
      }),
      prisma.invoice.findMany({
        where: {
          status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
          dueDate: { lt: new Date() },
        },
        select: { dueAmount: true },
      }),
      prisma.payment.findMany({
        where: {
          paymentDate: { gte: today },
          status: 'COMPLETED',
        },
        select: { amount: true },
      }),
      prisma.payment.findMany({
        where: {
          paymentDate: { gte: firstDayOfMonth },
          status: 'COMPLETED',
        },
        select: { amount: true },
      }),
      prisma.refund.findMany({
        where: { status: 'COMPLETED' },
        select: { amount: true },
      }),
    ]);

    const totalInvoiced = invoices.reduce((sum, inv) => sum.plus(inv.totalAmount), toDecimal('0.00'));
    const totalCollected = invoices.reduce((sum, inv) => sum.plus(inv.paidAmount), toDecimal('0.00'));
    const totalDue = invoices.reduce((sum, inv) => sum.plus(inv.dueAmount), toDecimal('0.00'));

    const overdueCount = overdueInvoices.length;
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum.plus(inv.dueAmount), toDecimal('0.00'));

    const todayCollected = todayPayments.reduce((sum, p) => sum.plus(p.amount), toDecimal('0.00'));
    const monthCollected = monthPayments.reduce((sum, p) => sum.plus(p.amount), toDecimal('0.00'));
    const totalRefunded = allRefunds.reduce((sum, r) => sum.plus(r.amount), toDecimal('0.00'));

    const paidInvoicesCount = invoices.filter((inv) => inv.status === 'PAID').length;
    const partiallyPaidCount = invoices.filter((inv) => inv.status === 'PARTIALLY_PAID').length;
    const unpaidCount = invoices.filter((inv) => inv.status === 'ISSUED').length;

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
        invoiceCount: invoices.length,
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
