import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { createInvoiceSchema } from '@/lib/validations/finance';
import { createInvoice, deriveInvoiceStatus } from '@/lib/finance/invoice';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status')?.trim();
    const invoiceType = searchParams.get('invoiceType')?.trim();
    const applicantId = searchParams.get('applicantId')?.trim();
    const candidateId = searchParams.get('candidateId')?.trim();
    const employerId = searchParams.get('employerId')?.trim();
    const jobId = searchParams.get('jobId')?.trim();
    const applicationId = searchParams.get('applicationId')?.trim();
    const processingCaseId = searchParams.get('processingCaseId')?.trim();
    const startDate = searchParams.get('startDate')?.trim();
    const endDate = searchParams.get('endDate')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (invoiceType && invoiceType !== 'ALL') {
      where.invoiceType = invoiceType;
    }

    const appTargetId = applicantId || candidateId;
    if (appTargetId && appTargetId !== 'ALL') {
      where.applicantId = appTargetId;
    }

    if (employerId && employerId !== 'ALL') {
      where.employerId = employerId;
    }

    if (jobId && jobId !== 'ALL') {
      where.jobId = jobId;
    }

    if (applicationId && applicationId !== 'ALL') {
      where.applicationId = applicationId;
    }

    if (processingCaseId && processingCaseId !== 'ALL') {
      where.processingCaseId = processingCaseId;
    }

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) where.issueDate.gte = new Date(startDate);
      if (endDate) where.issueDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
        { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
        { applicant: { passportNumber: { contains: search, mode: 'insensitive' } } },
        { employer: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [invoices, totalCount, aggregate] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          applicant: {
            select: {
              id: true,
              fullName: true,
              applicantNumber: true,
              passportNumber: true,
              phone: true,
              email: true,
            },
          },
          employer: {
            select: {
              id: true,
              companyName: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              country: true,
            },
          },
          items: true,
          payments: {
            where: { status: 'CONFIRMED' },
            select: { id: true, paymentNumber: true, amount: true, paymentDate: true },
          },
          _count: {
            select: { items: true, payments: true, receipts: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
      prisma.invoice.aggregate({
        where,
        _sum: {
          totalAmount: true,
          paidAmount: true,
          dueAmount: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalInvoiced: aggregate._sum.totalAmount || 0,
        totalPaid: aggregate._sum.paidAmount || 0,
        totalDue: aggregate._sum.dueAmount || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const validation = createInvoiceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const invoice = await createInvoice(prisma, {
      ...data,
      createdById: currentUser.id,
      candidateId: data.candidateId || data.applicantId || null,
      applicantId: data.applicantId || data.candidateId || null,
    });

    return NextResponse.json({
      success: true,
      data: invoice,
      message: `Invoice ${invoice.invoiceNumber} created successfully.`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
