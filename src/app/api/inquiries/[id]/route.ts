import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const updateInquirySchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'CLOSED']).optional(),
  assignedStaffId: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('INQUIRY_VIEW');
    const { id } = await params;

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        convertedApplicant: {
          select: {
            id: true,
            applicantNumber: true,
            fullName: true,
            phone: true,
            email: true,
            status: true,
          },
        },
        assignedStaff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json({ success: false, error: 'Inquiry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: inquiry });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching inquiry:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch inquiry' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission('INQUIRY_MANAGE');
    const { id } = await params;

    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Inquiry not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateInquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.inquiry.update({
      where: { id },
      data: parsed.data,
      include: {
        convertedApplicant: {
          select: { id: true, applicantNumber: true, fullName: true },
        },
        assignedStaff: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Inquiry',
      entityId: id,
      newValue: {
        inquiryNumber: existing.inquiryNumber,
        oldStatus: existing.status,
        newStatus: updated.status,
        changes: parsed.data,
      },
      userId: user.id,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating inquiry:', error);
    return NextResponse.json({ success: false, error: 'Failed to update inquiry' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission('INQUIRY_MANAGE');
    const { id } = await params;

    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Inquiry not found' }, { status: 404 });
    }

    await prisma.inquiry.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE',
      entity: 'Inquiry',
      entityId: id,
      oldValue: {
        inquiryNumber: existing.inquiryNumber,
        name: existing.name,
      },
      userId: user.id,
    });

    return NextResponse.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting inquiry:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete inquiry' }, { status: 500 });
  }
}
