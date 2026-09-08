import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';
import { evaluateDepartureReadiness } from '@/lib/visa/readiness';

export async function GET() {
  try {
    const applicant = await requireApplicantAuth();

    const visaApplications = await prisma.visaApplication.findMany({
      where: { applicantId: applicant.id },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
            flag: true,
            recruitmentStatus: true,
          },
        },
        application: {
          select: {
            id: true,
            applicationCode: true,
            job: {
              select: {
                title: true,
                employer: { select: { companyName: true } },
              },
            },
          },
        },
        appointments: {
          orderBy: { appointmentDate: 'asc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            oldStatus: true,
            newStatus: true,
            reason: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Evaluate departure readiness for active cases
    const results = await Promise.all(
      visaApplications.map(async (visa) => {
        const readiness = await evaluateDepartureReadiness(prisma, visa.id);
        return {
          ...visa,
          readiness,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal visa error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch visa records' }, { status: 500 });
  }
}
