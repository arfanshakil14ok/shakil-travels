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

    const receipt = await (prisma as any).receipt.findFirst({
      where: {
        OR: [{ id }, { receiptNumber: id }],
      },
      include: {
        applicant: {
          select: {
            id: true,
            fullName: true,
            applicantNumber: true,
            passportNumber: true,
            phone: true,
            email: true,
            fatherName: true,
            address: true,
            upazila: true,
            district: true,
          },
        },
        payment: {
          include: {
            receivedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        invoice: {
          include: {
            items: true,
            job: true,
            employer: true,
          },
        },
        issuedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!receipt) {
      return NextResponse.json({ success: false, error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: receipt,
    });
  } catch (error: any) {
    console.error('Error fetching receipt detail:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}
