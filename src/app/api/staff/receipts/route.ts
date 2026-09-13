import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status')?.trim();
    const applicantId = searchParams.get('applicantId')?.trim();
    const candidateId = searchParams.get('candidateId')?.trim();
    const startDate = searchParams.get('startDate')?.trim();
    const endDate = searchParams.get('endDate')?.trim();
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

    if (startDate || endDate) {
      where.receiptDate = {};
      if (startDate) where.receiptDate.gte = new Date(startDate);
      if (endDate) where.receiptDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { receivedFrom: { contains: search, mode: 'insensitive' } },
        { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
        { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
        { payment: { paymentNumber: { contains: search, mode: 'insensitive' } } },
        { invoice: { invoiceNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [receipts, totalCount, aggregate] = await Promise.all([
      (prisma as any).receipt.findMany({
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
          payment: {
            select: {
              id: true,
              paymentNumber: true,
              paymentMethod: true,
              transactionId: true,
              bankName: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              title: true,
            },
          },
          issuedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { receiptDate: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).receipt.count({ where }),
      (prisma as any).receipt.aggregate({
        where: { ...where, status: 'ISSUED' },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: receipts,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalIssuedAmount: aggregate._sum.amount || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
