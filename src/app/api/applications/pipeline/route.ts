import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { getJobVacancyStats } from '@/lib/recruitment/vacancy';

const PIPELINE_COLUMNS = [
  { id: 'APPLIED', title: 'Applied', color: 'slate' },
  { id: 'SCREENING', title: 'Screening', color: 'blue' },
  { id: 'SHORTLISTED', title: 'Shortlisted', color: 'indigo' },
  { id: 'INTERVIEW_SCHEDULED', title: 'Interview Scheduled', color: 'violet' },
  { id: 'INTERVIEW_PASSED', title: 'Interview Passed', color: 'emerald' },
  { id: 'SELECTED', title: 'Selected (Quota)', color: 'amber' },
  { id: 'OFFER_LETTER_ISSUED', title: 'Offer Letter', color: 'cyan' },
  { id: 'CONTRACT_SIGNED', title: 'Contract Signed', color: 'teal' },
  { id: 'MEDICAL_PASSED', title: 'Medical Passed', color: 'green' },
  { id: 'VISA_STAMPED', title: 'Visa Stamped', color: 'purple' },
  { id: 'TICKET_CONFIRMED', title: 'Flight Confirmed', color: 'sky' },
  { id: 'RECRUITMENT_COMPLETED', title: 'Completed / Deployed', color: 'emerald' },
];

export async function GET(request: NextRequest) {
  try {
    await requirePermission('APPLICATION_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const assignedToId = searchParams.get('assignedToId');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search')?.trim();

    const where: any = {
      status: { notIn: ['REJECTED', 'CANCELLED'] },
    };

    if (jobId && jobId !== 'ALL') {
      where.jobId = jobId;
    }
    if (assignedToId && assignedToId !== 'ALL') {
      where.assignedStaffId = assignedToId;
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }
    if (search) {
      where.OR = [
        { applicationNumber: { contains: search, mode: 'insensitive' } },
        { applicationCode: { contains: search, mode: 'insensitive' } },
        { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
        { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
        { job: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      include: {
        applicant: {
          select: {
            id: true,
            applicantNumber: true,
            fullName: true,
            phone: true,
            passportNumber: true,
            profilePhoto: true,
            yearsOfExperience: true,
          },
        },
        job: {
          select: {
            id: true,
            jobCode: true,
            title: true,
            vacancyCount: true,
            employer: { select: { id: true, companyName: true } },
            country: { select: { id: true, name: true, flag: true } },
          },
        },
        assignedStaff: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { documents: true, interviews: true },
        },
      },
    });

    // Group by status column
    const grouped: Record<string, any[]> = {};
    for (const col of PIPELINE_COLUMNS) {
      grouped[col.id] = [];
    }

    for (const app of applications) {
      const employer = app.job?.employer || null;
      const country = app.job?.country || null;
      const appWithAlias = {
        ...app,
        assignedTo: app.assignedStaff,
        vacancies: app.job?.vacancyCount || 0,
        job: app.job
          ? {
              ...app.job,
              employer,
              country,
            }
          : null,
      };
      const currentStage = app.status || app.currentStage;
      if (grouped[currentStage]) {
        grouped[currentStage].push(appWithAlias);
      } else {
        // Any status outside the 12 main columns goes to APPLIED or appropriate fallback
        if (!grouped['APPLIED']) grouped['APPLIED'] = [];
        grouped['APPLIED'].push(appWithAlias);
      }
    }

    // If specific job is selected, fetch vacancy stats
    let vacancyStats = null;
    if (jobId && jobId !== 'ALL') {
      try {
        vacancyStats = await getJobVacancyStats(prisma, jobId);
      } catch {
        // Job not found or invalid
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        columns: PIPELINE_COLUMNS.map((col) => ({
          ...col,
          count: grouped[col.id]?.length || 0,
          items: grouped[col.id] || [],
        })),
        totalApplications: applications.length,
        vacancyStats,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching pipeline applications:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch pipeline' }, { status: 500 });
  }
}
