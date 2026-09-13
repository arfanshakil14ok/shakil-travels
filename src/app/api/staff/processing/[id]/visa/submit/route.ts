import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { visaSubmitSchema } from '@/lib/validations/processing';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const parsed = visaSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { country, visaType, applicationNumber, sponsorName, sponsorReference, submissionDate, notes } = parsed.data;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      include: {
        applicant: true,
        job: { include: { country: true } },
        employer: true,
      },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    if (pc.overallStatus === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Cannot submit visa for a cancelled case' }, { status: 400 });
    }

    const subDate = submissionDate ? new Date(submissionDate) : new Date();

    const visaCase = await prisma.visaCase.upsert({
      where: { processingCaseId: pc.id },
      create: {
        processingCaseId: pc.id,
        candidateId: pc.applicantId,
        country: country || pc.job?.country?.name || 'Saudi Arabia',
        visaType: visaType || 'EMPLOYMENT_VISA',
        applicationNumber: applicationNumber || null,
        sponsorName: sponsorName || pc.employer?.companyName || null,
        sponsorReference: sponsorReference || null,
        submissionDate: subDate,
        status: 'SUBMITTED',
        notes: notes || null,
      },
      update: {
        country: country || undefined,
        visaType: visaType || undefined,
        applicationNumber: applicationNumber || undefined,
        sponsorName: sponsorName || undefined,
        sponsorReference: sponsorReference || undefined,
        submissionDate: subDate,
        status: 'SUBMITTED',
        notes: notes || undefined,
      },
    });

    const previousStage = pc.currentStage;
    const newStage = 'VISA_SUBMITTED';

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
          reason: 'Visa application submitted to embassy/consulate',
          notes: notes || `Application No: ${applicationNumber || 'N/A'}`,
        },
      }),
      prisma.notification.create({
        data: {
          applicantId: pc.applicantId,
          title: 'Visa Application Submitted / ভিসা আবেদন জমা দেওয়া হয়েছে',
          message: `Your visa application for ${pc.job.title} has been submitted to the embassy.`,
          type: 'INFO',
          link: `/portal/processing/${pc.id}`,
        },
      }),
    ]);

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'UPDATE',
      entity: 'VISA_CASE',
      entityId: visaCase.id,
      description: `Submitted visa application for case ${pc.processingCode}`,
      metadata: { processingCaseId: pc.id, applicationNumber, submissionDate: subDate },
    });

    return NextResponse.json({
      success: true,
      message: 'Visa application submitted successfully',
      data: visaCase,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error submitting visa:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit visa' }, { status: 500 });
  }
}
