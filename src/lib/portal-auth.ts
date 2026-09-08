import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from './prisma';

const PORTAL_JWT_SECRET = new TextEncoder().encode(
  process.env.PORTAL_JWT_SECRET || process.env.JWT_SECRET || 'sgr_portal_secure_jwt_secret_applicant_2026'
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

export async function setPortalCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: PORTAL_SESSION_DURATION,
  });
}

export async function clearPortalCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(PORTAL_COOKIE_NAME);
}

export async function getCurrentApplicant(): Promise<any | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PORTAL_COOKIE_NAME)?.value;
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
    { label: 'Full Name', pass: !!(applicant.fullName && applicant.fullName.trim().length > 0) },
    { label: 'Contact Phone', pass: !!(applicant.phone && applicant.phone.trim().length > 0) },
    { label: 'District / Location', pass: !!applicant.district },
    { label: 'Education Details', pass: !!applicant.education },
    { label: 'Profession & Skills', pass: !!(applicant.profession || applicant.skills) },
    { label: 'Passport Information', pass: !!(applicant.passportAvailable && applicant.passportNumber) },
    { label: 'Preferred Destination', pass: !!applicant.preferredCountryId },
    { label: 'Emergency Contact', pass: !!applicant.profile?.emergencyContact },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const missingFields = checks.filter((c) => !c.pass).map((c) => c.label);
  const percentage = Math.round((passed / checks.length) * 100);

  return {
    percentage,
    missingFields,
  };
}
