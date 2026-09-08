import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApplicantPassword, createPortalToken, setPortalCookie, calculateProfileCompletion } from '@/lib/portal-auth';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Phone, Applicant ID, or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;
    const trimmed = identifier.trim();

    // Find candidate by phone, applicantNumber, or email
    const applicant = await prisma.applicant.findFirst({
      where: {
        OR: [
          { phone: trimmed },
          { applicantNumber: { equals: trimmed, mode: 'insensitive' } },
          { email: { equals: trimmed.toLowerCase(), mode: 'insensitive' } },
        ],
      },
      include: {
        profile: true,
      },
    });

    if (!applicant) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Please check your details or register.' },
        { status: 401 }
      );
    }

    if (!applicant.isActive) {
      return NextResponse.json(
        { success: false, error: 'Your portal account is currently suspended. Please contact support.' },
        { status: 403 }
      );
    }

    if (!applicant.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Portal access has not been activated for this account. Please use Register to set up your password.',
          needsActivation: true,
        },
        { status: 401 }
      );
    }

    const isValid = await verifyApplicantPassword(password, applicant.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Please check your password.' },
        { status: 401 }
      );
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
      message: 'Logged in successfully',
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
    });
  } catch (error: any) {
    console.error('Portal login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again later.' },
      { status: 500 }
    );
  }
}
