import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validations/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const ua = req.headers.get('user-agent') || 'Unknown Browser';

    // 1. Rate Limiting Check (5 attempts per IP per 15 mins)
    const rateCheck = checkRateLimit(`login:${ip}`, 5, 900);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many failed login attempts. Please try again after 15 minutes.',
        },
        { status: 429 }
      );
    }

    // 2. Validate Body
    const body = await req.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.errors[0]?.message || 'Invalid input data',
        },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // 3. User Lookup
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
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

    if (!user) {
      await createAuditLog({
        action: 'LOGIN_FAILED',
        entity: 'AUTH',
        ipAddress: ip,
        userAgent: ua,
        newValue: { email: email.toLowerCase(), reason: 'USER_NOT_FOUND' },
      });
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 4. Check Active Status
    if (!user.isActive) {
      await createAuditLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entity: 'AUTH',
        ipAddress: ip,
        userAgent: ua,
        newValue: { email: user.email, reason: 'ACCOUNT_DEACTIVATED' },
      });
      return NextResponse.json(
        { success: false, error: 'Your account is deactivated. Please contact an administrator.' },
        { status: 403 }
      );
    }

    // 5. Verify Password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      await createAuditLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entity: 'AUTH',
        ipAddress: ip,
        userAgent: ua,
        newValue: { email: user.email, reason: 'INVALID_PASSWORD' },
      });
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 6. Update Last Login Timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 7. Create Session JWT & Set Cookie
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
    });
    await setSessionCookie(token);

    // 8. Log Successful Login
    await createAuditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entity: 'AUTH',
      entityId: user.id,
      ipAddress: ip,
      userAgent: ua,
      newValue: { email: user.email, role: user.role.name },
    });

    const permissions = user.role.rolePermissions.map((rp) => rp.permission.code);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: {
          id: user.role.id,
          name: user.role.name,
        },
        permissions,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
