import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/rbac';
import { documentRejectSchema } from '@/lib/validations/processing';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id, docId } = await params;
    const body = await request.json();

    const isAuthorized =
      hasPermission(currentUser, 'DOCUMENT_VERIFY') ||
      ['SUPER_ADMIN', 'ADMIN', 'DOCUMENT_OFFICER', 'RECRUITMENT_MANAGER'].includes(
        currentUser.role.name
      );

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Requires DOCUMENT_VERIFY permission' },
        { status: 403 }
      );
    }

    const parsed = documentRejectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { rejectionReason } = parsed.data;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      include: { applicant: true },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    const requirement = await prisma.processingDocumentRequirement.findFirst({
      where: { id: docId, processingCaseId: pc.id },
    });

    if (!requirement) {
      return NextResponse.json({ success: false, error: 'Document requirement not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const rejectedReq = await tx.processingDocumentRequirement.update({
        where: { id: requirement.id },
        data: {
          status: 'REJECTED',
          rejectionReason,
          verifiedById: null,
          verifiedAt: null,
        },
      });

      if (requirement.documentId) {
        await tx.document.update({
          where: { id: requirement.documentId },
          data: {
            status: 'REJECTED',
            rejectionReason,
          },
        });
      }

      // Notify candidate
      await tx.notification.create({
        data: {
          applicantId: pc.applicantId,
          type: 'DOCUMENT',
          title: `ডকুমেন্ট পুনঃআপলোড প্রয়োজন (${requirement.title})`,
          message: `আপনার "${requirement.title}" গৃহীত হয়নি। কারণ: ${rejectionReason}। অনুগ্রহ করে সঠিক ডকুমেন্ট পুনরায় আপলোড করুন।`,
          link: `/portal/processing/${pc.id}`,
        },
      });

      return rejectedReq;
    });

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'DOCUMENT_REJECT',
      entity: 'DOCUMENT_REQUIREMENT',
      entityId: requirement.id,
      description: `Rejected document requirement "${requirement.title}" for case ${pc.processingCode}: ${rejectionReason}`,
      metadata: { processingCaseId: pc.id, rejectionReason },
    });

    return NextResponse.json({
      success: true,
      message: `Document "${requirement.title}" rejected`,
      data: updated,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error rejecting processing document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reject processing document' },
      { status: 500 }
    );
  }
}
