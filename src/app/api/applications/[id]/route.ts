import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('APPLICATION_VIEW');
    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        applicant: {
          include: {
            customer: true,
            preferredCountry: true,
            preferredJobCategory: true,
            assignedStaff: { select: { id: true, name: true, email: true } },
          },
        },
        job: {
          include: {
            employer: true,
            country: true,
            jobCategory: true,
          },
        },
        assignedStaff: {
          select: { id: true, name: true, email: true, phone: true },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { id: true, name: true, email: true } },
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          include: {
            documentType: true,
            verifiedBy: { select: { id: true, name: true } },
          },
        },
        interviews: {
          orderBy: { scheduledAt: 'desc' },
        },
        visaApplications: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            payments: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: application });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching application details:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch application details' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('APPLICATION_EDIT');
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.application.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        priority: body.priority !== undefined ? body.priority : existing.priority,
        assignedStaffId: body.assignedStaffId !== undefined ? body.assignedStaffId : (body.assignedToId !== undefined ? body.assignedToId : existing.assignedStaffId),
        notes: body.notes !== undefined ? body.notes : (body.internalNotes !== undefined ? body.internalNotes : existing.notes),
      },
      include: {
        applicant: { select: { id: true, fullName: true, applicantNumber: true } },
        job: { select: { id: true, title: true } },
        assignedStaff: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'APPLICATION_EDIT',
      entity: 'APPLICATION',
      entityId: id,
      oldValue: {
        priority: existing.priority,
        assignedStaffId: existing.assignedStaffId,
        notes: existing.notes,
      },
      newValue: {
        priority: updated.priority,
        assignedStaffId: updated.assignedStaffId,
        notes: updated.notes,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        assignedTo: updated.assignedStaff,
      },
      message: 'Application updated successfully',
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating application:', error);
    return NextResponse.json({ success: false, error: 'Failed to update application' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('APPLICATION_DELETE');
    const { id } = await params;

    const existing = await prisma.application.findUnique({
      where: { id },
      include: {
        invoices: { select: { id: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    if (existing.invoices.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete application with linked invoices. Please void or manage invoices first.',
        },
        { status: 400 }
      );
    }

    await prisma.application.delete({
      where: { id },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'APPLICATION_DELETE',
      entity: 'APPLICATION',
      entityId: id,
      oldValue: {
        applicationNumber: existing.applicationNumber,
        status: existing.status || existing.currentStage,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Application ${existing.applicationNumber} deleted successfully`,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting application:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete application' }, { status: 500 });
  }
}
