import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getCurrentApplicant } from '@/lib/portal-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    if (candidateApplicant && ticket.applicantId !== candidateApplicant.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { message, attachments } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message content cannot be empty' }, { status: 400 });
    }

    const senderType = candidateApplicant ? 'APPLICANT' : 'STAFF';
    const senderId = staffUser ? staffUser.id : null;

    // Determine status transition
    let nextStatus = ticket.status;
    if (senderType === 'APPLICANT') {
      // If candidate responds to a waiting or resolved ticket, reopen to OPEN/IN_PROGRESS
      if (ticket.status === 'WAITING_FOR_CANDIDATE' || ticket.status === 'RESOLVED') {
        nextStatus = 'IN_PROGRESS';
      }
    } else if (senderType === 'STAFF') {
      // If staff replies, set to WAITING_FOR_CANDIDATE if currently OPEN
      if (ticket.status === 'OPEN') {
        nextStatus = 'WAITING_FOR_CANDIDATE';
      }
    }

    const [newMessage] = await prisma.$transaction([
      prisma.ticketMessage.create({
        data: {
          ticketId: id,
          senderType,
          senderId,
          message: message.trim(),
          attachments: attachments ? JSON.stringify(attachments) : null,
        },
        include: {
          staffSender: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.supportTicket.update({
        where: { id },
        data: {
          status: nextStatus,
          updatedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: newMessage });
  } catch (error: any) {
    console.error('Error adding ticket message:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add message' },
      { status: 500 }
    );
  }
}
