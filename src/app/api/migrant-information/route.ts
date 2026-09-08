import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { migrantInformationSchema } from '@/lib/validations/migrant';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const countryId = searchParams.get('countryId');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const where: any = {};
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (countryId && countryId !== 'ALL') {
      where.countryId = countryId;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    } else {
      where.status = 'PUBLISHED';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.migrantInformation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        countryRef: {
          select: { id: true, name: true, code: true, flag: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error('Error fetching migrant information:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch migrant information' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('MIGRANT_INFO_CREATE');
    const body = await request.json();

    const parsed = migrantInformationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const slug = data.slug || `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const created = await prisma.migrantInformation.create({
      data: {
        title: data.title,
        slug,
        category: data.category,
        summary: data.summary || null,
        content: data.content,
        featuredImage: data.featuredImage || null,
        countryId: data.countryId || null,
        officialSource: data.officialSource || null,
        officialSourceUrl: data.officialSourceUrl || null,
        status: data.status,
        isPublished: data.isPublished,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
        lastVerifiedAt: new Date(),
        createdById: currentUser.id,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'MIGRANT_INFO_CREATE',
      entity: 'MIGRANT_INFORMATION',
      entityId: created.id,
      newValue: { title: created.title, category: created.category },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating migrant information:', error);
    return NextResponse.json({ success: false, error: 'Failed to create migrant information' }, { status: 500 });
  }
}
