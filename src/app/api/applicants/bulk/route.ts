import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';
import { purgeApplicant } from '@/lib/applicant-deletion';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const { action, ids, payload } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No applicant IDs provided' }, { status: 400 });
    }

    if (action === 'delete') {
      const canDelete =
        currentUser.role?.name === 'SUPER_ADMIN' ||
        currentUser.role?.name === 'ADMIN' ||
        currentUser.role?.name === 'MANAGER' ||
        hasPermission(currentUser, 'APPLICANT_DELETE');

      if (!canDelete) {
        return NextResponse.json(
          { success: false, error: 'Access denied: You do not have permission to delete applicants.' },
          { status: 403 }
        );
      }

      const results = [];
      const errors = [];
      for (const applicantId of ids) {
        try {
          const res = await purgeApplicant(applicantId, currentUser);
          results.push(res);
        } catch (err: any) {
          errors.push({ id: applicantId, error: err.message });
        }
      }

      return NextResponse.json({
        success: true,
        data: { purgedCount: results.length, errors },
        message: `সফলভাবে ${results.length} জন প্রার্থী এবং তাদের সমস্ত ফাইল ও ডাটা সিস্টেম থেকে সম্পূর্ণ মুছে ফেলা হয়েছে। / Successfully deleted ${results.length} applicants.`,
      });
    }

    // Other actions require APPLICANT_EDIT
    const canEdit =
      currentUser.role?.name === 'SUPER_ADMIN' ||
      currentUser.role?.name === 'ADMIN' ||
      currentUser.role?.name === 'MANAGER' ||
      hasPermission(currentUser, 'APPLICANT_EDIT');

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Access denied: You do not have permission to modify applicants.' },
        { status: 403 }
      );
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

