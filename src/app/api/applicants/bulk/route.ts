import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('APPLICANT_EDIT');
    const body = await request.json();
    const { action, ids, payload } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No applicant IDs provided' }, { status: 400 });
    }

    if (action === 'status') {
      const { status } = payload || {};
      if (!status) {
        return NextResponse.json({ success: false, error: 'Target status is required' }, { status: 400 });
      }

      const result = await prisma.applicant.updateMany({
        where: { id: { in: ids } },
        data: { status },
      });

      await createAuditLog({
        userId: currentUser.id,
        action: 'APPLICANT_BULK_STATUS_CHANGE',
        entity: 'Applicant',
        newValue: { count: result.count, targetStatus: status, ids },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully updated status for ${result.count} applicants.`,
      });
    }

    if (action === 'assign_staff') {
      const { staffId } = payload || {};

      const result = await prisma.applicant.updateMany({
        where: { id: { in: ids } },
        data: { assignedStaffId: staffId || null },
      });

      await createAuditLog({
        userId: currentUser.id,
        action: 'APPLICANT_BULK_STAFF_ASSIGN',
        entity: 'Applicant',
        newValue: { count: result.count, assignedStaffId: staffId, ids },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully assigned staff for ${result.count} applicants.`,
      });
    }

    if (action === 'deactivate') {
      const result = await prisma.applicant.updateMany({
        where: { id: { in: ids } },
        data: { status: 'INACTIVE' },
      });

      await createAuditLog({
        userId: currentUser.id,
        action: 'APPLICANT_BULK_DEACTIVATE',
        entity: 'Applicant',
        newValue: { count: result.count, ids },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully deactivated ${result.count} applicants.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid bulk action' }, { status: 400 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error in bulk applicant action:', error);
    return NextResponse.json({ success: false, error: 'Failed to perform bulk action' }, { status: 500 });
  }
}
