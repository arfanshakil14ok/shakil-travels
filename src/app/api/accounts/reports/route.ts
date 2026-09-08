import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { toDecimal } from '@/lib/accounting/calculations';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('ACCOUNTING_REPORTS_VIEW');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      invoiceItems,
      payments,
      unpaidInvoices,
    ] = await Promise.all([
      prisma.invoiceItem.findMany({
        where: { invoice: { status: { not: 'VOID' } } },
        include: { service: true },
      }),
      prisma.payment.findMany({
        where: { status: 'COMPLETED' },
        select: { amount: true, paymentMethod: true, paymentDate: true },
      }),
      prisma.invoice.findMany({
        where: {
          status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
          dueDate: { lt: now },
        },
        select: { dueAmount: true, dueDate: true, invoiceNumber: true, customerId: true, applicantId: true },
      }),
    ]);

    // 1. Service Revenue Breakdown
    const serviceMap: Record<string, { name: string; code: string; count: number; total: any }> = {};
    for (const item of invoiceItems) {
      const code = item.serviceCode || item.service?.serviceCode || 'OTHER';
      const name = item.service?.serviceName || item.description;
      if (!serviceMap[code]) {
        serviceMap[code] = { name, code, count: 0, total: toDecimal('0.00') };
      }
      serviceMap[code].count += item.quantity;
      serviceMap[code].total = serviceMap[code].total.plus(item.lineTotal);
    }

    const serviceRevenue = Object.values(serviceMap).map((s) => ({
      name: s.name,
      code: s.code,
      count: s.count,
      total: s.total.toFixed(2),
    }));

    // 2. Payment Method Breakdown
    const paymentMethods: Record<string, number> = {};
    for (const p of payments) {
      const m = p.paymentMethod;
      paymentMethods[m] = (paymentMethods[m] || 0) + Number(p.amount);
    }

    // 3. Aging Analysis (Overdue)
    let aging0to30 = toDecimal('0.00');
    let aging31to60 = toDecimal('0.00');
    let aging61to90 = toDecimal('0.00');
    let agingOver90 = toDecimal('0.00');

    for (const inv of unpaidInvoices) {
      if (!inv.dueDate) continue;
      const due = inv.dueDate;
      if (due >= thirtyDaysAgo) {
        aging0to30 = aging0to30.plus(inv.dueAmount);
      } else if (due >= sixtyDaysAgo) {
        aging31to60 = aging31to60.plus(inv.dueAmount);
      } else if (due >= ninetyDaysAgo) {
        aging61to90 = aging61to90.plus(inv.dueAmount);
      } else {
        agingOver90 = agingOver90.plus(inv.dueAmount);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        serviceRevenue,
        paymentMethods: Object.entries(paymentMethods).map(([method, amount]) => ({
          method,
          amount: amount.toFixed(2),
        })),
        aging: {
          '0-30 days': aging0to30.toFixed(2),
          '31-60 days': aging31to60.toFixed(2),
          '61-90 days': aging61to90.toFixed(2),
          '90+ days': agingOver90.toFixed(2),
        },
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error generating reports:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate reports' }, { status: 500 });
  }
}
