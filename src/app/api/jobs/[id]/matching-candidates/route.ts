import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { calculateMatch, getMatchingApplicantsForJob } from '@/lib/matching';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('JOB_VIEW');
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '15', 10)));

    const job = await prisma.job.findFirst({
      where: {
        OR: [{ id }, { jobCode: id }, { slug: id }],
      },
      include: { country: true, jobCategory: true, employer: true },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const matches = await getMatchingApplicantsForJob(prisma, job.id, limit);

    // Fetch existing active applications for this job to flag whether candidate already applied
    const activeApplications = await prisma.application.findMany({
      where: {
        jobId: job.id,
        status: { notIn: ['REJECTED', 'WITHDRAWN', 'CANCELLED'] },
      },
      select: {
        id: true,
        applicantId: true,
        applicationCode: true,
        status: true,
      },
    });

    const activeAppMap = new Map<string, { id: string; code: string; status: string }>();
    activeApplications.forEach((app) => {
      activeAppMap.set(app.applicantId, {
        id: app.id,
        code: app.applicationCode,
        status: app.status,
      });
    });

    const enrichedMatches = matches.map((m) => {
      const activeApp = activeAppMap.get(m.applicant.id);
      return {
        ...m,
        hasActiveApplication: Boolean(activeApp),
        activeApplication: activeApp || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        job: {
          id: job.id,
          jobCode: job.jobCode,
          title: job.title,
          category: job.jobCategory?.name,
          country: job.country?.name,
          vacancies: job.vacancyCount || (job as any).vacancies || 0,
          filledCount: job.filledCount || 0,
          remainingVacancies: Math.max(0, (job.vacancyCount || (job as any).vacancies || 0) - (job.filledCount || 0)),
        },
        candidates: enrichedMatches,
        total: enrichedMatches.length,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Matching candidates error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch matching candidates' }, { status: 500 });
  }
}
