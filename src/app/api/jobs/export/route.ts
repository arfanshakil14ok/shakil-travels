import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';

function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requirePermission('JOB_EXPORT');
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get('status');
    const countryId = searchParams.get('countryId');
    const categoryId = searchParams.get('categoryId');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (countryId && countryId !== 'ALL') where.countryId = countryId;
    if (categoryId && categoryId !== 'ALL') where.jobCategoryId = categoryId;

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        country: true,
        jobCategory: true,
        employer: true,
      },
    });

    const headers = [
      'Job Code',
      'Title',
      'Country',
      'Category',
      'Employer',
      'Vacancies',
      'Salary Min',
      'Salary Max',
      'Currency',
      'Experience (Years)',
      'Working Hours',
      'Food Provided',
      'Accommodation',
      'Status',
      'Created Date',
    ];

    const rows = jobs.map((j) => [
      escapeCsvValue(j.jobCode),
      escapeCsvValue(j.title),
      escapeCsvValue(j.country.name),
      escapeCsvValue(j.jobCategory.name),
      escapeCsvValue(j.employer?.companyName || 'Confidential'),
      escapeCsvValue(j.vacancyCount),
      escapeCsvValue(j.salaryMin ? Number(j.salaryMin) : ''),
      escapeCsvValue(j.salaryMax ? Number(j.salaryMax) : ''),
      escapeCsvValue(j.currency),
      escapeCsvValue(j.experienceRequired),
      escapeCsvValue(j.workingHours || ''),
      escapeCsvValue(j.food ? 'Yes' : 'No'),
      escapeCsvValue(j.accommodation ? 'Yes' : 'No'),
      escapeCsvValue(j.status),
      escapeCsvValue(j.createdAt.toISOString().split('T')[0]),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    await createAuditLog({
      userId: currentUser.id,
      action: 'JOB_EXPORT',
      entity: 'Job',
      newValue: { count: jobs.length },
    });

    const dateStr = new Date().toISOString().split('T')[0];
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="jobs_export_${dateStr}.csv"`,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error exporting jobs:', error);
    return NextResponse.json({ success: false, error: 'Failed to export jobs' }, { status: 500 });
  }
}
