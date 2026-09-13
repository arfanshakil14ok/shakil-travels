import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getCurrentApplicant } from '@/lib/portal-auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const applicationId = searchParams.get('applicationId');
    const applicantId = searchParams.get('applicantId');
    const status = searchParams.get('status');
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
      if (applicationId && applicationId !== 'ALL') where.applicationId = applicationId;
      if (status && status !== 'ALL') where.status = status;

      if (search) {
        where.OR = [
          { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
          { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
          { application: { applicationCode: { contains: search, mode: 'insensitive' } } },
          { flightNumber: { contains: search, mode: 'insensitive' } },
          { pnrNumber: { contains: search, mode: 'insensitive' } },
          { airline: { contains: search, mode: 'insensitive' } },
          { ticketNumber: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

    const records = await prisma.departureRecord.findMany({
      where,
      orderBy: { departureDate: 'asc' },
      include: {
        applicant: {
          select: {
            id: true,
            fullName: true,
            applicantNumber: true,
            phone: true,
            passportNumber: true,
            profilePhoto: true,
          },
        },
        application: {
          select: {
            id: true,
            applicationCode: true,
            status: true,
            currentStage: true,
            job: {
              select: {
                id: true,
                title: true,
                jobCode: true,
                country: { select: { name: true, code: true, flag: true } },
              },
            },
          },
        },
        managedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    console.error('Error fetching departure records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch departure records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const staffUser = await getCurrentUser();
    if (!staffUser) {
      return NextResponse.json({ success: false, error: 'Staff authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      applicationId,
      applicantId: providedApplicantId,
      airline,
      flightNumber,
      ticketNumber,
      departureDate,
      departureAirport = 'DAC - Hazrat Shahjalal International Airport, Dhaka',
      destinationAirport,
      transitAirports,
      reportingTime,
      reportingInstructions,
      pnrNumber,
      status = 'SCHEDULED',
    } = body;

    if (!applicationId) {
      return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 });
    }
    if (!airline || !flightNumber || !departureDate || !destinationAirport) {
      return NextResponse.json(
        { success: false, error: 'Airline, flight number, departure date, and destination airport are required' },
        { status: 400 }
      );
    }

    let applicantId = providedApplicantId;
    if (!applicantId) {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { applicantId: true },
      });
      if (!application) {
        return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
      }
      applicantId = application.applicantId;
    }

    const record = await prisma.departureRecord.upsert({
      where: { applicationId },
      create: {
        applicationId,
        applicantId,
        airline,
        flightNumber,
        ticketNumber,
        departureDate: new Date(departureDate),
        departureAirport,
        destinationAirport,
        transitAirports,
        reportingTime: reportingTime ? new Date(reportingTime) : null,
        reportingInstructions,
        pnrNumber,
        status,
        managedById: staffUser.id,
      },
      update: {
        airline,
        flightNumber,
        ticketNumber: ticketNumber !== undefined ? ticketNumber : undefined,
        departureDate: new Date(departureDate),
        departureAirport,
        destinationAirport,
        transitAirports: transitAirports !== undefined ? transitAirports : undefined,
        reportingTime: reportingTime ? new Date(reportingTime) : null,
        reportingInstructions: reportingInstructions !== undefined ? reportingInstructions : undefined,
        pnrNumber: pnrNumber !== undefined ? pnrNumber : undefined,
        status,
        managedById: staffUser.id,
      },
      include: {
        applicant: { select: { fullName: true, applicantNumber: true } },
        application: { select: { applicationCode: true } },
      },
    });

    await createAuditLog({
      action: 'DEPARTURE_RECORD_SAVED',
      entity: 'DepartureRecord',
      entityId: record.id,
      metadata: {
        applicationId,
        applicantId,
        airline,
        flightNumber,
        departureDate,
        status,
      },
      userId: staffUser.id,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error saving departure record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save departure record' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const staffUser = await getCurrentUser();
    if (!staffUser) {
      return NextResponse.json({ success: false, error: 'Staff authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Departure Record ID is required' }, { status: 400 });
    }

    const dataToUpdate: any = {
      managedById: staffUser.id,
    };

    if (updates.airline !== undefined) dataToUpdate.airline = updates.airline;
    if (updates.flightNumber !== undefined) dataToUpdate.flightNumber = updates.flightNumber;
    if (updates.ticketNumber !== undefined) dataToUpdate.ticketNumber = updates.ticketNumber;
    if (updates.departureDate !== undefined) dataToUpdate.departureDate = new Date(updates.departureDate);
    if (updates.departureAirport !== undefined) dataToUpdate.departureAirport = updates.departureAirport;
    if (updates.destinationAirport !== undefined) dataToUpdate.destinationAirport = updates.destinationAirport;
    if (updates.transitAirports !== undefined) dataToUpdate.transitAirports = updates.transitAirports;
    if (updates.reportingTime !== undefined) {
      dataToUpdate.reportingTime = updates.reportingTime ? new Date(updates.reportingTime) : null;
    }
    if (updates.reportingInstructions !== undefined) dataToUpdate.reportingInstructions = updates.reportingInstructions;
    if (updates.pnrNumber !== undefined) dataToUpdate.pnrNumber = updates.pnrNumber;
    if (updates.status !== undefined) dataToUpdate.status = updates.status;

    const record = await prisma.departureRecord.update({
      where: { id },
      data: dataToUpdate,
      include: {
        applicant: { select: { fullName: true, applicantNumber: true } },
        application: { select: { applicationCode: true } },
      },
    });

    await createAuditLog({
      action: 'DEPARTURE_RECORD_UPDATED',
      entity: 'DepartureRecord',
      entityId: record.id,
      metadata: { updates, status: record.status },
      userId: staffUser.id,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error updating departure record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update departure record' },
      { status: 500 }
    );
  }
}
