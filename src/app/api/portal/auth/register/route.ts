import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateApplicantNumber } from '@/lib/id-generator';
import {
  hashApplicantPassword,
  createPortalToken,
  setPortalCookie,
  attachPortalCookie,
  calculateProfileCompletion,
} from '@/lib/portal-auth';
import { z } from 'zod';

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().trim().min(6, 'Valid phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().optional(),
  email: z.string().trim().email('Valid email is required'),
  district: z.string().optional().nullable(),
  preferredCountryId: z.string().optional().nullable(),
  preferredJobCategoryId: z.string().optional().nullable(),
  agreeTerms: z.boolean().optional(),
}).refine(
  (data) => !data.confirmPassword || data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: issue?.message || 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const phone = data.phone;
    const email = data.email.toLowerCase();

    // Check if an applicant already exists with this phone or email
    const existingApplicant = await prisma.applicant.findFirst({
      where: {
        OR: [
          { phone },
          { email },
        ],
      },
    });

    if (existingApplicant && existingApplicant.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this phone or email already exists. Please log in.',
          errorBn: 'এই ফোন নম্বর অথবা ইমেইল দিয়ে আগেই অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে সাইন ইন করুন।',
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashApplicantPassword(data.password);

    // Transactional creation of Applicant, Profile, and Customer
    const applicant = await prisma.$transaction(async (tx) => {
      let candidate;

      if (existingApplicant) {
        // Applicant was entered previously by staff/inquiry, now initializing portal access
        candidate = await tx.applicant.update({
          where: { id: existingApplicant.id },
          data: {
            fullName: data.fullName,
            passwordHash,
            isActive: true,
            email,
            district: data.district || existingApplicant.district,
            preferredCountryId: data.preferredCountryId || existingApplicant.preferredCountryId,
            preferredJobCategoryId: data.preferredJobCategoryId || existingApplicant.preferredJobCategoryId,
          },
        });
      } else {
        // New candidate registration
        const applicantNumber = await generateApplicantNumber(tx as any);
        candidate = await tx.applicant.create({
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
      }

      // Initialize or link ApplicantProfile
      await tx.applicantProfile.upsert({
        where: { applicantId: candidate.id },
        create: {
          applicantId: candidate.id,
          skills: null,
          experienceYears: 0,
          education: null,
          notes: 'Auto-initialized during portal registration',
        },
        update: {},
      });

      // Ensure Customer record exists for accounting and invoice reconciliation
      await tx.customer.upsert({
        where: { applicantId: candidate.id },
        create: {
          customerType: 'APPLICANT',
          name: candidate.fullName,
          phone: candidate.phone,
          email: candidate.email,
          applicantId: candidate.id,
        },
        update: {
          name: candidate.fullName,
          phone: candidate.phone,
          email: candidate.email,
        },
      });

      return candidate;
    });

    // Generate JWT token for session
    const token = await createPortalToken({
      applicantId: applicant.id,
      applicantNumber: applicant.applicantNumber,
      phone: applicant.phone,
      email: applicant.email,
      fullName: applicant.fullName,
    });

    await setPortalCookie(token);

    const completion = calculateProfileCompletion(applicant);

    const response = NextResponse.json(
      {
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
      },
      { status: 201 }
    );

    return attachPortalCookie(response, token);
  } catch (error: any) {
    console.error('Portal registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again later.' },
      { status: 500 }
    );
  }
}

