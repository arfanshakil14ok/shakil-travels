import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';

export async function GET() {
  try {
    const applicant = await requireApplicantAuth();

    const applications = await prisma.application.findMany({
      where: { applicantId: applicant.id },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            jobCode: true,
            title: true,
            salaryMin: true,
            salaryMax: true,
            currency: true,
            country: { select: { name: true, flag: true } },
            employer: { select: { companyName: true } },
          },
        },
        visaApplications: {
          select: {
            id: true,
            visaApplicationNumber: true,
            status: true,
          },
          take: 1,
        },
        interviews: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            interviewType: true,
          },
          orderBy: { scheduledAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            documents: true,
            interviews: true,
            statusHistory: true,
          },
        },
      },
    });

    const formattedApplications = applications.map((app: any) => ({
      ...app,
      visaApplication: app.visaApplications?.[0] || null,
      job: app.job
        ? {
            ...app.job,
            salaryCurrency: app.job.currency,
            country: app.job.country
              ? {
                  ...app.job.country,
                  flagEmoji: app.job.country.flag,
                }
              : null,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedApplications,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal applications list error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch applications' }, { status: 500 });
  }
}
