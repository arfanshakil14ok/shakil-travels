import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { hashPassword } from '@/lib/auth';
import { createUserSchema } from '@/lib/validations/user';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    await requirePermission('USER_VIEW');

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search')?.trim() || '';
    const roleId = searchParams.get('roleId')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (status) {
      where.isActive = status === 'active';
    }

    const [users, roles] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          roleId: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.role.findMany({
        select: { id: true, name: true, description: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { users, roles },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requirePermission('USER_CREATE');
    const body = await req.json();

    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    const { name, email, phone, password, roleId, isActive } = parsed.data;

    // Check email uniqueness
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A user with this email address already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        passwordHash,
        roleId,
        isActive,
      },
      include: {
        role: true,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'USER_CREATED',
      entity: 'USER',
      entityId: newUser.id,
      newValue: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role.name,
        isActive: newUser.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}
