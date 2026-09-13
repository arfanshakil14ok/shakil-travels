import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { confirmPaymentSchema } from '@/lib/validations/finance';
import { confirmPayment } from '@/lib/finance/payment';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const validation = confirmPaymentSchema.safeParse(body);
    const data = validation.success ? validation.data : {};

    const confirmed = await confirmPayment(prisma, {
      paymentId: id,
      confirmedById: currentUser.id,
      notes: data.notes,
    });

    return NextResponse.json({
      success: true,
      data: confirmed,
      message: `Payment ${confirmed.paymentNumber} has been confirmed. Receipt generated.`,
    });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
