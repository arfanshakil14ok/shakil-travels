import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { verifyDocumentSchema } from '@/lib/validations/document';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('DOCUMENT_VERIFY');
    const { id } = await params;
    const body = await request.json();

    const parsed = verifyDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, rejectionReason } = parsed.data;

    const existing = await prisma.document.findUnique({
      where: { id },
      include: {
        documentType: true,
        applicant: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        status: status === 'VERIFIED' ? 'VERIFIED' : 'REJECTED',
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        verifiedById: currentUser.id,
        verifiedAt: new Date(),
      },
      include: {
        documentType: true,
        applicant: { select: { id: true, fullName: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      applicantId: existing.applicantId,
      actorType: 'STAFF',
      action: status === 'VERIFIED' ? 'DOCUMENT_VERIFY' : 'DOCUMENT_REJECT',
      entity: 'DOCUMENT',
      entityId: id,
      description: status === 'VERIFIED'
        ? `Document verified by ${currentUser.name}: ${existing.documentType.name} (${existing.fileName})`
        : `Document rejected by ${currentUser.name}: ${existing.documentType.name}. Reason: ${rejectionReason}`,
      newValue: {
        status,
        rejectionReason,
        verifiedBy: currentUser.name,
        documentType: existing.documentType.name,
      },
    });

    // Notify candidate in portal
    await prisma.notification.create({
      data: {
        applicantId: existing.applicantId,
        type: status === 'VERIFIED' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
        title: status === 'VERIFIED' ? 'ডকুমেন্ট যাচাই সম্পন্ন' : 'ডকুমেন্ট গৃহীত হয়নি',
        message: status === 'VERIFIED'
          ? `আপনার আপলোডকৃত "${existing.documentType.name}" সফলভাবে যাচাই করা হয়েছে।`
          : `আপনার আপলোডকৃত "${existing.documentType.name}" গৃহীত হয়নি। কারণ: ${rejectionReason}। অনুগ্রহ করে সঠিক ডকুমেন্ট পুনরায় আপলোড করুন।`,
        link: '/portal/documents',
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: status === 'VERIFIED' ? 'Document verified successfully' : 'Document marked as rejected',
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error verifying document:', error);
    return NextResponse.json({ success: false, error: 'Failed to process document verification' }, { status: 500 });
  }
}
