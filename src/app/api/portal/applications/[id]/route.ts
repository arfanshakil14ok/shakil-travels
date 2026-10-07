import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';
import { getEffectiveStage, generatePortalTimeline } from '@/lib/pipeline-sync';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const applicant = await requireApplicantAuth();
    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            jobCode: true,
            title: true,
            description: true,
            skillsRequired: true,
            salaryMin: true,
            salaryMax: true,
            currency: true,
            country: { select: { id: true, name: true, code: true, flag: true } },
            employer: { select: { companyName: true } },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            fromStage: true,
            toStage: true,
            notes: true,
            createdAt: true,
          },
        },
        documents: {
          select: {
            id: true,
            fileName: true,
            documentType: true,
            fileUrl: true,
            status: true,
            createdAt: true,
          },
        },
        interviews: {
          orderBy: { scheduledAt: 'desc' },
          select: {
            id: true,
            scheduledAt: true,
            interviewType: true,
            location: true,
            meetingLink: true,
            status: true,
            notes: true,
          },
        },
        processingCase: {
          select: {
            id: true,
            processingCode: true,
            currentStage: true,
            overallStatus: true,
          },
        },
        visaApplications: {
          include: {
            country: { select: { name: true, code: true } },
            appointments: {
              select: {
                id: true,
                appointmentType: true,
                appointmentDate: true,
                location: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // IDOR Check
    if (!application || application.applicantId !== applicant.id) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    // Determine effective stage taking into account processingCase and visaApplications
    const effectiveStage = getEffectiveStage(application);
    const timeline = generatePortalTimeline(effectiveStage);

    return NextResponse.json({
      success: true,
      data: {
        ...application,
        effectiveStage,
        effectiveStatus: effectiveStage,
        timeline,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal application detail error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch application details' }, { status: 500 });
  }
}
