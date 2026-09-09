import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const post = await prisma.blogPost.findFirst({
      where: {
        OR: [{ id }, { slug: id.toLowerCase() }],
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: post });
  } catch (error: any) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('MIGRANT_INFO_EDIT');
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.blogPost.findFirst({
      where: { OR: [{ id }, { slug: id.toLowerCase() }] },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    const { title, slug, excerpt, content, coverImage, isPublished } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (slug !== undefined) updateData.slug = slugify(slug);
    if (excerpt !== undefined) updateData.excerpt = excerpt ? excerpt.trim() : null;
    if (content !== undefined) updateData.content = content.trim();
    if (coverImage !== undefined) updateData.coverImage = coverImage ? coverImage.trim() : null;

    if (isPublished !== undefined) {
      updateData.isPublished = Boolean(isPublished);
      if (isPublished && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const updated = await prisma.blogPost.update({
      where: { id: existing.id },
      data: updateData,
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'BLOG_EDIT',
      entity: 'BlogPost',
      entityId: existing.id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('MIGRANT_INFO_DELETE');
    const { id } = await params;

    const existing = await prisma.blogPost.findFirst({
      where: { OR: [{ id }, { slug: id.toLowerCase() }] },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    await prisma.blogPost.delete({ where: { id: existing.id } });

    await createAuditLog({
      userId: currentUser.id,
      action: 'BLOG_DELETE',
      entity: 'BlogPost',
      entityId: existing.id,
      oldValue: { title: existing.title },
    });

    return NextResponse.json({ success: true, message: 'Article deleted successfully' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
