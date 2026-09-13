import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { calculateCandidateBalance } from '@/lib/finance/ledger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;

    // Check applicant by id or applicantNumber or passportNumber
    const applicant = await prisma.applicant.findFirst({
      where: {
        OR: [{ id }, { applicantNumber: id }, { passportNumber: id }],
      },
      select: {
        id: true,
        fullName: true,
        applicantNumber: true,
        passportNumber: true,
        phone: true,
        email: true,
      },
    });

    if (!applicant) {
      return NextResponse.json({ success: false, error: 'Candidate/Applicant not found' }, { status: 404 });
    }

    const { entries, totalDebit, totalCredit, runningBalance } = await calculateCandidateBalance(
      prisma,
      applicant.id
    );

    return NextResponse.json({
      success: true,
      applicant,
      summary: {
        totalDebit,
        totalCredit,
        runningBalance,
        entryCount: entries.length,
      },
      entries,
    });
  } catch (error: any) {
    console.error('Error fetching candidate ledger:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch candidate ledger' },
      { status: 500 }
    );
  }
}
