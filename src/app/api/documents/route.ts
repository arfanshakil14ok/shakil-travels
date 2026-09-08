import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';
import { storage, validateDocumentFile } from '@/lib/storage';
import { sanitizeFileName } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('DOCUMENT_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const applicantId = searchParams.get('applicantId');
    const applicationId = searchParams.get('applicationId');
    const documentTypeId = searchParams.get('documentTypeId');
    const isVerified = searchParams.get('isVerified');
    const search = searchParams.get('search')?.trim();

    const where: any = {};
    if (applicantId && applicantId !== 'ALL') where.applicantId = applicantId;
    if (applicationId && applicationId !== 'ALL') where.applicationId = applicationId;
    if (documentTypeId && documentTypeId !== 'ALL') where.documentTypeId = documentTypeId;
    if (isVerified !== null && isVerified !== undefined && isVerified !== 'ALL') {
      where.status = isVerified === 'true' ? 'VERIFIED' : { not: 'VERIFIED' };
    }

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { documentNumber: { contains: search, mode: 'insensitive' } },
        { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
        { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        documentType: true,
        applicant: {
          select: { id: true, fullName: true, applicantNumber: true, phone: true },
        },
        application: {
          select: { id: true, applicationNumber: true, status: true, currentStage: true },
        },
        verifiedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: documents });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching documents:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('DOCUMENT_UPLOAD');
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const applicantId = formData.get('applicantId') as string;
    const documentTypeId = formData.get('documentTypeId') as string;
    const applicationId = (formData.get('applicationId') as string) || null;
    const expiryDateStr = formData.get('expiryDate') as string | null;
    const notes = formData.get('notes') as string | null;

    if (!file || !applicantId || !documentTypeId) {
      return NextResponse.json(
        { success: false, error: 'File, applicantId, and documentTypeId are required' },
        { status: 400 }
      );
    }

    const mimeType = file.type || 'application/octet-stream';
    const fileSize = file.size;

    // Validate size (max 10MB) and allowed MIME types (PDF, JPEG, PNG, WEBP)
    const validation = validateDocumentFile(fileSize, mimeType);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;
    const fileName = file.name;

    // Save file via secure storage abstraction (supports S3 and private local disk)
    const buffer = Buffer.from(await file.arrayBuffer());
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const safeName = sanitizeFileName(file.name);
    const storageKey = `documents/${applicantId}/${uniquePrefix}-${safeName}`;

    await storage.saveFile(storageKey, buffer, {
      originalName: file.name,
      mimeType,
      size: fileSize,
      uploadedAt: new Date(),
      applicantId,
      documentType: documentTypeId,
    });

    // Versioning: Check existing versions for this applicant & document type
    const previousVersions = await prisma.document.findMany({
      where: {
        applicantId,
        documentTypeId,
      },
      orderBy: { version: 'desc' },
      take: 1,
    });

    const nextVersion = previousVersions.length > 0 ? (previousVersions[0].version || 1) + 1 : 1;

    // Mark previous versions as not latest
    if (previousVersions.length > 0) {
      await prisma.document.updateMany({
        where: {
          applicantId,
          documentTypeId,
          isLatest: true,
        },
        data: {
          isLatest: false,
        },
      });
    }

    const document = await prisma.document.create({
      data: {
        applicantId,
        applicationId,
        documentTypeId,
        fileName,
        filePath: storageKey,
        fileUrl: '', // Updated immediately below
        mimeType,
        fileSize,
        version: nextVersion,
        isLatest: true,
        expiryDate,
        notes,
        status: 'UPLOADED',
        uploadedById: currentUser.id,
      },
      include: {
        documentType: true,
        applicant: { select: { id: true, fullName: true, applicantNumber: true } },
      },
    });

    // Secure authorized download route
    const downloadUrl = `/api/documents/${document.id}/download`;
    await prisma.document.update({
      where: { id: document.id },
      data: { fileUrl: downloadUrl },
    });
    document.fileUrl = downloadUrl;

    await createAuditLog({
      userId: currentUser.id,
      action: 'DOCUMENT_UPLOAD',
      entity: 'DOCUMENT',
      entityId: document.id,
      newValue: {
        applicantName: document.applicant.fullName,
        documentType: document.documentType.name,
        fileName: document.fileName,
        version: nextVersion,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: document,
        message: 'Document uploaded successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error uploading document:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload document' }, { status: 500 });
  }
}
