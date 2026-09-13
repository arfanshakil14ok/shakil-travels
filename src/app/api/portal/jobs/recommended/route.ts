import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth, getCurrentApplicant } from '@/lib/portal-auth';
import { getCurrentUser } from '@/lib/auth';
import { getMatchingJobsForApplicant } from '@/lib/matching';

export async function GET(request: NextRequest) {
  try {
    let applicantId: string | null = null;

    // First check candidate portal session
    const portalApplicant = await getCurrentApplicant();
    if (portalApplicant) {
      applicantId = portalApplicant.id;
    } else {
      // Fallback to user session
      const currentUser = await getCurrentUser();
      if (currentUser?.email) {
        const found = await prisma.applicant.findFirst({
          where: { email: currentUser.email },
        });
        if (found) applicantId = found.id;
      }
    }

    if (!applicantId) {
      return NextResponse.json(
        { success: false, error: 'Candidate profile not authenticated' },
        { status: 401 }
      );
    }

    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
      include: {
        preferredCountry: true,
        preferredJobCategory: true,
      },
    });

    if (!applicant) {
      return NextResponse.json(
        { success: false, error: 'Candidate profile not found' },
        { status: 404 }
      );
    }

    const recommendations = await getMatchingJobsForApplicant(prisma, applicant.id, 6);

    const applications = await prisma.application.findMany({
      where: { applicantId: applicant.id },
      select: { jobId: true },
    });
    const appliedJobIds = new Set(applications.map((a) => a.jobId));

    const formatted = recommendations.map((item) => ({
      ...item,
      hasApplied: appliedJobIds.has(item.job.id),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      meta: {
        applicantNumber: applicant.applicantNumber,
        preferredCountry: applicant.preferredCountry?.name || null,
        preferredTrade: applicant.preferredJobCategory?.name || null,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching recommended jobs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}
