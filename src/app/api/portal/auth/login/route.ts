import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  verifyApplicantPassword,
  createPortalToken,
  setPortalCookie,
  attachPortalCookie,
  calculateProfileCompletion,
} from '@/lib/portal-auth';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/audit';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Phone, Applicant ID, or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const ua = request.headers.get('user-agent') || 'Unknown Browser';

    // 1. Rate Limiting Check (5 attempts per IP per 15 mins)
    const rateCheck = checkRateLimit(`portal_login:${ip}`, 5, 900);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many failed login attempts. Please try again after 15 minutes.',
        },
        { status: 429 }
      );
    }

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
      await createAuditLog({
        action: 'LOGIN_FAILED',
        entity: 'CANDIDATE_AUTH',
        ipAddress: ip,
        userAgent: ua,
        newValue: { identifier: trimmed, reason: 'APPLICANT_NOT_FOUND' },
      });
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Please check your details.' },
        { status: 401 }
      );
    }

    if (!applicant.isActive) {
      await createAuditLog({
        applicantId: applicant.id,
        action: 'LOGIN_FAILED',
        entity: 'CANDIDATE_AUTH',
        ipAddress: ip,
        userAgent: ua,
        newValue: { identifier: trimmed, reason: 'ACCOUNT_INACTIVE' },
      });
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
      await createAuditLog({
        applicantId: applicant.id,
        action: 'LOGIN_FAILED',
        entity: 'CANDIDATE_AUTH',
        ipAddress: ip,
        userAgent: ua,
        newValue: { identifier: trimmed, reason: 'INVALID_PASSWORD' },
      });
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Please check your details.' },
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

    // Audit successful login
    await createAuditLog({
      applicantId: applicant.id,
      actorType: 'APPLICANT',
      action: 'LOGIN_SUCCESS',
      entity: 'CANDIDATE_AUTH',
      entityId: applicant.id,
      ipAddress: ip,
      userAgent: ua,
      newValue: { applicantNumber: applicant.applicantNumber, phone: applicant.phone },
    });

    const completion = calculateProfileCompletion(applicant);

    const response = NextResponse.json({
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

    return attachPortalCookie(response, token);
  } catch (error: any) {
    console.error('Portal login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again later.' },
      { status: 500 }
    );
  }
}
