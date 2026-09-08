import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateApplicantNumber } from '@/lib/id-generator';
import { hashApplicantPassword, createPortalToken, setPortalCookie, calculateProfileCompletion } from '@/lib/portal-auth';
import { z } from 'zod';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(6, 'Valid phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Valid email is required').optional().nullable().or(z.literal('')),
  district: z.string().optional().nullable(),
  preferredCountryId: z.string().optional().nullable(),
  preferredJobCategoryId: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const phone = data.phone.trim();
    const email = data.email ? data.email.trim().toLowerCase() : null;

    // Check if an applicant exists with this phone or email
    let existingApplicant = await prisma.applicant.findFirst({
      where: {
        OR: [
          { phone },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existingApplicant && existingApplicant.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'An account with this phone or email already exists. Please log in.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashApplicantPassword(data.password);
    let applicant;

    if (existingApplicant) {
      // Applicant was entered previously by staff or inquiry, now setting up their portal access
      applicant = await prisma.applicant.update({
        where: { id: existingApplicant.id },
        data: {
          fullName: data.fullName,
          passwordHash,
          isActive: true,
          email: email || existingApplicant.email,
          district: data.district || existingApplicant.district,
          preferredCountryId: data.preferredCountryId || existingApplicant.preferredCountryId,
          preferredJobCategoryId: data.preferredJobCategoryId || existingApplicant.preferredJobCategoryId,
        },
      });
    } else {
      // New candidate registration
      const applicantNumber = await generateApplicantNumber(prisma);
      applicant = await prisma.applicant.create({
        data: {
          applicantNumber,
          fullName: data.fullName,
          phone,
          email,
          passwordHash,
          isActive: true,
          source: 'PORTAL_REGISTRATION',
          status: 'NEW',
          district: data.district || null,
          preferredCountryId: data.preferredCountryId || null,
          preferredJobCategoryId: data.preferredJobCategoryId || null,
        },
      });

      // Ensure Customer record exists for accounting integration
      await prisma.customer.create({
        data: {
          customerType: 'APPLICANT',
          name: applicant.fullName,
          phone: applicant.phone,
          email: applicant.email,
          applicantId: applicant.id,
        },
      });
    }

    // Generate JWT token and set HTTP-only cookie
    const token = await createPortalToken({
      applicantId: applicant.id,
      applicantNumber: applicant.applicantNumber,
      phone: applicant.phone,
      email: applicant.email,
      fullName: applicant.fullName,
    });

    await setPortalCookie(token);

    const completion = calculateProfileCompletion(applicant);

    return NextResponse.json({
      success: true,
      message: 'Account registered successfully',
      data: {
        applicant: {
          id: applicant.id,
          applicantNumber: applicant.applicantNumber,
          fullName: applicant.fullName,
          phone: applicant.phone,
          email: applicant.email,
          profileCompletion: completion.percentage,
        },
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Portal registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again later.' },
      { status: 500 }
    );
  }
}
