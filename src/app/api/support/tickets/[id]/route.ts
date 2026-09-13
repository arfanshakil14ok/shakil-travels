import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getCurrentApplicant } from '@/lib/portal-auth';
import { createAuditLog } from '@/lib/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const staffUser = await getCurrentUser();
    let candidateApplicant = null;
    if (!staffUser) {
      candidateApplicant = await getCurrentApplicant();
      if (!candidateApplicant) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Please log in' }, { status: 401 });
      }
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        applicant: {
          select: {
            id: true,
            fullName: true,
            applicantNumber: true,
            phone: true,
            profilePhoto: true,
          },
        },
        assignedStaff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            staffSender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    // Ensure candidate can only access their own ticket
    if (candidateApplicant && ticket.applicantId !== candidateApplicant.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    console.error('Error fetching ticket detail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const staffUser = await getCurrentUser();
    let candidateApplicant = null;
    if (!staffUser) {
      candidateApplicant = await getCurrentApplicant();
      if (!candidateApplicant) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Please log in' }, { status: 401 });
      }
    }

    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    if (candidateApplicant && existingTicket.applicantId !== candidateApplicant.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { status, priority, category, assignedStaffId } = body;

    const dataToUpdate: any = {};

    if (candidateApplicant) {
      // Candidate can only close or reopen their ticket
      if (status && (status === 'CLOSED' || status === 'OPEN')) {
        dataToUpdate.status = status;
        if (status === 'CLOSED') {
          dataToUpdate.resolvedAt = new Date();
        }
      }
    } else {
      // Staff updates
      if (status !== undefined) {
        dataToUpdate.status = status;
        if (status === 'RESOLVED' || status === 'CLOSED') {
          dataToUpdate.resolvedAt = new Date();
        } else {
          dataToUpdate.resolvedAt = null;
        }
      }
      if (priority !== undefined) dataToUpdate.priority = priority;
      if (category !== undefined) dataToUpdate.category = category;
      if (assignedStaffId !== undefined) dataToUpdate.assignedStaffId = assignedStaffId;
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: dataToUpdate,
      include: {
        applicant: {
          select: { id: true, fullName: true, applicantNumber: true },
        },
        assignedStaff: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (staffUser) {
      await createAuditLog({
        action: 'SUPPORT_TICKET_UPDATED',
        entity: 'SupportTicket',
        entityId: id,
        metadata: { updates: dataToUpdate, ticketNumber: updated.ticketNumber },
        userId: staffUser.id,
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
