import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { rejectPaymentSchema } from '@/lib/validations/finance';
import { rejectPayment } from '@/lib/finance/payment';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const validation = rejectPaymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const rejected = await rejectPayment(prisma, {
      paymentId: id,
      rejectedById: currentUser.id,
      reason: (data as any).reason || (data as any).rejectionReason || 'Payment rejected',
    });

    return NextResponse.json({
      success: true,
      data: rejected,
      message: `Payment ${rejected.paymentNumber} has been rejected.`,
    });
  } catch (error: any) {
    console.error('Error rejecting payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reject payment' },
      { status: 500 }
    );
  }
}
