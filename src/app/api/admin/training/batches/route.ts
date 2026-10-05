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
    const courseId = searchParams.get('courseId');

    const batches = await prisma.trainingBatch.findMany({
      where: courseId ? { courseId } : {},
      include: {
        course: true,
        center: true,
        instructor: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: batches });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch batches' },
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
      courseId,
      centerId,
      instructorId,
      startDate,
      endDate,
      classSchedule,
      capacity = 30,
      status = 'UPCOMING',
    } = body;

    if (!courseId || !centerId || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Course, Center, Start Date, and End Date are required.' },
        { status: 400 }
      );
    }

    const count = await prisma.trainingBatch.count();
    const batchCode = body.batchCode || `BATCH-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const batch = await prisma.trainingBatch.create({
      data: {
        batchCode,
        courseId,
        centerId,
        instructorId: instructorId || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        classSchedule: classSchedule || null,
        capacity: parseInt(String(capacity), 10),
        status,
      },
      include: {
        course: true,
        center: true,
        instructor: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Training batch created successfully.',
      data: batch,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create training batch' },
      { status: 500 }
    );
  }
}
