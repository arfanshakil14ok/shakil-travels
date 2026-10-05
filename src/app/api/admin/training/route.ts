import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const categoryId = searchParams.get('categoryId') || '';

    // Calculate real dashboard KPI metrics
    const [
      totalCourses,
      activeCourses,
      totalCenters,
      totalTrainers,
      totalBatches,
      activeBatches,
      totalEnrollments,
      completedEnrollments,
      categories,
    ] = await Promise.all([
      prisma.trainingCourse.count(),
      prisma.trainingCourse.count({ where: { status: 'ACTIVE' } }),
      prisma.trainingCenter.count(),
      prisma.trainingInstructor.count(),
      prisma.trainingBatch.count(),
      prisma.trainingBatch.count({ where: { status: { in: ['UPCOMING', 'ENROLLING', 'ONGOING'] } } }),
      prisma.trainingEnrollment.count(),
      prisma.trainingEnrollment.count({ where: { status: 'COMPLETED' } }),
      prisma.trainingCategory.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
    ]);

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { banglaTitle: { contains: search, mode: 'insensitive' } },
        { courseCode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    const courses = await prisma.trainingCourse.findMany({
      where,
      include: {
        category: true,
        batches: {
          include: {
            center: true,
            instructor: true,
            _count: { select: { enrollments: true } },
          },
        },
        _count: {
          select: {
            batches: true,
            certificates: true,
            applications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalCourses,
          activeCourses,
          totalCenters,
          totalTrainers,
          totalBatches,
          activeBatches,
          totalEnrollments,
          completedEnrollments,
        },
        courses,
        categories,
      },
    });
  } catch (error: any) {
    console.error('Error fetching training data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch training data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      banglaTitle,
      categoryId,
      description,
      durationWeeks,
      hoursTotal,
      fee,
      currency = 'BDT',
      certificationType = 'BMET_AFFILIATED',
      status = 'ACTIVE',
      eligibility,
      requiredDocuments,
      featured = false,
    } = body;

    if (!title || !banglaTitle || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Title, Bangla Title, and Category are required.' },
        { status: 400 }
      );
    }

    // Auto-generate unique courseCode and slug if not provided
    const count = await prisma.trainingCourse.count();
    const courseCode = body.courseCode || `TC-CR-${String(count + 1).padStart(3, '0')}`;
    const slug =
      body.slug ||
      `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const course = await prisma.trainingCourse.create({
      data: {
        courseCode,
        title,
        banglaTitle,
        slug,
        categoryId,
        description: description || '',
        durationWeeks: parseInt(String(durationWeeks || 4), 10),
        hoursTotal: parseInt(String(hoursTotal || 120), 10),
        fee: parseFloat(String(fee || 0)),
        currency,
        certificationType,
        status,
        eligibility: eligibility || null,
        requiredDocuments: requiredDocuments || null,
        featured: !!featured,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Training course created successfully.',
      data: course,
    });
  } catch (error: any) {
    console.error('Error creating training course:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create training course' },
      { status: 500 }
    );
  }
}
