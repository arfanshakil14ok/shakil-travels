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

    const refund = await prisma.refund.findFirst({
      where: { OR: [{ id }, { refundNumber: id }] },
      include: {
        applicant: true,
        payment: true,
        invoice: true,
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!refund) {
      return NextResponse.json({ success: false, error: 'Refund not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: refund,
    });
  } catch (error: any) {
    console.error('Error fetching refund detail:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch refund' },
      { status: 500 }
    );
  }
}
