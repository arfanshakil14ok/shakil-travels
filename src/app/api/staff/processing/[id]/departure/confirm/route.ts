import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      include: {
        applicant: true,
        job: true,
        departureCase: true,
        travelTicket: true,
      },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    if (pc.overallStatus === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Cannot confirm departure for a cancelled case' }, { status: 400 });
    }

    if (pc.currentStage !== 'DEPARTURE_READY' && !body.forceOverride) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot mark DEPARTED. Candidate must be in DEPARTURE_READY stage (Current: ${pc.currentStage}).`,
        },
        { status: 400 }
      );
    }

    const departedAt = body.departedAt ? new Date(body.departedAt) : new Date();

    const departureCase = await prisma.departureCase.upsert({
      where: { processingCaseId: pc.id },
      create: {
        processingCaseId: pc.id,
        candidateId: pc.applicantId,
        departureDate: pc.travelTicket?.departureDate || new Date(),
        flightNumber: pc.travelTicket?.flightNumber || 'BG-339',
        destination: pc.travelTicket?.arrivalAirport || 'Saudi Arabia',
        departureStatus: 'DEPARTED',
        confirmedAt: departedAt,
        confirmedById: currentUser.id,
        notes: body.notes || null,
      },
      update: {
        departureStatus: 'DEPARTED',
        confirmedAt: departedAt,
        confirmedById: currentUser.id,
        notes: body.notes || undefined,
      },
    });

    const previousStage = pc.currentStage;
    const newStage = 'DEPARTED';

    await prisma.$transaction([
      prisma.recruitmentProcessingCase.update({
        where: { id: pc.id },
        data: { currentStage: newStage },
      }),
      prisma.processingStatusHistory.create({
        data: {
          processingCaseId: pc.id,
          fromStage: previousStage,
          toStage: newStage,
          changedById: currentUser.id,
          reason: 'Candidate confirmed departed from airport',
          notes: body.notes || `Departed at ${departedAt.toISOString()}`,
        },
      }),
      prisma.notification.create({
        data: {
          applicantId: pc.applicantId,
          title: 'Safe Travels! Departure Confirmed / শুভ যাত্রা!',
          message: `Your overseas departure for ${pc.job.title} has been confirmed. Shakil Travels wishes you safety and great success!`,
          type: 'SUCCESS',
          link: `/portal/processing/${pc.id}`,
        },
      }),
    ]);

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'UPDATE',
      entity: 'DEPARTURE_CASE',
      entityId: departureCase.id,
      description: `Confirmed candidate departure for case ${pc.processingCode}`,
      metadata: { processingCaseId: pc.id, departedAt },
    });

    return NextResponse.json({
      success: true,
      message: 'Candidate departure confirmed successfully',
      data: departureCase,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error confirming departure:', error);
    return NextResponse.json({ success: false, error: 'Failed to confirm departure' }, { status: 500 });
  }
}
