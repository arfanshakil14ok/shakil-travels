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

    // Find candidate by phone, applicantNumber, email, or passportNumber
    const applicant = await prisma.applicant.findFirst({
      where: {
        OR: [
          { phone: trimmed },
          { applicantNumber: { equals: trimmed, mode: 'insensitive' } },
          { email: { equals: trimmed.toLowerCase(), mode: 'insensitive' } },
          { passportNumber: { equals: trimmed, mode: 'insensitive' } },
        ],
      },
      include: {
        profile: true,
      },
    });

    if (!applicant) {
      // Check if this is an ERP Staff or Admin User
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: trimmed.toLowerCase(), mode: 'insensitive' } },
            ...(trimmed.length >= 6 ? [{ phone: trimmed }] : []),
          ],
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (user && user.isActive) {
        const { verifyPassword, createSessionToken, setSessionCookie } = await import('@/lib/auth');
        const isUserValid = await verifyPassword(password, user.passwordHash);
        if (isUserValid) {
          const token = await createSessionToken({
            userId: user.id,
            email: user.email,
            role: user.role.name,
          });

          await setSessionCookie(token);

          const permissions = user.role.rolePermissions?.map(
            (rp: any) => rp.permission?.code || rp.permissionCode
          ) || [];

          await createAuditLog({
            userId: user.id,
            action: 'LOGIN_SUCCESS',
            entity: 'AUTH',
            entityId: user.id,
            ipAddress: ip,
            userAgent: ua,
            newValue: { email: user.email, role: user.role.name },
          });

          return NextResponse.json({
            success: true,
            token,
            userType: 'STAFF',
            role: user.role.name,
            message: `ERP ${user.role.name} হিসেবে সফলভাবে লগইন হয়েছে`,
            data: {
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                role: user.role.name,
                permissions,
              },
              applicant: {
                id: user.id,
                applicantNumber: user.role.name,
                fullName: user.name,
                phone: user.phone || '',
                email: user.email,
                role: user.role.name,
                profileCompletion: 100,
              },
            },
          });
        }
      }

      await createAuditLog({
        action: 'LOGIN_FAILED',
        entity: 'CANDIDATE_AUTH',
        ipAddress: ip,
        userAgent: ua,
        newValue: { identifier: trimmed, reason: 'APPLICANT_OR_USER_NOT_FOUND' },
      });
      return NextResponse.json(
        { success: false, error: 'ইউজারনেম বা পাসওয়ার্ড সঠিক নয়। দয়া করে সঠিক তথ্য দিন।' },
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
        { success: false, error: 'আপনার অ্যাকাউন্টটি স্থগিত রয়েছে। অনুগ্রহ করে অফিসে যোগাযোগ করুন।' },
        { status: 403 }
      );
    }

    // If candidate has no password set yet (e.g. registered in office), activate with provided password
    if (!applicant.passwordHash) {
      const { hashApplicantPassword } = await import('@/lib/portal-auth');
      const newHash = await hashApplicantPassword(password);
      await prisma.applicant.update({
        where: { id: applicant.id },
        data: { passwordHash: newHash },
      });
      applicant.passwordHash = newHash;
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
        { success: false, error: 'ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।' },
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
      token,
      userType: 'CANDIDATE',
      role: 'CANDIDATE',
      message: 'Logged in successfully',
      data: {
        applicant: {
          id: applicant.id,
          applicantNumber: applicant.applicantNumber,
          fullName: applicant.fullName,
          phone: applicant.phone,
          email: applicant.email,
          role: 'CANDIDATE',
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
