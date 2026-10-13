import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, requireAuth, hasPermission, AuthorizationError } from '@/lib/rbac';
import { countrySchema } from '@/lib/validations/country';
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

    const countries = await prisma.country.findMany({
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

    return NextResponse.json({ success: true, data: countries });
  } catch (error: any) {
    console.error('Error fetching countries:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch countries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    if (!hasPermission(currentUser, 'COUNTRY_CREATE') && !hasPermission(currentUser, 'JOB_CREATE')) {
      throw new AuthorizationError('Access denied: requires COUNTRY_CREATE or JOB_CREATE permission');
    }
    const body = await request.json();

    const parsed = countrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const code = data.code.toUpperCase();

    // Check duplicate
    const existing = await prisma.country.findFirst({
      where: {
        OR: [
          { code },
          { name: { equals: data.name, mode: 'insensitive' } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Country "${data.name}" (${code}) already exists in the system.`,
        },
        { status: 409 }
      );
    }

    const slug = data.slug || slugify(data.name);
    const flag = data.flag?.trim() || `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

    const country = await prisma.country.create({
      data: {
        name: data.name,
        code,
        flag,
        slug,
        continent: data.continent || null,
        currency: data.currency || null,
        currencyCode: data.currencyCode ? data.currencyCode.toUpperCase() : null,
        timezone: data.timezone || null,
        recruitmentStatus: data.recruitmentStatus || 'ACTIVE',
        description: data.description || null,
        visaInformation: data.visaInformation || null,
        workerInformation: data.workerInformation || null,
        featured: data.featured || false,
        displayOrder: data.displayOrder || 0,
        isActive: data.isActive,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'COUNTRY_CREATE',
      entity: 'Country',
      entityId: country.id,
      newValue: { name: country.name, code: country.code },
    });

    return NextResponse.json({ success: true, data: country }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating country:', error);
    return NextResponse.json({ success: false, error: 'Failed to create country' }, { status: 500 });
  }
}
