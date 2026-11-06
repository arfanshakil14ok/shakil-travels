import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getCurrentApplicant } from '@/lib/portal-auth';
import { hasPermission } from '@/lib/rbac';
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

    const staffUser = await getCurrentUser(request);
    const applicant = await getCurrentApplicant(request);

    // 1. Unauthenticated requests must return HTTP 401
    if (!staffUser && !applicant) {
      return NextResponse.json(
        { success: false, error: 'Unauthenticated: Please log in to download documents' },
        { status: 401 }
      );
    }

    // 2. Staff authorization: must have explicit DOCUMENT_VIEW permission (or SUPER_ADMIN)
    if (staffUser) {
      const canView = hasPermission(staffUser, 'DOCUMENT_VIEW');
      if (!canView) {
        return NextResponse.json(
          { success: false, error: 'Access denied: Requires DOCUMENT_VIEW permission' },
          { status: 403 }
        );
      }
    } else if (applicant) {
      // 3. Candidate authorization: candidate can download only their own documents
      if (document.applicantId !== applicant.id) {
        return NextResponse.json(
          { success: false, error: 'Access denied: You can only download your own documents' },
          { status: 403 }
        );
      }
    }

    // 1. Direct Base64 Data URI decoding (100% reliable across serverless instances)
    if (document.filePath && document.filePath.startsWith('data:')) {
      const commaIdx = document.filePath.indexOf(',');
      if (commaIdx !== -1) {
        const metaPart = document.filePath.slice(0, commaIdx);
        const dataPart = document.filePath.slice(commaIdx + 1);
        const mimeMatch = metaPart.match(/data:([^;]+)/);
        const mime = mimeMatch ? mimeMatch[1] : (document.mimeType || 'application/octet-stream');
        const buffer = Buffer.from(dataPart, 'base64');

        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': mime,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(document.fileName)}"`,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          },
        });
      }
    }

    // 2. External Cloud URL redirect (S3/CDN)
    if (document.filePath.startsWith('http://') || document.filePath.startsWith('https://')) {
      return NextResponse.redirect(document.filePath);
    }

    // 3. Attempt retrieval from configured storage provider (S3 or local disk)
    try {
      const fileBuffer = await storage.getFile(document.filePath);
      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': document.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(document.fileName)}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } catch {
      // 4. Fallback: local disk path resolution across public, cwd, and /tmp
      const candidatePaths = [
        path.join(process.cwd(), 'public', document.filePath),
        path.join(process.cwd(), document.filePath),
        path.join('/tmp', document.filePath),
        path.join('/tmp', 'uploads', document.filePath),
        path.join('/tmp', 'uploads/private', document.filePath),
      ];

      for (const candidate of candidatePaths) {
        try {
          if (existsSync(candidate)) {
            const fileBuffer = await readFile(candidate);
            return new NextResponse(new Uint8Array(fileBuffer), {
              status: 200,
              headers: {
                'Content-Type': document.mimeType || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(document.fileName)}"`,
                'Content-Length': fileBuffer.length.toString(),
              },
            });
          }
        } catch {}
      }
    }

    // If file could not be found anywhere
    return NextResponse.json(
      {
        success: false,
        error: 'The requested document file could not be located in storage. Please ask the candidate to re-upload.',
      },
      { status: 404 }
    );
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error downloading document:', error);
    return NextResponse.json({ success: false, error: 'Failed to download document' }, { status: 500 });
  }
}
