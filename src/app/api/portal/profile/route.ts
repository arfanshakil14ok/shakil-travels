import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth, calculateProfileCompletion } from '@/lib/portal-auth';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  fatherName: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  upazila: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  yearsOfExperience: z.number().int().min(0).optional(),
  skills: z.string().optional().nullable(),
  languages: z.string().optional().nullable(),
  passportAvailable: z.boolean().optional(),
  passportNumber: z.string().optional().nullable(),
  passportExpiry: z.string().optional().nullable(),
  preferredCountryId: z.string().optional().nullable(),
  preferredJobCategoryId: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const applicant = await requireApplicantAuth();

    const fullApplicant = await prisma.applicant.findUnique({
      where: { id: applicant.id },
      include: {
        profile: true,
        preferredCountry: { select: { id: true, name: true, code: true, flag: true } },
        preferredJobCategory: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!fullApplicant) {
      return NextResponse.json({ success: false, error: 'Applicant not found' }, { status: 404 });
    }

    const completion = calculateProfileCompletion(fullApplicant);

    return NextResponse.json({
      success: true,
      data: {
        ...fullApplicant,
        preferredCountry: fullApplicant.preferredCountry
          ? {
              ...fullApplicant.preferredCountry,
              flagEmoji: fullApplicant.preferredCountry.flag,
            }
          : null,
        completion,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const applicant = await requireApplicantAuth();
    const body = await request.json();

    // Security: strictly block any attempt to modify protected system fields
    const protectedFields = ['id', 'applicantNumber', 'status', 'assignedStaffId', 'isActive', 'notes', 'createdAt', 'updatedAt'];
    for (const field of protectedFields) {
      if (field in body) {
        delete body[field];
      }
    }

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    // Fetch existing applicant data for audit diff
    const current = await prisma.applicant.findUnique({
      where: { id: applicant.id },
      include: { profile: true },
    });

    const updated = await prisma.applicant.update({
      where: { id: applicant.id },
      data: {
        ...(d.fullName && { fullName: d.fullName }),
        fatherName: d.fatherName !== undefined ? d.fatherName : undefined,
        motherName: d.motherName !== undefined ? d.motherName : undefined,
        dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : undefined,
        gender: d.gender !== undefined ? d.gender : undefined,
        nationality: d.nationality || undefined,
        district: d.district !== undefined ? d.district : undefined,
        upazila: d.upazila !== undefined ? d.upazila : undefined,
        address: d.address !== undefined ? d.address : undefined,
        education: d.education !== undefined ? d.education : undefined,
        profession: d.profession !== undefined ? d.profession : undefined,
        yearsOfExperience: d.yearsOfExperience !== undefined ? d.yearsOfExperience : undefined,
        skills: d.skills !== undefined ? d.skills : undefined,
        languages: d.languages !== undefined ? d.languages : undefined,
        passportAvailable: d.passportAvailable !== undefined ? d.passportAvailable : undefined,
        passportNumber: d.passportNumber !== undefined ? d.passportNumber : undefined,
        passportExpiry: d.passportExpiry ? new Date(d.passportExpiry) : undefined,
        preferredCountryId: d.preferredCountryId !== undefined ? d.preferredCountryId : undefined,
        preferredJobCategoryId: d.preferredJobCategoryId !== undefined ? d.preferredJobCategoryId : undefined,
      },
      include: {
        profile: true,
        preferredCountry: { select: { id: true, name: true, code: true, flag: true } },
        preferredJobCategory: { select: { id: true, name: true, slug: true } },
      },
    });

    // Upsert linked ApplicantProfile for address & emergency contact details
    if (d.emergencyContact !== undefined || d.permanentAddress !== undefined || d.address !== undefined || d.skills !== undefined || d.education !== undefined || d.yearsOfExperience !== undefined) {
      await prisma.applicantProfile.upsert({
        where: { applicantId: applicant.id },
        create: {
          applicantId: applicant.id,
          skills: d.skills || null,
          experienceYears: d.yearsOfExperience || 0,
          education: d.education || null,
          currentAddress: d.address || null,
          permanentAddress: d.permanentAddress || null,
          emergencyContact: d.emergencyContact || null,
        },
        update: {
          ...(d.skills !== undefined && { skills: d.skills }),
          ...(d.yearsOfExperience !== undefined && { experienceYears: d.yearsOfExperience }),
          ...(d.education !== undefined && { education: d.education }),
          ...(d.address !== undefined && { currentAddress: d.address }),
          ...(d.permanentAddress !== undefined && { permanentAddress: d.permanentAddress }),
          ...(d.emergencyContact !== undefined && { emergencyContact: d.emergencyContact }),
        },
      });
    }

    // Record PROFILE_UPDATED audit log
    await createAuditLog({
      actorUserId: applicant.id,
      actorType: 'APPLICANT',
      applicantId: applicant.id,
      action: 'PROFILE_UPDATED',
      entity: 'APPLICANT',
      entityId: applicant.id,
      description: `Applicant updated profile details`,
      oldValue: {
        fullName: current?.fullName,
        profession: current?.profession,
        passportNumber: current?.passportNumber,
        district: current?.district,
      },
      newValue: {
        fullName: updated.fullName,
        profession: updated.profession,
        passportNumber: updated.passportNumber,
        district: updated.district,
      },
    });

    const completion = calculateProfileCompletion(updated);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...updated,
        preferredCountry: updated.preferredCountry
          ? {
              ...updated.preferredCountry,
              flagEmoji: updated.preferredCountry.flag,
            }
          : null,
        completion,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update profile' }, { status: 400 });
  }
}
