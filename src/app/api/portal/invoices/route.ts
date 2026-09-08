import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';

export async function GET() {
  try {
    const applicant = await requireApplicantAuth();

    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { applicantId: applicant.id },
          { customer: { applicantId: applicant.id } },
        ],
        status: { not: 'VOID' },
      },
      include: {
        items: true,
        payments: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            paymentNumber: true,
            receiptNumber: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
          },
        },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    let totalBilled = 0;
    let totalPaid = 0;
    let totalDue = 0;

    for (const inv of invoices) {
      totalBilled += Number(inv.totalAmount || 0);
      totalPaid += Number(inv.paidAmount || 0);
      totalDue += Number(inv.dueAmount || 0);
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalBilled,
          totalPaid,
          totalDue,
          invoiceCount: invoices.length,
        },
        invoices,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal invoices error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
