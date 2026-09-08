import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('VISA_VIEW');
    const { id } = await params;

    const visaApp = await prisma.visaApplication.findUnique({
      where: { id },
      include: {
        applicant: {
          include: {
            profile: true,
            documents: {
              include: { documentType: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        application: {
          include: {
            job: {
              include: {
                employer: true,
                country: true,
                jobCategory: true,
              },
            },
            documents: {
              include: { documentType: true },
              orderBy: { createdAt: 'desc' },
            },
            interviews: {
              orderBy: { scheduledAt: 'desc' },
            },
            invoices: {
              include: {
                payments: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        country: true,
        assignedStaff: {
          select: { id: true, name: true, email: true },
        },
        statusHistory: {
          include: {
            changedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        appointments: {
          orderBy: { appointmentDate: 'asc' },
        },
      },
    });

    if (!visaApp) {
      return NextResponse.json({ success: false, error: 'Visa application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: visaApp });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching visa application details:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch visa application details' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('VISA_EDIT');
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.visaApplication.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Visa application not found' }, { status: 404 });
    }

    const updated = await prisma.visaApplication.update({
      where: { id },
      data: {
        visaType: body.visaType ?? existing.visaType,
        referenceNumber: body.referenceNumber !== undefined ? body.referenceNumber : existing.referenceNumber,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        assignedStaffId: body.assignedStaffId !== undefined ? body.assignedStaffId : existing.assignedStaffId,
        submissionDate: body.submissionDate ? new Date(body.submissionDate) : existing.submissionDate,
        appointmentDate: body.appointmentDate ? new Date(body.appointmentDate) : existing.appointmentDate,
        biometricsDate: body.biometricsDate ? new Date(body.biometricsDate) : existing.biometricsDate,
        medicalDate: body.medicalDate ? new Date(body.medicalDate) : existing.medicalDate,
        decisionDate: body.decisionDate ? new Date(body.decisionDate) : existing.decisionDate,
        visaExpiryDate: body.visaExpiryDate ? new Date(body.visaExpiryDate) : existing.visaExpiryDate,
        rejectionReason: body.rejectionReason !== undefined ? body.rejectionReason : existing.rejectionReason,
      },
      include: {
        applicant: { select: { id: true, fullName: true } },
        country: { select: { id: true, name: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'VISA_EDIT',
      entity: 'VISA_APPLICATION',
      entityId: id,
      oldValue: {
        status: existing.status,
        referenceNumber: existing.referenceNumber,
        assignedStaffId: existing.assignedStaffId,
      },
      newValue: {
        status: updated.status,
        referenceNumber: updated.referenceNumber,
        assignedStaffId: updated.assignedStaffId,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Visa application updated successfully',
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating visa application:', error);
    return NextResponse.json({ success: false, error: 'Failed to update visa application' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('VISA_EDIT');
    const { id } = await params;

    const existing = await prisma.visaApplication.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Visa application not found' }, { status: 404 });
    }

    await prisma.visaApplication.delete({ where: { id } });

    await createAuditLog({
      userId: currentUser.id,
      action: 'VISA_DELETE',
      entity: 'VISA_APPLICATION',
      entityId: id,
      oldValue: {
        visaApplicationNumber: existing.visaApplicationNumber,
        status: existing.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Visa application ${existing.visaApplicationNumber} deleted`,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting visa application:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete visa application' }, { status: 500 });
  }
}
