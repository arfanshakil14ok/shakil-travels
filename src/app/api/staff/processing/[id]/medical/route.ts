import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { medicalScheduleSchema } from '@/lib/validations/processing';
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

    const medicalCase = await prisma.medicalCase.findUnique({
      where: { processingCaseId: pc.id },
      include: {
        medicalCenter: true,
        reportDocument: true,
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: medicalCase });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching medical case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch medical case' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const parsed = medicalScheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      medicalCenterId,
      medicalCenterName,
      appointmentDate,
      appointmentTime,
      medicalType,
      gamcaNumber,
      appointmentNotes,
    } = parsed.data;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      include: { applicant: true },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    let centerName = medicalCenterName;
    if (medicalCenterId && !centerName) {
      const center = await prisma.medicalCenter.findUnique({ where: { id: medicalCenterId } });
      if (center) centerName = center.name;
    }

    const apptDateObj = new Date(appointmentDate);

    const updated = await prisma.$transaction(async (tx) => {
      const medCase = await tx.medicalCase.upsert({
        where: { processingCaseId: pc.id },
        create: {
          processingCaseId: pc.id,
          candidateId: pc.applicantId,
          medicalCenterId: medicalCenterId || null,
          medicalCenterName: centerName || 'GAMCA Approved Medical Center',
          appointmentDate: apptDateObj,
          appointmentTime: appointmentTime || '10:00 AM',
          medicalType: medicalType || 'GAMCA',
          gamcaNumber: gamcaNumber || null,
          appointmentNotes: appointmentNotes || null,
          status: 'SCHEDULED',
          result: 'PENDING',
        },
        update: {
          medicalCenterId: medicalCenterId || null,
          medicalCenterName: centerName || undefined,
          appointmentDate: apptDateObj,
          appointmentTime: appointmentTime || undefined,
          medicalType: medicalType || undefined,
          gamcaNumber: gamcaNumber || undefined,
          appointmentNotes: appointmentNotes || undefined,
          status: 'SCHEDULED',
        },
        include: {
          medicalCenter: true,
        },
      });

      // Advance stage to MEDICAL_SCHEDULED
      await tx.recruitmentProcessingCase.update({
        where: { id: pc.id },
        data: { currentStage: 'MEDICAL_SCHEDULED' },
      });

      await tx.processingStatusHistory.create({
        data: {
          processingCaseId: pc.id,
          fromStage: pc.currentStage,
          toStage: 'MEDICAL_SCHEDULED',
          changedById: currentUser.id,
          changedByRole: currentUser.role.name,
          reason: 'Medical Appointment Scheduled',
          notes: `Scheduled at ${centerName} on ${apptDateObj.toLocaleDateString()} (${appointmentTime || '10:00 AM'})`,
        },
      });

      // Notify candidate
      await tx.notification.create({
        data: {
          applicantId: pc.applicantId,
          type: 'APPLICATION',
          title: 'মেডিকেল অ্যাপয়েন্টমেন্ট নির্ধারিত হয়েছে',
          message: `আপনার গামকা মেডিকেল পরীক্ষার তারিখ: ${apptDateObj.toLocaleDateString()} (${appointmentTime || '10:00 AM'})। কেন্দ্র: ${centerName}।`,
          link: `/portal/processing/${pc.id}`,
        },
      });

      return medCase;
    });

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'UPDATE',
      entity: 'MEDICAL_CASE',
      entityId: updated.id,
      description: `Scheduled medical appointment for case ${pc.processingCode} on ${apptDateObj.toLocaleDateString()}`,
      metadata: { processingCaseId: pc.id, appointmentDate: apptDateObj },
    });

    return NextResponse.json({
      success: true,
      message: 'Medical appointment scheduled successfully',
      data: updated,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error scheduling medical appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to schedule medical appointment' },
      { status: 500 }
    );
  }
}
