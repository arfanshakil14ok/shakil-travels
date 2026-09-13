import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { createReceiptForPayment } from '@/lib/finance/receipt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;

    const payment = await prisma.payment.findFirst({
      where: { OR: [{ id }, { paymentNumber: id }, { transactionId: id }] },
      include: {
        receipts: true,
        applicant: true,
        invoice: {
          include: {
            items: true,
            job: true,
            employer: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    let receipt = payment.receipts && payment.receipts.length > 0 ? payment.receipts[0] : null;

    // If payment is CONFIRMED and has no receipt yet, generate one idempotently
    if (!receipt && payment.status === 'CONFIRMED') {
      receipt = await createReceiptForPayment(prisma, payment.id, currentUser.id);
    }

    if (!receipt) {
      return NextResponse.json(
        { success: false, error: 'No receipt available for this payment (payment must be confirmed).' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...receipt,
        payment,
      },
    });
  } catch (error: any) {
    console.error('Error fetching payment receipt:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}
