import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getCurrentApplicant } from '@/lib/portal-auth';
import { generateTicketNumber } from '@/lib/id-generator';
import { createAuditLog } from '@/lib/audit';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const applicantId = searchParams.get('applicantId');
    const search = searchParams.get('search')?.trim();

    // Check staff auth first
    const staffUser = await getCurrentUser();
    let candidateApplicant = null;
    if (!staffUser) {
      candidateApplicant = await getCurrentApplicant();
      if (!candidateApplicant) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Please log in' }, { status: 401 });
      }
    }

    const where: any = {};

    if (candidateApplicant) {
      where.applicantId = candidateApplicant.id;
    } else {
      if (applicantId && applicantId !== 'ALL') where.applicantId = applicantId;
      if (status && status !== 'ALL') where.status = status;
      if (category && category !== 'ALL') where.category = category;
      if (priority && priority !== 'ALL') where.priority = priority;

      if (search) {
        where.OR = [
          { ticketNumber: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } },
          { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
          { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
          { applicant: { phone: { contains: search, mode: 'insensitive' } } },
        ];
      }
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
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
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            senderType: true,
            message: true,
            createdAt: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: tickets });
  } catch (error: any) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const staffUser = await getCurrentUser();
    let candidateApplicant = null;
    if (!staffUser) {
      candidateApplicant = await getCurrentApplicant();
      if (!candidateApplicant) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Please log in' }, { status: 401 });
      }
    }

    const rateKey = candidateApplicant ? `ticket_create:${candidateApplicant.id}` : `ticket_create:${staffUser ? staffUser.id : ip}`;
    const rateCheck = checkRateLimit(rateKey, 10, 300);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: 'Too many tickets created. Please wait a few minutes before submitting again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      subject,
      category = 'GENERAL',
      priority = 'MEDIUM',
      message,
      applicantId: providedApplicantId,
      attachments,
    } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json({ success: false, error: 'Ticket subject is required' }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Initial message content is required' }, { status: 400 });
    }

    const applicantId = candidateApplicant ? candidateApplicant.id : providedApplicantId;
    if (!applicantId) {
      return NextResponse.json({ success: false, error: 'Applicant ID is required' }, { status: 400 });
    }

    const ticketNumber = await generateTicketNumber(prisma);

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        applicantId,
        category,
        priority,
        subject: subject.trim(),
        status: 'OPEN',
        assignedStaffId: staffUser ? staffUser.id : null,
        messages: {
          create: {
            senderType: candidateApplicant ? 'APPLICANT' : 'STAFF',
            senderId: staffUser ? staffUser.id : null,
            message: message.trim(),
            attachments: attachments ? JSON.stringify(attachments) : null,
          },
        },
      },
      include: {
        applicant: {
          select: { id: true, fullName: true, applicantNumber: true, phone: true },
        },
        messages: true,
      },
    });

    if (staffUser) {
      await createAuditLog({
        action: 'SUPPORT_TICKET_CREATED_BY_STAFF',
        entity: 'SupportTicket',
        entityId: ticket.id,
        metadata: { ticketNumber, applicantId, subject },
        userId: staffUser.id,
      });
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
