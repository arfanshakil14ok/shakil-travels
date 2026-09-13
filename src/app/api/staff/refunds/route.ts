import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { requestRefundSchema } from '@/lib/validations/finance';
import { requestRefund } from '@/lib/finance/refund';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status')?.trim();
    const applicantId = searchParams.get('applicantId')?.trim();
    const candidateId = searchParams.get('candidateId')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const appTargetId = applicantId || candidateId;
    if (appTargetId && appTargetId !== 'ALL') {
      where.applicantId = appTargetId;
    }

    if (search) {
      where.OR = [
        { refundNumber: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
        { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [refunds, totalCount] = await Promise.all([
      prisma.refund.findMany({
        where,
        include: {
          applicant: {
            select: {
              id: true,
              fullName: true,
              applicantNumber: true,
              passportNumber: true,
              phone: true,
            },
          },
          payment: true,
          invoice: true,
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
          approvedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.refund.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: refunds,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching refunds:', error);
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

    const validation = requestRefundSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const refund = await requestRefund(prisma, {
      paymentId: data.paymentId,
      invoiceId: data.invoiceId,
      applicantId: data.applicantId || data.candidateId,
      amount: data.amount,
      reason: data.reason,
      refundMethod: data.refundMethod,
      notes: (data as any).notes || (data as any).beneficiaryDetails || null,
      beneficiaryDetails: (data as any).beneficiaryDetails || null,
      requestedById: currentUser.id,
    });

    return NextResponse.json({
      success: true,
      data: refund,
      message: `Refund request ${refund.refundNumber} submitted.`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error requesting refund:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to request refund' },
      { status: 500 }
    );
  }
}
