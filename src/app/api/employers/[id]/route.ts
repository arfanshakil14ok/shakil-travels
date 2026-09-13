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

    const employer = await prisma.employer.findFirst({
      where: {
        OR: [{ id }, { employerCode: id }],
      },
      include: {
        country: true,
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
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

    // Compute summary metrics
    const totalJobs = employer.jobs.length;
    const activeJobs = employer.jobs.filter((j) => j.status === 'PUBLISHED').length;
    const totalVacancies = employer.jobs.reduce((sum, j) => sum + (j.vacancyCount || 0), 0);
    const filledVacancies = employer.jobs.reduce((sum, j) => sum + (j.filledCount || 0), 0);
    const remainingVacancies = Math.max(0, totalVacancies - filledVacancies);
    const totalApplications = employer.jobs.reduce((sum, j) => sum + (j._count?.applications || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        ...employer,
        metrics: {
          totalJobs,
          activeJobs,
          totalVacancies,
          filledVacancies,
          remainingVacancies,
          totalApplications,
        },
      },
    });
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

    const existing = await prisma.employer.findFirst({
      where: { OR: [{ id }, { employerCode: id }] },
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
        where: { id: existing.id },
        data: {
          companyName: data.companyName !== undefined ? data.companyName : undefined,
          companyNameLocal: data.companyNameLocal !== undefined ? data.companyNameLocal : undefined,
          countryId: data.countryId !== undefined ? data.countryId : undefined,
          city: data.city !== undefined ? data.city : undefined,
          industry: data.industry !== undefined ? data.industry : undefined,
          contactPerson: data.contactPerson !== undefined ? data.contactPerson : undefined,
          email: data.email !== undefined ? data.email : undefined,
          phone: data.phone !== undefined ? data.phone : undefined,
          address: data.address !== undefined ? data.address : undefined,
          website: data.website !== undefined ? data.website : undefined,
          verificationStatus: data.verificationStatus !== undefined ? data.verificationStatus : undefined,
          status: data.status !== undefined ? data.status : undefined,
          notes: data.notes !== undefined ? data.notes : undefined,
        },
        include: {
          country: true,
          contacts: true,
          documents: true,
        },
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
      entityId: existing.id,
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

    const existing = await prisma.employer.findFirst({
      where: { OR: [{ id }, { employerCode: id }] },
      include: { jobs: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Employer not found' }, { status: 404 });
    }

    if (existing.jobs.length > 0) {
      const updated = await prisma.employer.update({
        where: { id: existing.id },
        data: {
          verificationStatus: 'INACTIVE',
          status: 'INACTIVE',
        },
      });
      await createAuditLog({
        userId: currentUser.id,
        action: 'EMPLOYER_DEACTIVATE',
        entity: 'Employer',
        entityId: existing.id,
      });
      return NextResponse.json({
        success: true,
        message: 'Employer has existing job demands. Status set to INACTIVE.',
        data: updated,
      });
    }

    await prisma.$transaction([
      prisma.employerContact.deleteMany({ where: { employerId: existing.id } }),
      prisma.employerDocument.deleteMany({ where: { employerId: existing.id } }),
      prisma.customer.deleteMany({ where: { employerId: existing.id } }),
      prisma.employer.delete({ where: { id: existing.id } }),
    ]);

    await createAuditLog({
      userId: currentUser.id,
      action: 'EMPLOYER_DELETE',
      entity: 'Employer',
      entityId: existing.id,
      oldValue: { id: existing.id, companyName: existing.companyName },
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
