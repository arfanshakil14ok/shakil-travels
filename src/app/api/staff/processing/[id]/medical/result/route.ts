import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { medicalResultSchema } from '@/lib/validations/processing';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const parsed = medicalResultSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { result, fitnessExpiryDate, gamcaNumber, reportDocumentId, resultNotes } = parsed.data;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      include: { applicant: true, medicalCase: true },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    let targetStage = pc.currentStage;
    if (result === 'FIT' || result === 'CONDITIONALLY_FIT') {
      targetStage = 'MEDICAL_PASSED';
    } else if (result === 'UNFIT') {
      targetStage = 'MEDICAL_FAILED';
    }

    const updated = await prisma.$transaction(async (tx) => {
      const medCase = await tx.medicalCase.upsert({
        where: { processingCaseId: pc.id },
        create: {
          processingCaseId: pc.id,
          candidateId: pc.applicantId,
          status: 'COMPLETED',
          result,
          gamcaNumber: gamcaNumber || null,
          fitnessExpiryDate: fitnessExpiryDate ? new Date(fitnessExpiryDate) : null,
          reportDocumentId: reportDocumentId || null,
          resultNotes: resultNotes || null,
          conductedAt: new Date(),
          reviewedById: currentUser.id,
          reviewedAt: new Date(),
        },
        update: {
          status: 'COMPLETED',
          result,
          gamcaNumber: gamcaNumber || undefined,
          fitnessExpiryDate: fitnessExpiryDate ? new Date(fitnessExpiryDate) : undefined,
          reportDocumentId: reportDocumentId || undefined,
          resultNotes: resultNotes || undefined,
          conductedAt: new Date(),
          reviewedById: currentUser.id,
          reviewedAt: new Date(),
        },
      });

      // Update processing stage
      await tx.recruitmentProcessingCase.update({
        where: { id: pc.id },
        data: { currentStage: targetStage },
      });

      await tx.processingStatusHistory.create({
        data: {
          processingCaseId: pc.id,
          fromStage: pc.currentStage,
          toStage: targetStage,
          changedById: currentUser.id,
          changedByRole: currentUser.role.name,
          reason: `Medical Examination Result: ${result}`,
          notes: resultNotes || `Medical outcome officially certified as ${result}`,
        },
      });

      // Candidate Notification
      const isFit = result === 'FIT' || result === 'CONDITIONALLY_FIT';
      await tx.notification.create({
        data: {
          applicantId: pc.applicantId,
          type: 'APPLICATION',
          title: isFit ? 'মেডিকেল ফিটনেস উত্তীর্ণ' : 'মেডিকেল রিপোর্ট প্রকাশ',
          message: isFit
            ? `অভিনন্দন! আপনার গামকা মেডিকেল পরীক্ষার ফলাফল: ${result} (উত্তীর্ণ)। পরবর্তী ধাপে ভিসা প্রসেসিং শুরু হবে।`
            : `আপনার মেডিকেল পরীক্ষার ফলাফল: ${result}। বিস্তারিত তথ্যের জন্য আমাদের অফিসে যোগাযোগ করুন।`,
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
      description: `Certified medical examination result "${result}" for processing case ${pc.processingCode}`,
      metadata: { processingCaseId: pc.id, result, targetStage },
    });

    return NextResponse.json({
      success: true,
      message: `Medical result recorded as ${result}. Stage moved to ${targetStage}.`,
      data: updated,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error recording medical result:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record medical result' },
      { status: 500 }
    );
  }
}
