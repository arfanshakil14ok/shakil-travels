import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { countrySchema } from '@/lib/validations/country';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const country = await prisma.country.findFirst({
      where: {
        OR: [{ id }, { code: id.toUpperCase() }, { slug: id.toLowerCase() }],
      },
      include: {
        jobs: {
          where: { status: 'PUBLISHED' },
          include: {
            jobCategory: true,
            employer: { select: { companyName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { jobs: true, preferredApplicants: true },
        },
      },
    });

    if (!country) {
      return NextResponse.json({ success: false, error: 'Country not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: country });
  } catch (error: any) {
    console.error('Error fetching country:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch country' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('COUNTRY_EDIT');
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.country.findFirst({
      where: { OR: [{ id }, { code: id.toUpperCase() }, { slug: id.toLowerCase() }] },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Country not found' }, { status: 404 });
    }

    const parsed = countrySchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updated = await prisma.country.update({
      where: { id: existing.id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        code: data.code !== undefined ? data.code.toUpperCase() : undefined,
        flag: data.flag !== undefined ? data.flag : undefined,
        slug: data.slug !== undefined ? data.slug : undefined,
        continent: data.continent !== undefined ? data.continent : undefined,
        currency: data.currency !== undefined ? data.currency : undefined,
        currencyCode: data.currencyCode !== undefined ? data.currencyCode : undefined,
        timezone: data.timezone !== undefined ? data.timezone : undefined,
        recruitmentStatus: data.recruitmentStatus !== undefined ? data.recruitmentStatus : undefined,
        description: data.description !== undefined ? data.description : undefined,
        visaInformation: data.visaInformation !== undefined ? data.visaInformation : undefined,
        workerInformation: data.workerInformation !== undefined ? data.workerInformation : undefined,
        featured: data.featured !== undefined ? data.featured : undefined,
        displayOrder: data.displayOrder !== undefined ? data.displayOrder : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'COUNTRY_UPDATE',
      entity: 'Country',
      entityId: existing.id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating country:', error);
    return NextResponse.json({ success: false, error: 'Failed to update country' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('COUNTRY_DELETE');
    const { id } = await params;

    const existing = await prisma.country.findFirst({
      where: { OR: [{ id }, { code: id.toUpperCase() }, { slug: id.toLowerCase() }] },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Country not found' }, { status: 404 });
    }

    const jobsCount = await prisma.job.count({ where: { countryId: existing.id } });
    if (jobsCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete country with associated job vacancies. Toggle active status instead.' },
        { status: 400 }
      );
    }

    await prisma.country.delete({ where: { id: existing.id } });

    await createAuditLog({
      userId: currentUser.id,
      action: 'COUNTRY_DELETE',
      entity: 'Country',
      entityId: existing.id,
      oldValue: { name: existing.name },
    });

    return NextResponse.json({ success: true, message: 'Country removed' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting country:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete country' }, { status: 500 });
  }
}
