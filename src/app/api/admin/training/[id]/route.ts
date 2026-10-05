import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const course = await prisma.trainingCourse.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        batches: {
          include: {
            center: true,
            instructor: true,
            enrollments: {
              include: {
                applicant: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: course });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updated = await prisma.trainingCourse.update({
      where: { id: params.id },
      data: {
        title: body.title,
        banglaTitle: body.banglaTitle,
        categoryId: body.categoryId,
        description: body.description,
        durationWeeks: body.durationWeeks ? parseInt(String(body.durationWeeks), 10) : undefined,
        hoursTotal: body.hoursTotal ? parseInt(String(body.hoursTotal), 10) : undefined,
        fee: body.fee !== undefined ? parseFloat(String(body.fee)) : undefined,
        currency: body.currency,
        certificationType: body.certificationType,
        status: body.status,
        eligibility: body.eligibility,
        requiredDocuments: body.requiredDocuments,
        featured: body.featured !== undefined ? !!body.featured : undefined,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete: mark course as ARCHIVED
    await prisma.trainingCourse.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Course archived successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete course' },
      { status: 500 }
    );
  }
}
