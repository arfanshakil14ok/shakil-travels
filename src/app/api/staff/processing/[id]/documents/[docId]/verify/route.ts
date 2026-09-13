import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/rbac';
import { documentVerifySchema } from '@/lib/validations/processing';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id, docId } = await params;

    // Check authorization: DOCUMENT_VERIFY or admin/manager/officer
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

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // body is optional
    }

    const parsed = documentVerifySchema.safeParse(body);
    const verificationNote = parsed.success ? parsed.data.verificationNote : null;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
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
      const verifiedReq = await tx.processingDocumentRequirement.update({
        where: { id: requirement.id },
        data: {
          status: 'VERIFIED',
          verifiedById: currentUser.id,
          verifiedByRole: currentUser.role.name,
          verifiedAt: new Date(),
          verificationNote: verificationNote || null,
          rejectionReason: null,
        },
      });

      if (requirement.documentId) {
        await tx.document.update({
          where: { id: requirement.documentId },
          data: {
            status: 'VERIFIED',
            verifiedById: currentUser.id,
            verifiedAt: new Date(),
          },
        });
      }

      return verifiedReq;
    });

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'DOCUMENT_VERIFY',
      entity: 'DOCUMENT_REQUIREMENT',
      entityId: requirement.id,
      description: `Verified document requirement "${requirement.title}" for case ${pc.processingCode}`,
      metadata: { processingCaseId: pc.id, verificationNote },
    });

    return NextResponse.json({
      success: true,
      message: `Document "${requirement.title}" verified successfully`,
      data: updated,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error verifying processing document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify processing document' },
      { status: 500 }
    );
  }
}
