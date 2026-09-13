import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';
import { calculateCandidateBalance } from '@/lib/finance/ledger';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const applicant = await requireApplicantAuth();

    const [invoices, payments, receipts, paymentPlans, ledger] = await Promise.all([
      // Invoices
      prisma.invoice.findMany({
        where: {
          applicantId: applicant.id,
          status: { notIn: ['VOID', 'DRAFT'] },
        },
        include: {
          items: true,
          job: {
            select: { title: true, country: true },
          },
        },
        orderBy: { invoiceDate: 'desc' },
      }),
      // Payments
      prisma.payment.findMany({
        where: {
          applicantId: applicant.id,
        },
        include: {
          invoice: { select: { invoiceNumber: true } },
          receipts: { select: { id: true, receiptNumber: true } },
        },
        orderBy: { paymentDate: 'desc' },
      }),
      // Receipts
      (prisma as any).receipt.findMany({
        where: {
          applicantId: applicant.id,
          status: 'ISSUED',
        },
        include: {
          payment: { select: { paymentNumber: true, paymentMethod: true } },
          invoice: { select: { invoiceNumber: true } },
        },
        orderBy: { receiptDate: 'desc' },
      }),
      // Payment plans
      (prisma as any).paymentPlan.findMany({
        where: {
          applicantId: applicant.id,
        },
        include: {
          installments: { orderBy: { installmentNumber: 'asc' } },
          invoice: { select: { invoiceNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Ledger balance
      calculateCandidateBalance(prisma, applicant.id),
    ]);

    let totalInvoiced = new Prisma.Decimal(0);
    let totalPaid = new Prisma.Decimal(0);
    let totalDue = new Prisma.Decimal(0);

    for (const inv of invoices) {
      totalInvoiced = totalInvoiced.add(new Prisma.Decimal(inv.totalAmount));
      totalPaid = totalPaid.add(new Prisma.Decimal(inv.paidAmount));
      totalDue = totalDue.add(new Prisma.Decimal(inv.dueAmount));
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalInvoiced,
          totalPaid,
          totalDue,
          runningBalance: ledger.runningBalance,
          invoiceCount: invoices.length,
          paymentCount: payments.length,
          receiptCount: receipts.length,
          activePaymentPlansCount: paymentPlans.filter((p: any) => p.status === 'ACTIVE').length,
        },
        invoices,
        payments,
        receipts,
        paymentPlans,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal finance error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch financial data' }, { status: 500 });
  }
}
