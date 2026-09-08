import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';
import { validateDocumentFile } from '@/lib/storage';
import { z } from 'zod';

const createDocumentSchema = z.object({
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
    const body = await request.json();

    const parsed = createDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate size (max 10MB) and allowed MIME types (PDF, JPEG, PNG, WEBP)
    const validation = validateDocumentFile(data.fileSize, data.mimeType);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    // Verify documentType exists
    const docType = await prisma.documentType.findUnique({
      where: { id: data.documentTypeId },
    });
    if (!docType) {
      return NextResponse.json({ success: false, error: 'Invalid document type' }, { status: 400 });
    }

    // If applicationId is provided, verify applicant owns it
    if (data.applicationId) {
      const app = await prisma.application.findUnique({
        where: { id: data.applicationId },
      });
      if (!app || app.applicantId !== applicant.id) {
        return NextResponse.json({ success: false, error: 'Invalid application ID' }, { status: 403 });
      }
    }

    // Versioning: Check previous versions for this applicant & document type
    const previousVersions = await prisma.document.findMany({
      where: {
        applicantId: applicant.id,
        documentTypeId: data.documentTypeId,
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
          documentTypeId: data.documentTypeId,
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
        applicationId: data.applicationId || null,
        documentTypeId: data.documentTypeId,
        fileName: data.fileName,
        filePath: data.filePath,
        fileUrl: '', // Updated immediately below
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        version: nextVersion,
        isLatest: true,
        status: 'UPLOADED',
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        notes: data.notes || null,
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
    if (docType.code.toUpperCase() === 'PASSPORT' || data.passportNumber) {
      await prisma.applicant.update({
        where: { id: applicant.id },
        data: {
          passportAvailable: true,
          ...(data.passportNumber && { passportNumber: data.passportNumber }),
          ...(data.expiryDate && { passportExpiry: new Date(data.expiryDate) }),
        },
      });
    }

    // In-app confirmation
    await prisma.notification.create({
      data: {
        applicantId: applicant.id,
        type: 'DOCUMENT',
        title: 'Document Uploaded',
        message: `Your document "${data.fileName}" (${docType.name}) has been uploaded and queued for verification.`,
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
