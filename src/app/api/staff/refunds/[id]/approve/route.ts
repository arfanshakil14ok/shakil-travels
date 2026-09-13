import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { approveRefundSchema } from '@/lib/validations/finance';
import { approveRefund } from '@/lib/finance/refund';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const validation = approveRefundSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const refund = await approveRefund(prisma, {
      refundId: id,
      approvedById: currentUser.id,
      notes: data.notes,
    });

    return NextResponse.json({
      success: true,
      data: refund,
      message: `Refund ${refund.refundNumber} approved and ledger updated.`,
    });
  } catch (error: any) {
    console.error('Error approving refund:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to approve refund' },
      { status: 500 }
    );
  }
}
