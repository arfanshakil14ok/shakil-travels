import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { visaAppointmentSchema } from '@/lib/validations/visa';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('VISA_VIEW');
    const { id } = await params;

    const appointments = await prisma.visaAppointment.findMany({
      where: { visaApplicationId: id },
      orderBy: { appointmentDate: 'asc' },
    });

    return NextResponse.json({ success: true, data: appointments });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('VISA_EDIT');
    const { id } = await params;
    const body = await request.json();

    const parsed = visaAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const visaApp = await prisma.visaApplication.findUnique({
      where: { id },
      include: { applicant: true, country: true },
    });

    if (!visaApp) {
      return NextResponse.json({ success: false, error: 'Visa application not found' }, { status: 404 });
    }

    const { appointmentType, appointmentDate, location, reference, status, notes } = parsed.data;

    const appointment = await prisma.visaAppointment.create({
      data: {
        visaApplicationId: id,
        appointmentType,
        appointmentDate: new Date(appointmentDate),
        location: location || null,
        reference: reference || null,
        status: status || 'SCHEDULED',
        notes: notes || null,
      },
    });

    // Notify candidate
    await prisma.notification.create({
      data: {
        applicantId: visaApp.applicantId,
        type: 'VISA_APPOINTMENT',
        title: `${appointmentType.replace(/_/g, ' ')} Appointment Scheduled`,
        message: `An appointment for ${visaApp.country.name} has been set for ${new Date(appointmentDate).toLocaleString()}${location ? ` at ${location}` : ''}.`,
        link: `/portal/visa`,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'VISA_APPOINTMENT_CREATE',
      entity: 'VISA_APPOINTMENT',
      entityId: appointment.id,
      newValue: {
        visaApplicationId: id,
        appointmentType,
        appointmentDate,
        location,
      },
    });

    return NextResponse.json({
      success: true,
      data: appointment,
      message: `${appointmentType} appointment scheduled successfully`,
    }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating appointment:', error);
    return NextResponse.json({ success: false, error: 'Failed to schedule appointment' }, { status: 500 });
  }
}
