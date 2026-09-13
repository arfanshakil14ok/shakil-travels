import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { createAdjustmentLedgerEntry } from '@/lib/finance/ledger';
import { deriveInvoiceStatus, toDecimal } from '@/lib/finance/invoice';
import { Prisma } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;

    const adjustment = await (prisma as any).financialAdjustment.findFirst({
      where: { OR: [{ id }, { adjustmentNumber: id }] },
      include: {
        applicant: true,
        invoice: {
          include: {
            items: true,
            job: true,
            employer: true,
          },
        },
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!adjustment) {
      return NextResponse.json({ success: false, error: 'Adjustment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: adjustment,
    });
  } catch (error: any) {
    console.error('Error fetching adjustment detail:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch adjustment' },
      { status: 500 }
    );
  }
}
