import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('APPLICATION_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const jobId = searchParams.get('jobId');

    const where: any = {};
    if (status && status !== 'ALL') where.currentStatus = status;
    if (jobId && jobId !== 'ALL') where.jobId = jobId;

    const applications = await prisma.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        applicant: true,
        job: { include: { employer: true, country: true } },
        assignedStaff: true,
      },
    });

    const headers = [
      'Application Number',
      'Applicant ID',
      'Applicant Name',
      'Passport Number',
      'Phone',
      'Job Code',
      'Job Title',
      'Employer',
      'Country',
      'Status',
      'Priority',
      'Assigned Staff',
      'Applied Date',
    ];

    const rows = applications.map((app) => [
      `"${app.applicationNumber || app.applicationCode}"`,
      `"${app.applicant.applicantNumber}"`,
      `"${app.applicant.fullName.replace(/"/g, '""')}"`,
      `"${app.applicant.passportNumber || ''}"`,
      `"${app.applicant.phone}"`,
      `"${app.job.jobCode}"`,
      `"${app.job.title.replace(/"/g, '""')}"`,
      `"${app.job.employer?.companyName.replace(/"/g, '""') || 'Direct'}"`,
      `"${app.job.country.name}"`,
      `"${app.status || app.currentStage}"`,
      `"${app.priority}"`,
      `"${app.assignedStaff?.name || 'Unassigned'}"`,
      `"${app.createdAt.toISOString().split('T')[0]}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="applications-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error exporting applications:', error);
    return NextResponse.json({ success: false, error: 'Failed to export applications' }, { status: 500 });
  }
}
