import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const trainers = await prisma.trainingInstructor.findMany({
      include: {
        center: true,
        _count: {
          select: {
            batches: true,
            assessments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: trainers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch trainers' },
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
    const { name, phone, email, specialization, certification, bio, centerId, isActive = true } = body;

    if (!name || !phone || !specialization) {
      return NextResponse.json(
        { success: false, error: 'Name, Phone, and Specialization are required.' },
        { status: 400 }
      );
    }

    const trainer = await prisma.trainingInstructor.create({
      data: {
        name,
        phone,
        email: email || null,
        specialization,
        certification: certification || null,
        bio: bio || null,
        centerId: centerId || null,
        isActive: !!isActive,
      },
      include: {
        center: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Trainer created successfully.',
      data: trainer,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create trainer' },
      { status: 500 }
    );
  }
}
