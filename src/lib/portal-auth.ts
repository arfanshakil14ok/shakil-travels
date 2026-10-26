import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import prisma from './prisma';

const PORTAL_JWT_SECRET = new TextEncoder().encode(
  process.env.PORTAL_JWT_SECRET || 'sgr_portal_secure_jwt_secret_applicant_2026'
);
const PORTAL_COOKIE_NAME = 'sgr_portal_session';
const PORTAL_SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

export interface PortalApplicantSession {
  applicantId: string;
  applicantNumber: string;
  phone: string;
  email?: string | null;
  fullName: string;
}

export async function hashApplicantPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyApplicantPassword(plain: string, hashed: string): Promise<boolean> {
  return await bcrypt.compare(plain, hashed);
}

export async function createPortalToken(payload: PortalApplicantSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${PORTAL_SESSION_DURATION}s`)
    .sign(PORTAL_JWT_SECRET);
}

export async function verifyPortalToken(token: string): Promise<PortalApplicantSession | null> {
  try {
    const { payload } = await jwtVerify(token, PORTAL_JWT_SECRET);
    return payload as unknown as PortalApplicantSession;
  } catch (err) {
    return null;
  }
}

import type { NextResponse } from 'next/server';

export async function setPortalCookie(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(PORTAL_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: PORTAL_SESSION_DURATION,
    });
  } catch (err) {
    // In Route Handlers where cookies() is read-only, attachPortalCookie handles the response header
  }
}

export function attachPortalCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(PORTAL_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: PORTAL_SESSION_DURATION,
  });
  return response;
}

export async function clearPortalCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(PORTAL_COOKIE_NAME);
  } catch (err) {
    // In Route Handlers where cookies() is read-only, clearPortalCookieOnResponse handles it
  }
}

export function clearPortalCookieOnResponse(response: NextResponse): NextResponse {
  response.cookies.delete(PORTAL_COOKIE_NAME);
  return response;
}


export async function getCurrentApplicant(): Promise<any | null> {
  try {
    let token: string | undefined;

    // 1. Support Authorization: Bearer <token> for mobile and API clients
    try {
      const headersList = await headers();
      const authHeader = headersList.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    } catch (_) {
      // In contexts where headers() is unavailable, fall through
    }

    // 2. Fall back to HTTP-only cookie for web browsers
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get(PORTAL_COOKIE_NAME)?.value;
    }

    if (!token) return null;

    const payload = await verifyPortalToken(token);
    if (!payload?.applicantId) return null;

    const applicant = await prisma.applicant.findUnique({
      where: { id: payload.applicantId },
      include: {
        profile: true,
        preferredCountry: true,
        preferredJobCategory: true,
      },
    });

    if (!applicant || !applicant.isActive) {
      return null;
    }

    return applicant;
  } catch (err) {
    return null;
  }
}

export async function requireApplicantAuth(): Promise<any> {
  const applicant = await getCurrentApplicant();
  if (!applicant) {
    throw new Error('Unauthenticated: Please log in to your applicant portal');
  }
  return applicant;
}

/**
 * Calculates profile completion score out of 100%
 */
export function calculateProfileCompletion(applicant: any): {
  percentage: number;
  missingFields: string[];
} {
  const checks: { label: string; pass: boolean }[] = [
    {
      label: 'Full Name (পূর্ণ নাম)',
      pass: !!(applicant.fullName && applicant.fullName.trim().length > 0),
    },
    {
      label: 'Contact Phone (মোবাইল নম্বর)',
      pass: !!(applicant.phone && applicant.phone.trim().length > 0),
    },
    {
      label: 'Profile Photo (পাসপোর্ট সাইজ ছবি)',
      pass: !!(applicant.profilePhoto && applicant.profilePhoto.trim().length > 0),
    },
    {
      label: 'District & Address (জেলা ও বর্তমান ঠিকানা)',
      pass: !!(applicant.district && (applicant.address || applicant.profile?.currentAddress)),
    },
    {
      label: 'Emergency Contact (জরুরি যোগাযোগ নম্বর)',
      pass: !!(applicant.profile?.emergencyContact && applicant.profile.emergencyContact.trim().length > 0),
    },
    {
      label: 'Education Details (শিক্ষাগত যোগ্যতা)',
      pass: !!(applicant.education || applicant.profile?.education),
    },
    {
      label: 'Profession & Skills (পেশা ও ট্রেড দক্ষতা)',
      pass: !!(applicant.profession || applicant.skills || applicant.profile?.skills),
    },
    {
      label: 'Passport Information (পাসপোর্ট নম্বর ও বিবরণ)',
      pass: !!(applicant.passportAvailable && applicant.passportNumber && applicant.passportNumber.trim().length > 0),
    },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const missingFields = checks.filter((c) => !c.pass).map((c) => c.label);
  const percentage = Math.round((passed / checks.length) * 100);

  return {
    percentage,
    missingFields,
  };
}

