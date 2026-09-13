import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { hashPassword } from '@/lib/auth';
import { updateUserSchema } from '@/lib/validations/user';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requirePermission('USER_VIEW');
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        roleId: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requirePermission('USER_EDIT');
    const body = await req.json();

    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Protect against self-deactivation
    if (currentUser.id === targetUser.id && parsed.data.isActive === false) {
      return NextResponse.json(
        { success: false, error: 'You cannot deactivate your own account.' },
        { status: 400 }
      );
    }

    // Check email uniqueness if modified
    if (parsed.data.email.toLowerCase() !== targetUser.email.toLowerCase()) {
      const emailExists = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
      });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'This email is already in use by another user' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone || null,
      roleId: parsed.data.roleId,
      isActive: parsed.data.isActive,
    };

    if (parsed.data.password && parsed.data.password.length >= 8) {
      updateData.passwordHash = await hashPassword(parsed.data.password);
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: { role: true },
    });

    // Determine audit action
    const action =
      targetUser.isActive && !updated.isActive
        ? 'USER_DEACTIVATED'
        : !targetUser.isActive && updated.isActive
        ? 'USER_ACTIVATED'
        : 'USER_UPDATED';

    await createAuditLog({
      userId: currentUser.id,
      action,
      entity: 'USER',
      entityId: updated.id,
      oldValue: {
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role.name,
        isActive: targetUser.isActive,
      },
      newValue: {
        name: updated.name,
        email: updated.email,
        role: updated.role.name,
        isActive: updated.isActive,
      },
    });

    const { passwordHash: _, ...safeUser } = updated;

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: safeUser,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requirePermission('USER_DELETE');

    if (currentUser.id === params.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own account.' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Do not allow deleting super admins
    if (targetUser.role.name === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Super Admin users cannot be deleted.' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'USER_DELETED',
      entity: 'USER',
      entityId: params.id,
      oldValue: {
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting user:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}
