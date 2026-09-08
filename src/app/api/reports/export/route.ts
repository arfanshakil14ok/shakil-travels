import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { generateCsvString } from '@/lib/reports/csv-export';
import { parseDateFilter } from '@/lib/reports/date-filter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('REPORT_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'jobs';
    const preset = searchParams.get('preset') || 'ALL_TIME';

    const { prismaDateFilter } = parseDateFilter(preset);
    const dateQuery = prismaDateFilter ? { createdAt: prismaDateFilter } : {};

    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `sgr_${type}_report_${Date.now()}.csv`;

    switch (type) {
      case 'jobs': {
        const jobs = await prisma.job.findMany({
          where: dateQuery,
          include: {
            country: { select: { name: true } },
            jobCategory: { select: { name: true } },
            employer: { select: { companyName: true } },
            applications: { select: { status: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        headers = ['Job Code', 'Job Title', 'Country', 'Category', 'Employer', 'Vacancies', 'Applications', 'Placed', 'Fill Rate %', 'Status'];
        rows = jobs.map((j) => {
          const placed = j.applications.filter((a) => a.status === 'COMPLETED').length;
          const fillRate = j.vacancyCount ? Math.round((placed / j.vacancyCount) * 100) : 0;
          return [
            j.jobCode,
            j.title,
            j.country?.name || 'N/A',
            j.jobCategory?.name || 'General',
            j.employer?.companyName || 'Direct',
            j.vacancyCount,
            j.applications.length,
            placed,
            `${fillRate}%`,
            j.status,
          ];
        });
        break;
      }

      case 'financial': {
        const invoices = await prisma.invoice.findMany({
          where: {
            status: { not: 'VOID' },
            ...(prismaDateFilter && { invoiceDate: prismaDateFilter }),
          },
          include: {
            customer: { select: { name: true, phone: true } },
            applicant: { select: { applicantNumber: true, fullName: true } },
          },
          orderBy: { invoiceDate: 'desc' },
        });

        headers = ['Invoice Number', 'Client Name', 'Applicant Ref', 'Phone', 'Invoice Date', 'Due Date', 'Total (BDT)', 'Paid (BDT)', 'Due (BDT)', 'Status'];
        rows = invoices.map((inv) => [
          inv.invoiceNumber,
          inv.customer?.name || inv.applicant?.fullName || 'N/A',
          inv.applicant?.applicantNumber || 'N/A',
          inv.customer?.phone || 'N/A',
          new Date(inv.invoiceDate).toLocaleDateString(),
          inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A',
          Number(inv.totalAmount).toFixed(2),
          Number(inv.paidAmount).toFixed(2),
          Number(inv.dueAmount).toFixed(2),
          inv.status,
        ]);
        break;
      }

      case 'visa': {
        const visaCases = await prisma.visaApplication.findMany({
          where: dateQuery,
          include: {
            country: { select: { name: true } },
            applicant: { select: { applicantNumber: true, fullName: true, phone: true } },
            application: { select: { applicationCode: true, job: { select: { title: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        });

        headers = ['Visa File Ref', 'Applicant ID', 'Applicant Name', 'Phone', 'Destination Country', 'Job Title', 'Submission Date', 'Decision Date', 'Status'];
        rows = visaCases.map((vc) => [
          vc.visaApplicationNumber,
          vc.applicant.applicantNumber,
          vc.applicant.fullName,
          vc.applicant.phone,
          vc.country?.name || 'N/A',
          vc.application?.job?.title || 'N/A',
          vc.submissionDate ? new Date(vc.submissionDate).toLocaleDateString() : 'N/A',
          vc.decisionDate ? new Date(vc.decisionDate).toLocaleDateString() : 'N/A',
          vc.status,
        ]);
        break;
      }

      case 'employers': {
        const employers = await prisma.employer.findMany({
          include: {
            country: { select: { name: true } },
            jobs: { select: { vacancyCount: true, applications: { select: { status: true } } } },
          },
          orderBy: { companyName: 'asc' },
        });

        headers = ['Employer Code', 'Company Name', 'Country', 'Contact Person', 'Phone', 'Total Jobs', 'Total Vacancies', 'Total Placed', 'Status'];
        rows = employers.map((emp) => {
          let vac = 0;
          let placed = 0;
          for (const j of emp.jobs) {
            vac += j.vacancyCount || 0;
            placed += j.applications.filter((a) => a.status === 'COMPLETED').length;
          }
          return [
            emp.id.slice(0, 8).toUpperCase(),
            emp.companyName,
            emp.country?.name || 'N/A',
            emp.contactPerson || 'N/A',
            emp.phone || 'N/A',
            emp.jobs.length,
            vac,
            placed,
            emp.verificationStatus,
          ];
        });
        break;
      }

      default: {
        return NextResponse.json({ success: false, error: `Unknown export report type: ${type}` }, { status: 400 });
      }
    }

    const csvContent = generateCsvString(headers, rows);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('CSV Export error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate CSV export' }, { status: 500 });
  }
}
