import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const applicant = await requireApplicantAuth();
    const { id } = await params;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        job: { select: { title: true } },
      },
    });

    if (!interview || interview.applicantId !== applicant.id) {
      return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });
    }

    const updated = await prisma.interview.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        notes: interview.notes
          ? `${interview.notes}\nCandidate confirmed attendance at ${new Date().toISOString()}`
          : `Candidate confirmed attendance at ${new Date().toISOString()}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Interview attendance confirmed successfully',
      data: updated,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Confirm interview error:', error);
    return NextResponse.json({ success: false, error: 'Failed to confirm interview' }, { status: 500 });
  }
}
