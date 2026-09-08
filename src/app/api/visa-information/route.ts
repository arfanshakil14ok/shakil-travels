import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { visaInformationSchema } from '@/lib/validations/visa';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const countryId = searchParams.get('countryId');
    const visaType = searchParams.get('visaType');
    const search = searchParams.get('search');
    const onlyActive = searchParams.get('active') !== 'false';

    const where: any = {};
    if (onlyActive) {
      where.isActive = true;
    }
    if (countryId && countryId !== 'ALL') {
      where.countryId = countryId;
    }
    if (visaType && visaType !== 'ALL') {
      where.visaType = visaType;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { overview: { contains: search, mode: 'insensitive' } },
        { country: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const items = await prisma.visaInformation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        country: {
          select: { id: true, name: true, code: true, flag: true, slug: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error('Error fetching visa information:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch visa information' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('VISA_INFO_MANAGE');
    const body = await request.json();

    const parsed = visaInformationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const slug = data.slug || `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const created = await prisma.visaInformation.create({
      data: {
        countryId: data.countryId,
        visaType: data.visaType,
        title: data.title,
        slug,
        overview: data.overview || null,
        eligibility: data.eligibility || null,
        requiredDocuments: data.requiredDocuments || null,
        applicationProcess: data.applicationProcess || null,
        processingInformation: data.processingInformation || null,
        feesInformation: data.feesInformation || null,
        validityInformation: data.validityInformation || null,
        workRights: data.workRights || null,
        restrictions: data.restrictions || null,
        officialSourceName: data.officialSourceName || null,
        officialSourceUrl: data.officialSourceUrl || null,
        lastVerifiedAt: new Date(),
        isActive: data.isActive,
        createdById: currentUser.id,
      },
      include: {
        country: { select: { id: true, name: true, code: true } },
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'VISA_INFO_CREATE',
      entity: 'VISA_INFORMATION',
      entityId: created.id,
      newValue: { title: created.title, countryId: created.countryId },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating visa information:', error);
    return NextResponse.json({ success: false, error: 'Failed to create visa information' }, { status: 500 });
  }
}
