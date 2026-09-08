import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';

// Safe applicant-facing timeline definition
const STAGES = [
  { key: 'SUBMITTED', label: 'Application Submitted', description: 'Application received and registered' },
  { key: 'UNDER_REVIEW', label: 'Under Review', description: 'Profile and qualifications being evaluated' },
  { key: 'SHORTLISTED', label: 'Shortlisted', description: 'Profile selected for employer consideration' },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', description: 'Interview date and details arranged' },
  { key: 'SELECTED', label: 'Candidate Selected', description: 'Selected by overseas employer' },
  { key: 'OFFER_ACCEPTED', label: 'Offer / Contract', description: 'Employment contract signed' },
  { key: 'MEDICAL_PASSED', label: 'Medical Clearance', description: 'Health check completed and certified' },
  { key: 'VISA_PROCESSING', label: 'Visa Processing', description: 'Visa application submitted to embassy' },
  { key: 'VISA_APPROVED', label: 'Visa Approved', description: 'Visa issued and stamped' },
  { key: 'COMPLETED', label: 'Departure Complete', description: 'Flight booked and deployed to destination' },
];

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

    // Determine timeline progress index
    const currentStatus = application.status;
    const currentStageIndex = STAGES.findIndex((s) => s.key === currentStatus);

    const timeline = STAGES.map((stage, idx) => {
      let state = 'UPCOMING';
      if (currentStatus === 'REJECTED') {
        state = 'TERMINATED';
      } else if (idx < currentStageIndex) {
        state = 'COMPLETED';
      } else if (idx === currentStageIndex) {
        state = 'CURRENT';
      }
      return {
        ...stage,
        state,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        ...application,
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
