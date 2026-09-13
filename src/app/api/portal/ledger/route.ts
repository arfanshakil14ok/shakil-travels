import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';
import { calculateCandidateBalance } from '@/lib/finance/ledger';

export async function GET() {
  try {
    const applicant = await requireApplicantAuth();

    const { entries, totalDebit, totalCredit, runningBalance } = await calculateCandidateBalance(
      prisma,
      applicant.id
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalDebit,
          totalCredit,
          runningBalance,
          entriesCount: entries.length,
        },
        entries,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal ledger error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch ledger' }, { status: 500 });
  }
}
