import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';
import { validateDocumentFile, storage } from '@/lib/storage';
import { createAuditLog } from '@/lib/audit';
import crypto from 'crypto';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const applicant = await requireApplicantAuth();
    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        documentType: true,
        application: {
          select: {
            id: true,
            applicationCode: true,
            job: { select: { title: true } },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    // IDOR protection: candidate can only view their own document
    if (document.applicantId !== applicant.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied: You do not own this document' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: document });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const applicant = await requireApplicantAuth();
    const { id } = await params;

    const existing = await prisma.document.findUnique({
      where: { id },
      include: { documentType: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    // IDOR protection
    if (existing.applicantId !== applicant.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied: You do not own this document' },
        { status: 403 }
      );
    }

    // Restriction: Verified documents cannot be replaced
    if (existing.status === 'VERIFIED') {
      return NextResponse.json(
        {
          success: false,
          error: 'যাচাইকৃত নথি পরিবর্তন করা যাবে না / Verified documents cannot be replaced',
        },
        { status: 400 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let newFileName = existing.fileName;
    let newFilePath = existing.filePath;
    let newFileSize = existing.fileSize;
    let newMimeType = existing.mimeType;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No replacement file provided' }, { status: 400 });
      }

      const validation = validateDocumentFile(file.size, file.type);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }

      newFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      newFileSize = file.size;
      newMimeType = file.type;

      const rawExt = path.extname(file.name).toLowerCase();
      const safeExt = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'].includes(rawExt)
        ? rawExt
        : file.type === 'application/pdf'
        ? '.pdf'
        : '.jpg';

      const storageKey = `documents/${applicant.id}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await storage.saveFile(storageKey, buffer, {
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        uploadedAt: new Date(),
        applicantId: applicant.id,
      });

      // Attempt to clean up old file
      try {
        await storage.deleteFile(existing.filePath);
      } catch {
        // Ignore deletion failure if old file is missing
      }

      newFilePath = storageKey;
    } else {
      const body = await request.json();
      if (body.filePath) newFilePath = body.filePath;
      if (body.fileName) newFileName = body.fileName;
      if (body.fileSize) newFileSize = body.fileSize;
      if (body.mimeType) newMimeType = body.mimeType;
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        fileName: newFileName,
        filePath: newFilePath,
        fileSize: newFileSize,
        mimeType: newMimeType,
        status: 'PENDING',
        rejectionReason: null,
        version: (existing.version || 1) + 1,
      },
      include: { documentType: true },
    });

    await createAuditLog({
      actorUserId: applicant.id,
      actorType: 'APPLICANT',
      applicantId: applicant.id,
      action: 'DOCUMENT_REPLACED',
      entity: 'DOCUMENT',
      entityId: id,
      description: `Applicant replaced document: ${newFileName} (${existing.documentType.name})`,
      oldValue: { fileName: existing.fileName, status: existing.status, version: existing.version },
      newValue: { fileName: newFileName, status: 'PENDING', version: updated.version },
    });

    return NextResponse.json({
      success: true,
      message: 'Document replaced successfully and queued for re-verification',
      data: updated,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Replace document error:', error);
    return NextResponse.json({ success: false, error: 'Failed to replace document' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const applicant = await requireApplicantAuth();
    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: { documentType: true },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    // IDOR protection
    if (document.applicantId !== applicant.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied: You do not own this document' },
        { status: 403 }
      );
    }

    // Restriction: Verified documents cannot be deleted
    if (document.status === 'VERIFIED') {
      return NextResponse.json(
        {
          success: false,
          error: 'যাচাইকৃত নথি মুছে ফেলা যাবে না / Verified documents cannot be deleted',
        },
        { status: 400 }
      );
    }

    // Delete physical file from storage
    try {
      await storage.deleteFile(document.filePath);
    } catch {
      // Continue even if physical file is missing
    }

    // Delete record from database
    await prisma.document.delete({
      where: { id },
    });

    await createAuditLog({
      actorUserId: applicant.id,
      actorType: 'APPLICANT',
      applicantId: applicant.id,
      action: 'DOCUMENT_DELETED',
      entity: 'DOCUMENT',
      entityId: id,
      description: `Applicant deleted document: ${document.fileName} (${document.documentType.name})`,
      oldValue: { fileName: document.fileName, status: document.status },
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Delete document error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete document' }, { status: 500 });
  }
}
