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
    const currentUser = await requirePermission('APPLICANT_EXPORT');
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');
    const countryId = searchParams.get('countryId');
    const categoryId = searchParams.get('categoryId');

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { applicantNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status && status !== 'ALL') where.status = status;
    if (countryId && countryId !== 'ALL') where.preferredCountryId = countryId;
    if (categoryId && categoryId !== 'ALL') where.preferredJobCategoryId = categoryId;

    const applicants = await prisma.applicant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        preferredCountry: true,
        preferredJobCategory: true,
        assignedStaff: true,
      },
    });

    const headers = [
      'Applicant ID',
      'Full Name',
      'Phone',
      'Email',
      'District',
      'Passport Number',
      'Passport Expiry',
      'Preferred Country',
      'Preferred Category',
      'Experience (Years)',
      'Education',
      'Status',
      'Assigned Staff',
      'Created Date',
    ];

    const rows = applicants.map((a) => [
      escapeCsvValue(a.applicantNumber),
      escapeCsvValue(a.fullName),
      escapeCsvValue(a.phone),
      escapeCsvValue(a.email || ''),
      escapeCsvValue(a.district || ''),
      escapeCsvValue(a.passportNumber || ''),
      escapeCsvValue(a.passportExpiry ? a.passportExpiry.toISOString().split('T')[0] : ''),
      escapeCsvValue(a.preferredCountry?.name || ''),
      escapeCsvValue(a.preferredJobCategory?.name || ''),
      escapeCsvValue(a.yearsOfExperience),
      escapeCsvValue(a.education || ''),
      escapeCsvValue(a.status),
      escapeCsvValue(a.assignedStaff?.name || ''),
      escapeCsvValue(a.createdAt.toISOString().split('T')[0]),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    await createAuditLog({
      userId: currentUser.id,
      action: 'APPLICANT_EXPORT',
      entity: 'Applicant',
      newValue: { count: applicants.length },
    });

    const dateStr = new Date().toISOString().split('T')[0];
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="applicants_export_${dateStr}.csv"`,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error exporting applicants:', error);
    return NextResponse.json({ success: false, error: 'Failed to export applicants' }, { status: 500 });
  }
}
