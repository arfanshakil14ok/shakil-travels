import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getCurrentApplicant } from '@/lib/portal-auth';
import { storage } from '@/lib/storage';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    // Dual authorization check:
    // 1. Staff user with DOCUMENT_VIEW permission
    // 2. Or the candidate who owns this document
    let isAuthorized = false;
    const staffUser = await getCurrentUser();
    if (staffUser && (staffUser.role.name === 'SUPER_ADMIN' || staffUser.permissions.includes('DOCUMENT_VIEW'))) {
      isAuthorized = true;
    } else {
      const applicant = await getCurrentApplicant();
      if (applicant && document.applicantId === applicant.id) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Access denied: You do not have authorization to download this document' },
        { status: 403 }
      );
    }

    // 1. Attempt retrieval from configured storage provider (S3 cloud storage or private disk)
    try {
      const fileBuffer = await storage.getFile(document.filePath);
      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': document.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(document.fileName)}"`,
        },
      });
    } catch {
      // 2. Fallback: local disk path resolution with directory traversal prevention
      let fullPath = path.join(process.cwd(), 'public', document.filePath);
      if (!existsSync(fullPath)) {
        fullPath = path.join(process.cwd(), document.filePath);
      }

      const normalized = path.normalize(fullPath);
      if (!normalized.startsWith(process.cwd())) {
        return NextResponse.json(
          { success: false, error: 'Invalid file path: path traversal detected' },
          { status: 400 }
        );
      }

      if (existsSync(normalized)) {
        const fileBuffer = await readFile(normalized);
        return new NextResponse(new Uint8Array(fileBuffer), {
          status: 200,
          headers: {
            'Content-Type': document.mimeType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(document.fileName)}"`,
          },
        });
      }
    }

    // If file is an external cloud URL, redirect safely
    if (document.filePath.startsWith('http://') || document.filePath.startsWith('https://')) {
      return NextResponse.redirect(document.filePath);
    }

    // Fallback: return file metadata
    return NextResponse.json({
      success: true,
      data: {
        fileName: document.fileName,
        filePath: document.filePath,
        fileType: document.mimeType,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error downloading document:', error);
    return NextResponse.json({ success: false, error: 'Failed to download document' }, { status: 500 });
  }
}
