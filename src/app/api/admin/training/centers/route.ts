import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const centers = await prisma.trainingCenter.findMany({
      include: {
        _count: {
          select: {
            batches: true,
            instructors: true,
            certificates: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: centers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch training centers' },
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
      name,
      banglaName,
      district,
      division = 'Dhaka',
      address,
      contactPerson,
      contactPhone,
      email,
      capacity = 50,
      facilities,
      operatingStatus = 'ACTIVE',
    } = body;

    if (!name || !banglaName || !district || !address || !contactPhone) {
      return NextResponse.json(
        { success: false, error: 'Name, Bangla Name, District, Address, and Phone are required.' },
        { status: 400 }
      );
    }

    const count = await prisma.trainingCenter.count();
    const code = body.code || `TC-${district.slice(0, 3).toUpperCase()}-${String(count + 1).padStart(3, '0')}`;

    const center = await prisma.trainingCenter.create({
      data: {
        name,
        banglaName,
        code,
        district,
        division,
        address,
        contactPerson: contactPerson || null,
        contactPhone,
        email: email || null,
        capacity: parseInt(String(capacity), 10),
        facilities: facilities || null,
        operatingStatus,
        isActive: operatingStatus === 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Training center created successfully.',
      data: center,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create training center' },
      { status: 500 }
    );
  }
}
