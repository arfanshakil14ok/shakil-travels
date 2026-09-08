import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { updateVisaStatusSchema } from '@/lib/validations/visa';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('VISA_STATUS_CHANGE');
    const { id } = await params;
    const body = await request.json();

    const parsed = updateVisaStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      toStatus,
      reason,
      notes,
      submissionDate,
      appointmentDate,
      biometricsDate,
      medicalDate,
      decisionDate,
      visaExpiryDate,
      referenceNumber,
      rejectionReason,
    } = parsed.data;

    const existing = await prisma.visaApplication.findUnique({
      where: { id },
      include: {
        applicant: true,
        application: true,
        country: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Visa application not found' }, { status: 404 });
    }

    const oldStatus = existing.status;
    const targetStatus = toStatus;

    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: targetStatus,
      };

      if (notes) updateData.notes = notes;
      if (referenceNumber) updateData.referenceNumber = referenceNumber;
      if (submissionDate) updateData.submissionDate = new Date(submissionDate);
      if (appointmentDate) updateData.appointmentDate = new Date(appointmentDate);
      if (biometricsDate) updateData.biometricsDate = new Date(biometricsDate);
      if (medicalDate) updateData.medicalDate = new Date(medicalDate);
      if (decisionDate) updateData.decisionDate = new Date(decisionDate);
      if (visaExpiryDate) updateData.visaExpiryDate = new Date(visaExpiryDate);
      if (rejectionReason) updateData.rejectionReason = rejectionReason;

      // Auto-set decision date if approving or rejecting
      if (targetStatus === 'APPROVED' && !decisionDate) {
        updateData.decisionDate = new Date();
      }
      if (targetStatus === 'REJECTED' && !decisionDate) {
        updateData.decisionDate = new Date();
      }
      if (targetStatus === 'SUBMITTED' && !submissionDate) {
        updateData.submissionDate = new Date();
      }

      const updated = await tx.visaApplication.update({
        where: { id },
        data: updateData,
        include: {
          applicant: { select: { id: true, fullName: true, applicantNumber: true } },
          country: { select: { id: true, name: true } },
          assignedStaff: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.visaStatusHistory.create({
        data: {
          visaApplicationId: id,
          oldStatus,
          newStatus: targetStatus,
          changedById: currentUser.id,
          reason: reason || null,
          notes: notes || null,
        },
      });

      // Notify candidate in-app
      await tx.notification.create({
        data: {
          applicantId: existing.applicantId,
          type: 'VISA_UPDATE',
          title: `Visa Status Updated: ${targetStatus}`,
          message: `Your visa application for ${existing.country.name} is now ${targetStatus.replace(/_/g, ' ')}.${reason ? ` (${reason})` : ''}`,
          link: `/portal/visa`,
        },
      });

      // If assigned staff exists and is not the current user, notify staff as well
      if (existing.assignedStaffId && existing.assignedStaffId !== currentUser.id) {
        await tx.notification.create({
          data: {
            userId: existing.assignedStaffId,
            type: 'VISA_UPDATE',
            title: `Visa Case Status Changed: ${existing.visaApplicationNumber}`,
            message: `Candidate ${existing.applicant.fullName}'s visa status moved to ${targetStatus} by ${currentUser.name}.`,
            link: `/admin/visa/applications/${id}`,
          },
        });
      }

      return updated;
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'VISA_STATUS_CHANGE',
      entity: 'VISA_APPLICATION',
      entityId: id,
      oldValue: { status: oldStatus },
      newValue: {
        status: targetStatus,
        reason,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Visa status successfully changed to ${targetStatus}`,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error transitioning visa status:', error);
    return NextResponse.json({ success: false, error: 'Failed to transition visa status' }, { status: 500 });
  }
}
