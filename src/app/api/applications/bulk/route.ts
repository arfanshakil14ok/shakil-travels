import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { bulkUpdateApplicationStatusSchema } from '@/lib/validations/application';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('APPLICATION_STATUS_CHANGE');
    const body = await request.json();

    const parsed = bulkUpdateApplicationStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { applicationIds, toStatus, notes } = parsed.data;

    const applications = await prisma.application.findMany({
      where: { id: { in: applicationIds } },
    });

    if (applications.length === 0) {
      return NextResponse.json({ success: false, error: 'No applications found to update' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update application statuses
      await tx.application.updateMany({
        where: { id: { in: applicationIds } },
        data: { status: toStatus, currentStage: toStatus },
      });

      // 2. Insert history entries
      const historyData = applications.map((app) => ({
        applicationId: app.id,
        fromStage: app.status || app.currentStage,
        toStage: toStatus,
        changedById: currentUser.id,
        notes: notes || `Bulk transition to ${toStatus}`,
      }));

      await tx.applicationStatusHistory.createMany({
        data: historyData,
      });
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'APPLICATION_STATUS_CHANGE',
      entity: 'APPLICATION',
      entityId: 'BULK',
      newValue: {
        count: applications.length,
        toStatus,
        applicationIds,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${applications.length} applications to ${toStatus}`,
      updatedCount: applications.length,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error in bulk application update:', error);
    return NextResponse.json({ success: false, error: 'Failed to process bulk update' }, { status: 500 });
  }
}
