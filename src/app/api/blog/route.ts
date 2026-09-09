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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'PUBLISHED') {
      where.isPublished = true;
    } else if (status === 'DRAFT') {
      where.isPublished = false;
    }

    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: posts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('MIGRANT_INFO_CREATE');
    const body = await request.json();

    const { title, excerpt, content, coverImage, isPublished } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    let slug = body.slug ? slugify(body.slug) : slugify(title);
    if (!slug) slug = `post-${Date.now()}`;

    // Ensure unique slug
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const post = await prisma.blogPost.create({
      data: {
        title: title.trim(),
        slug,
        excerpt: excerpt?.trim() || null,
        content: content.trim(),
        coverImage: coverImage?.trim() || null,
        isPublished: Boolean(isPublished),
        publishedAt: isPublished ? new Date() : null,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'BLOG_CREATE',
      entity: 'BlogPost',
      entityId: post.id,
      newValue: { title: post.title, slug: post.slug },
    });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
