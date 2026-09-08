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

    const [invoices, payments, refunds] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          status: { not: 'VOID' },
          ...(prismaDateFilter && { invoiceDate: prismaDateFilter }),
        },
        include: {
          customer: { select: { name: true, customerType: true } },
          items: true,
        },
      }),
      prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          ...(prismaDateFilter && { paymentDate: prismaDateFilter }),
        },
      }),
      prisma.refund.findMany({
        where: prismaDateFilter ? { refundDate: prismaDateFilter } : {},
      }),
    ]);

    let totalBilled = 0;
    let totalPaid = 0;
    let totalDue = 0;

    const now = new Date();
    let currentDue = 0;
    let overdue1to30 = 0;
    let overdue31to60 = 0;
    let overdue60plus = 0;

    for (const inv of invoices) {
      const b = Number(inv.totalAmount || 0);
      const p = Number(inv.paidAmount || 0);
      const d = Number(inv.dueAmount || 0);

      totalBilled += b;
      totalPaid += p;
      totalDue += d;

      if (d > 0 && inv.dueDate) {
        const dueD = new Date(inv.dueDate);
        const diffDays = Math.floor((now.getTime() - dueD.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) {
          currentDue += d;
        } else if (diffDays <= 30) {
          overdue1to30 += d;
        } else if (diffDays <= 60) {
          overdue31to60 += d;
        } else {
          overdue60plus += d;
        }
      } else if (d > 0) {
        currentDue += d;
      }
    }

    // Payment method distribution
    const methodMap: Record<string, number> = {};
    let totalCollected = 0;
    for (const p of payments) {
      const amt = Number(p.amount || 0);
      totalCollected += amt;
      const m = p.paymentMethod || 'OTHER';
      methodMap[m] = (methodMap[m] || 0) + amt;
    }

    // Refunds total
    let totalRefunded = 0;
    for (const r of refunds) {
      totalRefunded += Number(r.amount || 0);
    }

    return NextResponse.json({
      success: true,
      data: {
        filter: { preset, label },
        totals: {
          totalBilled,
          totalPaid,
          totalDue,
          totalCollected,
          totalRefunded,
          netRevenue: totalCollected - totalRefunded,
        },
        aging: {
          currentDue,
          overdue1to30,
          overdue31to60,
          overdue60plus,
        },
        paymentMethods: Object.entries(methodMap).map(([method, amount]) => ({
          method,
          amount,
        })),
        invoiceCount: invoices.length,
        paymentCount: payments.length,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Financial report error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate financial report' }, { status: 500 });
  }
}
