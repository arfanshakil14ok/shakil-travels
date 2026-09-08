import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { assignApplicationSchema } from '@/lib/validations/application';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('APPLICATION_ASSIGN');
    const { id } = await params;
    const body = await request.json();

    const parsed = assignApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const assignedStaffId = parsed.data.assignedStaffId ?? parsed.data.assignedToId ?? null;
    const notes = parsed.data.notes ?? parsed.data.internalNotes ?? null;

    const application = await prisma.application.findUnique({
      where: { id },
      include: { assignedStaff: true },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    let staff = null;
    if (assignedStaffId) {
      staff = await prisma.user.findUnique({
        where: { id: assignedStaffId },
        select: { id: true, name: true, email: true },
      });
      if (!staff) {
        return NextResponse.json({ success: false, error: 'Staff user not found' }, { status: 404 });
      }
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        assignedStaffId,
        notes: notes ? `${application.notes ? application.notes + '\n' : ''}[Assigned by ${currentUser.name}]: ${notes}` : application.notes,
      },
      include: {
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'APPLICATION_ASSIGN',
      entity: 'APPLICATION',
      entityId: id,
      oldValue: { assignedStaffId: application.assignedStaffId },
      newValue: {
        assignedStaffId,
        assignedStaffName: staff?.name || 'Unassigned',
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: staff ? `Assigned to ${staff.name}` : 'Application unassigned',
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error assigning application:', error);
    return NextResponse.json({ success: false, error: 'Failed to assign application' }, { status: 500 });
  }
}
