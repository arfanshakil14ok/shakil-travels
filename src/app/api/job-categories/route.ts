import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { jobCategorySchema } from '@/lib/validations/category';
import { createAuditLog } from '@/lib/audit';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    const categories = await prisma.jobCategory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            jobs: { where: { status: 'PUBLISHED' } },
            preferredApplicants: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('Error fetching job categories:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('CATEGORY_CREATE');
    const body = await request.json();

    const parsed = jobCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const slug = data.slug || slugify(data.name);

    const category = await prisma.jobCategory.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        icon: data.icon || 'Briefcase',
        isActive: data.isActive,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'CATEGORY_CREATE',
      entity: 'JobCategory',
      entityId: category.id,
      newValue: { name: category.name },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating job category:', error);
    return NextResponse.json({ success: false, error: 'Failed to create job category' }, { status: 500 });
  }
}
