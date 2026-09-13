import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const search = searchParams.get('search');
    const featuredOnly = searchParams.get('featured') === 'true';

    const where: any = {
      status: 'ACTIVE',
    };

    if (featuredOnly) {
      where.featured = true;
    }

    if (categorySlug) {
      where.category = {
        slug: categorySlug,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { banglaTitle: { contains: search, mode: 'insensitive' } },
        { courseCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [courses, categories] = await Promise.all([
      prisma.trainingCourse.findMany({
        where,
        include: {
          category: true,
          batches: {
            where: {
              status: { in: ['UPCOMING', 'ENROLLING'] },
            },
            include: {
              center: true,
            },
            orderBy: { startDate: 'asc' },
          },
        },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.trainingCategory.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        courses,
        categories,
      },
    });
  } catch (error: any) {
    console.error('Error fetching training courses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch training courses' },
      { status: 500 }
    );
  }
}
