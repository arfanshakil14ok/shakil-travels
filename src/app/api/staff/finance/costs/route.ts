import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { recruitmentCostSchema } from '@/lib/validations/finance';
import { recordRecruitmentCost } from '@/lib/finance/profitability';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category')?.trim();
    const applicantId = searchParams.get('applicantId')?.trim();
    const candidateId = searchParams.get('candidateId')?.trim();
    const jobId = searchParams.get('jobId')?.trim();
    const employerId = searchParams.get('employerId')?.trim();
    const applicationId = searchParams.get('applicationId')?.trim();
    const processingCaseId = searchParams.get('processingCaseId')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }

    const appTargetId = applicantId || candidateId;
    if (appTargetId && appTargetId !== 'ALL') {
      where.applicantId = appTargetId;
    }

    if (jobId && jobId !== 'ALL') {
      where.jobId = jobId;
    }

    if (employerId && employerId !== 'ALL') {
      where.employerId = employerId;
    }

    if (applicationId && applicationId !== 'ALL') {
      where.applicationId = applicationId;
    }

    if (processingCaseId && processingCaseId !== 'ALL') {
      where.processingCaseId = processingCaseId;
    }

    const [costs, totalCount, aggregate] = await Promise.all([
      (prisma as any).recruitmentCost.findMany({
        where,
        include: {
          applicant: {
            select: { id: true, fullName: true, applicantNumber: true, passportNumber: true },
          },
          job: {
            select: { id: true, title: true, country: true },
          },
          employer: {
            select: { id: true, companyName: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { costDate: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).recruitmentCost.count({ where }),
      (prisma as any).recruitmentCost.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: costs,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalCostsAmount: aggregate._sum.amount || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching recruitment costs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const validation = recruitmentCostSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const cost = await recordRecruitmentCost(prisma, {
      ...data,
      createdById: currentUser.id,
      applicantId: data.applicantId || data.candidateId,
    });

    return NextResponse.json({
      success: true,
      data: cost,
      message: `Recruitment cost ${cost.costNumber} recorded successfully.`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording recruitment cost:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record cost' },
      { status: 500 }
    );
  }
}
