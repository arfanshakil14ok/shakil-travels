import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { createAdjustmentSchema } from '@/lib/validations/finance';
import { createFinancialAdjustment } from '@/lib/finance/adjustment';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);

    const adjustmentType = searchParams.get('adjustmentType')?.trim();
    const invoiceId = searchParams.get('invoiceId')?.trim();
    const applicantId = searchParams.get('applicantId')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (adjustmentType && adjustmentType !== 'ALL') {
      where.adjustmentType = adjustmentType;
    }

    if (invoiceId && invoiceId !== 'ALL') {
      where.invoiceId = invoiceId;
    }

    if (applicantId && applicantId !== 'ALL') {
      where.applicantId = applicantId;
    }

    const [adjustments, totalCount] = await Promise.all([
      (prisma as any).financialAdjustment.findMany({
        where,
        include: {
          applicant: {
            select: { id: true, fullName: true, applicantNumber: true, passportNumber: true },
          },
          invoice: {
            select: { id: true, invoiceNumber: true, totalAmount: true, status: true },
          },
          approvedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).financialAdjustment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: adjustments,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching adjustments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const validation = createAdjustmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const adjustment = await createFinancialAdjustment(prisma, {
      ...data,
      createdById: currentUser.id,
      autoApprove: data.autoApprove ?? true,
    });

    return NextResponse.json({
      success: true,
      data: adjustment,
      message: `Adjustment ${adjustment.adjustmentNumber || adjustment.id} created successfully.`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating adjustment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create adjustment' },
      { status: 500 }
    );
  }
}
