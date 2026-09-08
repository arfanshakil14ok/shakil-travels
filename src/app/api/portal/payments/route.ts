import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';

export async function GET() {
  try {
    const applicant = await requireApplicantAuth();

    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { invoice: { applicantId: applicant.id } },
          { customer: { applicantId: applicant.id } },
        ],
      },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            totalAmount: true,
            status: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal payments error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
  }
}
