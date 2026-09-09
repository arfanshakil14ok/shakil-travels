import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';
import { validateDocumentFile, storage } from '@/lib/storage';
import { createAuditLog } from '@/lib/audit';
import crypto from 'crypto';
import path from 'path';
import { z } from 'zod';

const createDocumentJsonSchema = z.object({
  applicationId: z.string().optional().nullable(),
  documentTypeId: z.string().min(1, 'Document type is required'),
  fileName: z.string().min(1, 'File name is required'),
  filePath: z.string().min(1, 'File path is required'),
  fileUrl: z.string().optional().nullable(),
  fileSize: z.number().int().min(1),
  mimeType: z.string().min(1),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  passportNumber: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const applicant = await requireApplicantAuth();

    const [documents, documentTypes] = await Promise.all([
      prisma.document.findMany({
        where: { applicantId: applicant.id },
        include: {
          documentType: { select: { id: true, name: true, code: true, isRequired: true } },
          application: { select: { id: true, applicationCode: true, job: { select: { title: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.documentType.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        documents,
        documentTypes,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal documents error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const applicant = await requireApplicantAuth();
    const contentType = request.headers.get('content-type') || '';

    let documentTypeId = '';
    let applicationId: string | null = null;
    let fileName = '';
    let filePath = '';
    let fileSize = 0;
    let mimeType = '';
    let expiryDate: string | null = null;
    let notes: string | null = null;
    let passportNumber: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      documentTypeId = (formData.get('documentTypeId') as string) || '';
      applicationId = (formData.get('applicationId') as string) || null;
      expiryDate = (formData.get('expiryDate') as string) || null;
      notes = (formData.get('notes') as string) || null;
      passportNumber = (formData.get('passportNumber') as string) || null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
      }

      if (!documentTypeId) {
        return NextResponse.json({ success: false, error: 'Document type is required' }, { status: 400 });
      }

      // Validate size and MIME
      const validation = validateDocumentFile(file.size, file.type);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }

      fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      fileSize = file.size;
      mimeType = file.type;

      // Generate secure private storage key: documents/{applicantId}/{timestamp}-{hex}{ext}
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

      filePath = storageKey;
    } else {
      // JSON body fallback
      const body = await request.json();
      const parsed = createDocumentJsonSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const d = parsed.data;
      const validation = validateDocumentFile(d.fileSize, d.mimeType);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }

      documentTypeId = d.documentTypeId;
      applicationId = d.applicationId || null;
      fileName = d.fileName;
      filePath = d.filePath;
      fileSize = d.fileSize;
      mimeType = d.mimeType;
      expiryDate = d.expiryDate || null;
      notes = d.notes || null;
      passportNumber = d.passportNumber || null;
    }

    // Verify documentType exists
    const docType = await prisma.documentType.findUnique({
      where: { id: documentTypeId },
    });
    if (!docType) {
      return NextResponse.json({ success: false, error: 'Invalid document type' }, { status: 400 });
    }

    // If applicationId is provided, verify applicant owns it
    if (applicationId) {
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
      });
      if (!app || app.applicantId !== applicant.id) {
        return NextResponse.json({ success: false, error: 'Invalid application ID' }, { status: 403 });
      }
    }

    // Versioning: Check previous versions for this applicant & document type
    const previousVersions = await prisma.document.findMany({
      where: {
        applicantId: applicant.id,
        documentTypeId,
      },
      orderBy: { version: 'desc' },
      take: 1,
    });

    const nextVersion = previousVersions.length > 0 ? (previousVersions[0].version || 1) + 1 : 1;

    // Archive previous versions as not latest
    if (previousVersions.length > 0) {
      await prisma.document.updateMany({
        where: {
          applicantId: applicant.id,
          documentTypeId,
          isLatest: true,
        },
        data: {
          isLatest: false,
        },
      });
    }

    const newDoc = await prisma.document.create({
      data: {
        applicantId: applicant.id,
        applicationId: applicationId || null,
        documentTypeId,
        fileName,
        filePath,
        fileUrl: '', // Updated immediately below
        fileSize,
        mimeType,
        version: nextVersion,
        isLatest: true,
        status: 'PENDING',
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes: notes || null,
      },
      include: {
        documentType: true,
      },
    });

    // Set secure authorized download URL
    const fileDownloadUrl = `/api/documents/${newDoc.id}/download`;
    await prisma.document.update({
      where: { id: newDoc.id },
      data: { fileUrl: fileDownloadUrl },
    });
    newDoc.fileUrl = fileDownloadUrl;

    // If document is PASSPORT, update applicant passport fields
    if (docType.code.toUpperCase() === 'PASSPORT' || passportNumber) {
      await prisma.applicant.update({
        where: { id: applicant.id },
        data: {
          passportAvailable: true,
          ...(passportNumber && { passportNumber }),
          ...(expiryDate && { passportExpiry: new Date(expiryDate) }),
        },
      });
    }

    // Record DOCUMENT_UPLOADED in AuditLog
    await createAuditLog({
      actorUserId: applicant.id,
      actorType: 'APPLICANT',
      applicantId: applicant.id,
      action: 'DOCUMENT_UPLOADED',
      entity: 'DOCUMENT',
      entityId: newDoc.id,
      description: `Applicant uploaded document: ${fileName} (${docType.name})`,
      metadata: {
        fileName,
        documentType: docType.name,
        fileSize,
        mimeType,
        version: nextVersion,
      },
    });

    // In-app confirmation
    await prisma.notification.create({
      data: {
        applicantId: applicant.id,
        type: 'DOCUMENT',
        title: 'Document Uploaded',
        message: `Your document "${fileName}" (${docType.name}) has been uploaded and queued for verification.`,
        link: '/portal/documents',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      data: newDoc,
    }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Upload document error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload document' }, { status: 500 });
  }
}
