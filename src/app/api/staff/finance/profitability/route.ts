import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { generateProfitabilityReport } from '@/lib/finance/profitability';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);

    const employerId = searchParams.get('employerId')?.trim() || undefined;
    const jobId = searchParams.get('jobId')?.trim() || undefined;
    const startDate = searchParams.get('startDate')?.trim() ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate')?.trim() ? new Date(searchParams.get('endDate')!) : undefined;

    const report = await generateProfitabilityReport(prisma, {
      employerId: employerId !== 'ALL' ? employerId : undefined,
      jobId: jobId !== 'ALL' ? jobId : undefined,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Error generating profitability report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate profitability report' },
      { status: 500 }
    );
  }
}
