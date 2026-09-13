import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { calculateProcessingCaseFinancialSummary } from '@/lib/finance/ledger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;

    const summary = await calculateProcessingCaseFinancialSummary(prisma, id);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error fetching processing case financial summary:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch processing financial summary' },
      { status: 500 }
    );
  }
}
