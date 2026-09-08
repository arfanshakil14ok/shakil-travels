import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { employerSchema } from '@/lib/validations/employer';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('EMPLOYER_VIEW');
    const { id } = await params;

    const employer = await prisma.employer.findUnique({
      where: { id },
      include: {
        country: true,
        jobs: {
          orderBy: { createdAt: 'desc' },
          include: {
            jobCategory: true,
            _count: { select: { applications: true } },
          },
        },
        customer: true,
      },
    });

    if (!employer) {
      return NextResponse.json({ success: false, error: 'Employer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: employer });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching employer:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch employer' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('EMPLOYER_EDIT');
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.employer.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Employer not found' }, { status: 404 });
    }

    const parsed = employerSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      const emp = await tx.employer.update({
        where: { id },
        data: {
          companyName: data.companyName !== undefined ? data.companyName : undefined,
          countryId: data.countryId !== undefined ? data.countryId : undefined,
          industry: data.industry !== undefined ? data.industry : undefined,
          contactPerson: data.contactPerson !== undefined ? data.contactPerson : undefined,
          email: data.email !== undefined ? data.email : undefined,
          phone: data.phone !== undefined ? data.phone : undefined,
          address: data.address !== undefined ? data.address : undefined,
          website: data.website !== undefined ? data.website : undefined,
          verificationStatus: data.verificationStatus !== undefined ? data.verificationStatus : undefined,
          notes: data.notes !== undefined ? data.notes : undefined,
        },
        include: { country: true },
      });

      if (existing.customer && (data.companyName || data.phone || data.email)) {
        await tx.customer.update({
          where: { id: existing.customer.id },
          data: {
            name: data.companyName || existing.customer.name,
            phone: data.phone || existing.customer.phone,
            email: data.email !== undefined ? data.email : existing.customer.email,
          },
        });
      }

      return emp;
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'EMPLOYER_UPDATE',
      entity: 'Employer',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating employer:', error);
    return NextResponse.json({ success: false, error: 'Failed to update employer' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('EMPLOYER_DELETE');
    const { id } = await params;

    const existing = await prisma.employer.findUnique({
      where: { id },
      include: { jobs: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Employer not found' }, { status: 404 });
    }

    if (existing.jobs.length > 0) {
      const updated = await prisma.employer.update({
        where: { id },
        data: { verificationStatus: 'INACTIVE' },
      });
      await createAuditLog({
        userId: currentUser.id,
        action: 'EMPLOYER_DEACTIVATE',
        entity: 'Employer',
        entityId: id,
      });
      return NextResponse.json({
        success: true,
        message: 'Employer has existing job demands. Verification set to INACTIVE.',
        data: updated,
      });
    }

    await prisma.$transaction([
      prisma.customer.deleteMany({ where: { employerId: id } }),
      prisma.employer.delete({ where: { id } }),
    ]);

    await createAuditLog({
      userId: currentUser.id,
      action: 'EMPLOYER_DELETE',
      entity: 'Employer',
      entityId: id,
      oldValue: { id, companyName: existing.companyName },
    });

    return NextResponse.json({ success: true, message: 'Employer deleted successfully' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting employer:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete employer' }, { status: 500 });
  }
}
