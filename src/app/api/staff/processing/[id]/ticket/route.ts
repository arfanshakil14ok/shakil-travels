import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { ticketIssueSchema } from '@/lib/validations/processing';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      select: { id: true },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    const ticket = await prisma.travelTicket.findUnique({
      where: { processingCaseId: pc.id },
      include: { ticketDocument: true },
    });

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching ticket:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch ticket' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const parsed = ticketIssueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      airline,
      flightNumber,
      bookingReference,
      ticketNumber,
      departureAirport,
      arrivalAirport,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      baggageAllowance,
      ticketDocumentId,
      notes,
    } = parsed.data;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      include: { applicant: true, job: true },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    if (pc.overallStatus === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Cannot issue ticket for a cancelled case' }, { status: 400 });
    }

    const depDate = new Date(departureDate);
    const arrDate = arrivalDate ? new Date(arrivalDate) : null;

    const ticket = await prisma.travelTicket.upsert({
      where: { processingCaseId: pc.id },
      create: {
        processingCaseId: pc.id,
        candidateId: pc.applicantId,
        airline,
        flightNumber,
        bookingReference: bookingReference || null,
        ticketNumber: ticketNumber || null,
        departureAirport: departureAirport || 'DAC - Hazrat Shahjalal International Airport, Dhaka',
        arrivalAirport,
        departureDate: depDate,
        departureTime: departureTime || null,
        arrivalDate: arrDate,
        arrivalTime: arrivalTime || null,
        baggageAllowance: baggageAllowance || null,
        status: 'ISSUED',
        ticketDocumentId: ticketDocumentId || null,
        notes: notes || null,
      },
      update: {
        airline,
        flightNumber,
        bookingReference: bookingReference || undefined,
        ticketNumber: ticketNumber || undefined,
        departureAirport: departureAirport || undefined,
        arrivalAirport,
        departureDate: depDate,
        departureTime: departureTime || undefined,
        arrivalDate: arrDate,
        arrivalTime: arrivalTime || undefined,
        baggageAllowance: baggageAllowance || undefined,
        status: 'ISSUED',
        ticketDocumentId: ticketDocumentId || undefined,
        notes: notes || undefined,
      },
    });

    const previousStage = pc.currentStage;
    const newStage = 'TICKET_ISSUED';

    await prisma.$transaction([
      prisma.recruitmentProcessingCase.update({
        where: { id: pc.id },
        data: {
          currentStage: newStage,
          expectedDepartureDate: depDate,
        },
      }),
      prisma.processingStatusHistory.create({
        data: {
          processingCaseId: pc.id,
          fromStage: previousStage,
          toStage: newStage,
          changedById: currentUser.id,
          reason: `Flight ticket issued: ${airline} ${flightNumber} on ${depDate.toISOString().split('T')[0]}`,
          notes: notes || `PNR: ${bookingReference || 'N/A'}, Ticket: ${ticketNumber || 'N/A'}`,
        },
      }),
      prisma.notification.create({
        data: {
          applicantId: pc.applicantId,
          title: 'Flight Ticket Issued! / ফ্লাইটের টিকিট ইস্যু করা হয়েছে!',
          message: `Your flight ticket with ${airline} (${flightNumber}) departing on ${depDate.toISOString().split('T')[0]} has been issued.`,
          type: 'SUCCESS',
          link: `/portal/processing/${pc.id}`,
        },
      }),
    ]);

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'UPDATE',
      entity: 'TRAVEL_TICKET',
      entityId: ticket.id,
      description: `Flight ticket issued for case ${pc.processingCode} (${airline} ${flightNumber})`,
      metadata: { processingCaseId: pc.id, airline, flightNumber, departureDate: depDate },
    });

    return NextResponse.json({
      success: true,
      message: 'Flight ticket issued successfully',
      data: ticket,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error issuing ticket:', error);
    return NextResponse.json({ success: false, error: 'Failed to issue flight ticket' }, { status: 500 });
  }
}
