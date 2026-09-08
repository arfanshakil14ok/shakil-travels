import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('PAYMENT_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search')?.trim();
    const method = searchParams.get('method');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'paymentDate';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { invoice: { invoiceNumber: { contains: search, mode: 'insensitive' } } },
        { invoice: { applicant: { fullName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (method && method !== 'ALL') {
      where.paymentMethod = method;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [total, items] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              currency: true,
              applicant: {
                select: { id: true, fullName: true, applicantNumber: true, phone: true },
              },
            },
          },
          customer: {
            select: { id: true, name: true, customerType: true },
          },
          receivedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching payments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
  }
}
