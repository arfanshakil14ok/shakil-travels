import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { departureConfirmSchema } from '@/lib/validations/processing';
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

    const departureCase = await prisma.departureCase.findUnique({
      where: { processingCaseId: pc.id },
    });

    return NextResponse.json({ success: true, data: departureCase });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching departure case:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch departure case' }, { status: 500 });
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

    const parsed = departureConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      departureDate,
      departureTime,
      airport,
      flightNumber,
      destination,
      reportingTime,
      meetingPoint,
      emergencyContact,
      notes,
    } = parsed.data;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      include: {
        applicant: true,
        job: { include: { country: true } },
        travelTicket: true,
      },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    if (pc.overallStatus === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Cannot configure departure for a cancelled case' }, { status: 400 });
    }

    const depDate = departureDate
      ? new Date(departureDate)
      : pc.travelTicket?.departureDate || pc.expectedDepartureDate || new Date();

    const dest = destination || pc.travelTicket?.arrivalAirport || pc.job?.country?.name || 'Saudi Arabia';
    const flt = flightNumber || pc.travelTicket?.flightNumber || 'BG-339';
    const depAirport = airport || pc.travelTicket?.departureAirport || 'DAC - Hazrat Shahjalal International Airport, Dhaka';

    const departureCase = await prisma.departureCase.upsert({
      where: { processingCaseId: pc.id },
      create: {
        processingCaseId: pc.id,
        candidateId: pc.applicantId,
        departureDate: depDate,
        departureTime: departureTime || pc.travelTicket?.departureTime || null,
        airport: depAirport,
        flightNumber: flt,
        destination: dest,
        meetingPoint: meetingPoint || 'Terminal 1, Departure Briefing Gate',
        emergencyContact: emergencyContact || '+880 1711-000000',
        departureStatus: 'READY',
        notes: notes || null,
      },
      update: {
        departureDate: depDate,
        departureTime: departureTime || undefined,
        airport: depAirport,
        flightNumber: flt,
        destination: dest,
        meetingPoint: meetingPoint || undefined,
        emergencyContact: emergencyContact || undefined,
        departureStatus: 'READY',
        notes: notes || undefined,
      },
    });

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'UPDATE',
      entity: 'DEPARTURE_CASE',
      entityId: departureCase.id,
      description: `Updated departure details & pre-departure briefing for case ${pc.processingCode}`,
      metadata: { processingCaseId: pc.id, briefingDone: body.briefingDone ?? true, departureDate: depDate },
    });

    return NextResponse.json({
      success: true,
      message: 'Departure briefing and details saved successfully',
      data: departureCase,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating departure:', error);
    return NextResponse.json({ success: false, error: 'Failed to update departure details' }, { status: 500 });
  }
}
