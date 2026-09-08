import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';
import { storage } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('DOCUMENT_VIEW');
    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        documentType: true,
        applicant: true,
        application: true,
        verifiedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: document });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('DOCUMENT_DELETE');
    const { id } = await params;

    const existing = await prisma.document.findUnique({
      where: { id },
      include: { applicant: true, documentType: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    await prisma.document.delete({ where: { id } });

    // Clean up physical file in storage (safe if already deleted or local test path)
    try {
      if (existing.filePath) {
        await storage.deleteFile(existing.filePath);
      }
    } catch {
      // Graceful ignore if file already missing
    }

    await createAuditLog({
      userId: currentUser.id,
      action: 'DOCUMENT_DELETE',
      entity: 'DOCUMENT',
      entityId: id,
      oldValue: {
        fileName: existing.fileName,
        applicant: existing.applicant.fullName,
        documentType: existing.documentType.name,
      },
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to delete document' }, { status: 500 });
  }
}
