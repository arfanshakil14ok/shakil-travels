import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { generateAgingReport } from '@/lib/finance/aging';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);

    const employerId = searchParams.get('employerId')?.trim() || undefined;
    const jobId = searchParams.get('jobId')?.trim() || undefined;
    const applicantId = searchParams.get('applicantId')?.trim() || undefined;

    const report = await generateAgingReport(prisma, {
      employerId: employerId !== 'ALL' ? employerId : undefined,
      jobId: jobId !== 'ALL' ? jobId : undefined,
      applicantId: applicantId !== 'ALL' ? applicantId : undefined,
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Error generating aging report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate aging report' },
      { status: 500 }
    );
  }
}
