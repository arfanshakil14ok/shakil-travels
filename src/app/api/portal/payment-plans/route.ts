import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';

export async function GET() {
  try {
    const applicant = await requireApplicantAuth();

    const paymentPlans = await (prisma as any).paymentPlan.findMany({
      where: { applicantId: applicant.id },
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            paidAmount: true,
            dueAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: paymentPlans,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal payment plans error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payment plans' }, { status: 500 });
  }
}
