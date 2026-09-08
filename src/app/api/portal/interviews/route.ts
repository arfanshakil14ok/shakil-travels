import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';

export async function GET() {
  try {
    const applicant = await requireApplicantAuth();

    const interviews = await prisma.interview.findMany({
      where: { applicantId: applicant.id },
      include: {
        job: {
          select: {
            title: true,
            jobCode: true,
            country: { select: { name: true } },
            employer: { select: { companyName: true } },
          },
        },
        application: {
          select: {
            id: true,
            applicationCode: true,
            status: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: interviews,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal interviews error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch interviews' }, { status: 500 });
  }
}
