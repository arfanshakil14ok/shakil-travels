import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { recordPaymentSchema } from '@/lib/validations/finance';
import { recordPaymentTransaction } from '@/lib/finance/payment';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status')?.trim();
    const paymentMethod = searchParams.get('paymentMethod')?.trim();
    const applicantId = searchParams.get('applicantId')?.trim();
    const candidateId = searchParams.get('candidateId')?.trim();
    const invoiceId = searchParams.get('invoiceId')?.trim();
    const startDate = searchParams.get('startDate')?.trim();
    const endDate = searchParams.get('endDate')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod;
    }

    const appTargetId = applicantId || candidateId;
    if (appTargetId && appTargetId !== 'ALL') {
      where.applicantId = appTargetId;
    }

    if (invoiceId && invoiceId !== 'ALL') {
      where.invoiceId = invoiceId;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { transactionId: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
        { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
        { invoice: { invoiceNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [payments, totalCount, aggregate] = await Promise.all([
      prisma.payment.findMany({
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
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              dueAmount: true,
              status: true,
            },
          },
          receipts: {
            select: {
              id: true,
              receiptNumber: true,
              receiptDate: true,
            },
          },
          receivedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where: { ...where, status: 'CONFIRMED' },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalConfirmedAmount: aggregate._sum.amount || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const validation = recordPaymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const payment = await recordPaymentTransaction(prisma, {
      ...data,
      createdById: currentUser.id,
      candidateId: data.candidateId || data.applicantId || null,
      applicantId: data.applicantId || data.candidateId || null,
      autoConfirm: data.autoConfirm ?? true,
    });

    return NextResponse.json({
      success: true,
      data: payment,
      message: `Payment ${payment.paymentNumber} recorded successfully.`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record payment' },
      { status: 500 }
    );
  }
}
