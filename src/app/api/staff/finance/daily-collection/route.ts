import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);

    const dateStr = searchParams.get('date')?.trim();
    const targetDate = dateStr ? new Date(dateStr) : new Date();

    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        applicant: {
          select: { id: true, fullName: true, applicantNumber: true, passportNumber: true },
        },
        invoice: {
          select: { id: true, invoiceNumber: true, totalAmount: true },
        },
        receipts: {
          select: { id: true, receiptNumber: true },
        },
        receivedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    let totalCollected = new Prisma.Decimal(0);
    let totalPending = new Prisma.Decimal(0);
    let totalConfirmed = new Prisma.Decimal(0);
    const byMethod: Record<string, { count: number; amount: Prisma.Decimal }> = {};

    for (const p of payments) {
      const amt = new Prisma.Decimal(p.amount);
      if (p.status === 'CONFIRMED' || p.status === 'COMPLETED') {
        totalConfirmed = totalConfirmed.add(amt);
        totalCollected = totalCollected.add(amt);

        const method = p.paymentMethod || 'OTHER';
        if (!byMethod[method]) {
          byMethod[method] = { count: 0, amount: new Prisma.Decimal(0) };
        }
        byMethod[method].count += 1;
        byMethod[method].amount = byMethod[method].amount.add(amt);
      } else if (p.status === 'PENDING') {
        totalPending = totalPending.add(amt);
      }
    }

    return NextResponse.json({
      success: true,
      date: startOfDay.toISOString().split('T')[0],
      summary: {
        totalPaymentsCount: payments.length,
        totalCollected,
        totalConfirmed,
        totalPending,
        byMethod,
      },
      payments,
    });
  } catch (error: any) {
    console.error('Error fetching daily collection:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch daily collection' },
      { status: 500 }
    );
  }
}
