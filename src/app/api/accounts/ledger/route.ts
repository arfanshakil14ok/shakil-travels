import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { getCustomerLedger } from '@/lib/accounting/ledger';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('ACCOUNTING_LEDGER_VIEW');

    const searchParams = request.nextUrl.searchParams;
    let customerId = searchParams.get('customerId');
    const applicantId = searchParams.get('applicantId');
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    if (!customerId && applicantId) {
      const applicant = await prisma.applicant.findUnique({
        where: { id: applicantId },
        include: { customer: true },
      });
      if (applicant?.customer) {
        customerId = applicant.customer.id;
      }
    }

    if (!customerId) {
      // If neither customerId nor applicantId provided, return recent ledger entries across customers
      const transactions = await prisma.financialTransaction.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              customerType: true,
              applicant: {
                select: { id: true, applicantNumber: true, fullName: true },
              },
            },
          },
          invoice: {
            select: { id: true, invoiceNumber: true },
          },
          payment: {
            select: { id: true, paymentNumber: true, receiptNumber: true },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          transactions,
          customer: null,
          totalDebit: transactions.reduce((acc, t) => acc + Number(t.debit), 0).toFixed(2),
          totalCredit: transactions.reduce((acc, t) => acc + Number(t.credit), 0).toFixed(2),
        },
      });
    }

    const ledger = await getCustomerLedger(prisma, customerId, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: ledger,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching customer ledger:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch ledger' }, { status: 500 });
  }
}
