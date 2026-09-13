import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district');

    const where: any = {
      isActive: true,
      operatingStatus: 'ACTIVE',
    };

    if (district) {
      where.district = {
        equals: district,
        mode: 'insensitive',
      };
    }

    const centers = await prisma.trainingCenter.findMany({
      where,
      include: {
        batches: {
          where: {
            status: { in: ['UPCOMING', 'ENROLLING'] },
          },
          include: {
            course: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: centers,
    });
  } catch (error: any) {
    console.error('Error fetching training centers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch training centers' },
      { status: 500 }
    );
  }
}
