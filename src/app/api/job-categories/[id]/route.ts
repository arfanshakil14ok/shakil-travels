import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { jobCategorySchema } from '@/lib/validations/category';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.jobCategory.findFirst({
      where: {
        OR: [{ id }, { slug: id.toLowerCase() }],
      },
      include: {
        jobs: {
          where: { status: 'PUBLISHED' },
          include: {
            country: true,
            employer: { select: { companyName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { jobs: true, preferredApplicants: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    console.error('Error fetching job category:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch category' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('CATEGORY_EDIT');
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.jobCategory.findFirst({
      where: { OR: [{ id }, { slug: id.toLowerCase() }] },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    const parsed = jobCategorySchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updated = await prisma.jobCategory.update({
      where: { id: existing.id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        slug: data.slug !== undefined ? data.slug : undefined,
        description: data.description !== undefined ? data.description : undefined,
        icon: data.icon !== undefined ? data.icon : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'CATEGORY_UPDATE',
      entity: 'JobCategory',
      entityId: existing.id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('CATEGORY_DELETE');
    const { id } = await params;

    const existing = await prisma.jobCategory.findFirst({
      where: { OR: [{ id }, { slug: id.toLowerCase() }] },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    const jobsCount = await prisma.job.count({ where: { jobCategoryId: existing.id } });
    if (jobsCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category with associated job vacancies. Toggle active status instead.' },
        { status: 400 }
      );
    }

    await prisma.jobCategory.delete({ where: { id: existing.id } });

    await createAuditLog({
      userId: currentUser.id,
      action: 'CATEGORY_DELETE',
      entity: 'JobCategory',
      entityId: existing.id,
      oldValue: { name: existing.name },
    });

    return NextResponse.json({ success: true, message: 'Category removed' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 });
  }
}
