import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { applicantSchema } from '@/lib/validations/applicant';
import { getMatchingJobsForApplicant } from '@/lib/matching';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('APPLICANT_VIEW');
    const { id } = await params;

    const applicant = await prisma.applicant.findFirst({
      where: {
        OR: [{ id }, { applicantNumber: id }],
      },
      include: {
        preferredCountry: true,
        preferredJobCategory: true,
        assignedStaff: { select: { id: true, name: true, email: true, role: true } },
        customer: true,
        profile: true,
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        applications: {
          orderBy: { createdAt: 'desc' },
          include: {
            job: {
              include: {
                country: true,
                jobCategory: true,
                employer: true,
              },
            },
          },
        },
      },
    });

    if (!applicant) {
      return NextResponse.json({ success: false, error: 'Applicant not found' }, { status: 404 });
    }

    // Calculate top matching jobs using rule-based engine
    const matchingJobs = await getMatchingJobsForApplicant(prisma, applicant.id, 6);

    return NextResponse.json({
      success: true,
      data: {
        ...applicant,
        matchingJobs,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error retrieving applicant:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve applicant' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('APPLICANT_EDIT');
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.applicant.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Applicant not found' }, { status: 404 });
    }

    const parsed = applicantSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check phone conflict if phone is changed
    if (data.phone && data.phone !== existing.phone) {
      const phoneTaken = await prisma.applicant.findFirst({
        where: { phone: data.phone, id: { not: id } },
      });
      if (phoneTaken) {
        return NextResponse.json(
          { success: false, error: 'Phone number already registered to another applicant' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.applicant.update({
        where: { id },
        data: {
          fullName: data.fullName !== undefined ? data.fullName : undefined,
          fatherName: data.fatherName !== undefined ? data.fatherName : undefined,
          motherName: data.motherName !== undefined ? data.motherName : undefined,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          gender: data.gender !== undefined ? data.gender : undefined,
          nationality: data.nationality !== undefined ? data.nationality : undefined,
          phone: data.phone !== undefined ? data.phone : undefined,
          email: data.email !== undefined ? data.email : undefined,
          district: data.district !== undefined ? data.district : undefined,
          upazila: data.upazila !== undefined ? data.upazila : undefined,
          address: data.address !== undefined ? data.address : undefined,
          education: data.education !== undefined ? data.education : undefined,
          profession: data.profession !== undefined ? data.profession : undefined,
          yearsOfExperience: data.yearsOfExperience !== undefined ? data.yearsOfExperience : undefined,
          skills: data.skills !== undefined ? data.skills : undefined,
          languages: data.languages !== undefined ? data.languages : undefined,
          passportAvailable: data.passportAvailable !== undefined ? data.passportAvailable : undefined,
          passportNumber: data.passportNumber !== undefined ? data.passportNumber : undefined,
          passportExpiry: data.passportExpiry ? new Date(data.passportExpiry) : undefined,
          preferredCountryId: data.preferredCountryId !== undefined ? data.preferredCountryId : undefined,
          preferredJobCategoryId: data.preferredJobCategoryId !== undefined ? data.preferredJobCategoryId : undefined,
          status: data.status !== undefined ? data.status : undefined,
          source: data.source !== undefined ? data.source : undefined,
          assignedStaffId: data.assignedStaffId !== undefined ? data.assignedStaffId : undefined,
          profilePhoto: data.profilePhoto !== undefined ? data.profilePhoto : undefined,
        },
        include: {
          preferredCountry: true,
          preferredJobCategory: true,
          assignedStaff: { select: { id: true, name: true, email: true } },
          customer: true,
        },
      });

      // Update linked CRM customer
      if (existing.customer && (data.fullName || data.phone || data.email)) {
        await tx.customer.update({
          where: { id: existing.customer.id },
          data: {
            name: data.fullName || existing.customer.name,
            phone: data.phone || existing.customer.phone,
            email: data.email !== undefined ? data.email : existing.customer.email,
          },
        });
      }

      return app;
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'APPLICANT_UPDATE',
      entity: 'Applicant',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating applicant:', error);
    return NextResponse.json({ success: false, error: 'Failed to update applicant' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('APPLICANT_DELETE');
    const { id } = await params;

    const existing = await prisma.applicant.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Applicant not found' }, { status: 404 });
    }

    // Set to INACTIVE or delete if no applications
    const hasApplications = await prisma.application.count({
      where: { applicantId: id },
    });

    if (hasApplications > 0) {
      const updated = await prisma.applicant.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      await createAuditLog({
        userId: currentUser.id,
        action: 'APPLICANT_DEACTIVATE',
        entity: 'Applicant',
        entityId: id,
      });
      return NextResponse.json({
        success: true,
        message: 'Applicant has active applications. Status set to INACTIVE.',
        data: updated,
      });
    }

    await prisma.$transaction([
      prisma.customer.deleteMany({ where: { applicantId: id } }),
      prisma.applicantNote.deleteMany({ where: { applicantId: id } }),
      prisma.applicantProfile.deleteMany({ where: { applicantId: id } }),
      prisma.applicant.delete({ where: { id } }),
    ]);

    await createAuditLog({
      userId: currentUser.id,
      action: 'APPLICANT_DELETE',
      entity: 'Applicant',
      entityId: id,
      oldValue: { id, fullName: existing.fullName, applicantNumber: existing.applicantNumber },
    });

    return NextResponse.json({ success: true, message: 'Applicant deleted successfully' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting applicant:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete applicant' }, { status: 500 });
  }
}
