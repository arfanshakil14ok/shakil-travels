import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;

    const plan = await (prisma as any).paymentPlan.findFirst({
      where: { OR: [{ id }, { planNumber: id }] },
      include: {
        applicant: true,
        invoice: {
          include: {
            items: true,
            payments: true,
          },
        },
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Payment plan not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    console.error('Error fetching payment plan detail:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payment plan' },
      { status: 500 }
    );
  }
}
