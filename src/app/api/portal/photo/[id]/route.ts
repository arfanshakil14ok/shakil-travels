import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseBase64Photo } from '@/lib/validations/photo';
import { storage } from '@/lib/storage';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const applicantId = resolvedParams?.id;

    if (!applicantId) {
      return new NextResponse('Applicant ID is required', { status: 400 });
    }

    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
      select: { id: true, profilePhoto: true, fullName: true },
    });

    if (!applicant) {
      return new NextResponse('Applicant not found', { status: 404 });
    }

    const photo = applicant.profilePhoto;

    // Helper to send image response
    const sendImageResponse = (buffer: Buffer | Uint8Array, mime: string) => {
      const bodyBytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      return new NextResponse(bodyBytes as any, {
        status: 200,
        headers: {
          'Content-Type': mime || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'Content-Length': buffer.length.toString(),
        },
      });
    };

    // 1. If profilePhoto is a Base64 data URL, decode and stream directly
    if (photo && photo.startsWith('data:')) {
      const parsed = parseBase64Photo(photo);
      if (parsed) {
        return sendImageResponse(parsed.buffer, parsed.mimeType || 'image/jpeg');
      }
    }

    // 2. If it's a full external URL, redirect
    if (photo && (photo.startsWith('http://') || photo.startsWith('https://'))) {
      return NextResponse.redirect(photo);
    }

    // 3. Try Cloudflare R2 / S3 storage
    const storageKeysToTry: string[] = [];

    // If photo is a relative file path (like "photos/applicant_..."), try it
    if (photo && !photo.startsWith('/api/') && !photo.startsWith('http')) {
      const cleanKey = photo.replace(/^\/+/, '');
      storageKeysToTry.push(cleanKey);
      if (cleanKey.startsWith('uploads/photos/')) {
        storageKeysToTry.push(cleanKey.replace(/^uploads\//, ''));
      }
    }

    // Canonical R2 photo keys
    storageKeysToTry.push(
      `photos/applicant_${applicantId}.jpg`,
      `photos/applicant_${applicantId}.png`,
      `photos/applicant_${applicantId}.jpeg`,
      `photos/applicant_${applicantId}.webp`
    );

    for (const key of storageKeysToTry) {
      try {
        const exists = await storage.fileExists(key);
        if (exists) {
          const buffer = await storage.getFile(key);
          const ext = key.slice(key.lastIndexOf('.')).toLowerCase();
          const mime =
            ext === '.png'
              ? 'image/png'
              : ext === '.webp'
              ? 'image/webp'
              : 'image/jpeg';
          return sendImageResponse(buffer, mime);
        }
      } catch (err) {
        // Continue to next candidate
      }
    }

    // 4. Try local disk files
    const localUploadsDir = path.resolve(process.cwd(), 'public/uploads/photos');
    const localCandidates: string[] = [
      path.join(localUploadsDir, `applicant_${applicantId}.jpg`),
      path.join(localUploadsDir, `applicant_${applicantId}.png`),
      path.join(localUploadsDir, `applicant_${applicantId}.jpeg`),
      path.join(localUploadsDir, `applicant_${applicantId}.webp`),
      path.join(process.cwd(), 'uploads/private/photos', `applicant_${applicantId}.jpg`),
      path.join(process.cwd(), 'uploads/private/photos', `applicant_${applicantId}.png`),
    ];

    if (photo && photo.startsWith('/uploads/')) {
      localCandidates.unshift(path.join(process.cwd(), 'public', photo.replace(/^\/+/, '')));
    }

    for (const cand of localCandidates) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        try {
          const buffer = await fs.promises.readFile(cand);
          const ext = path.extname(cand).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          return sendImageResponse(buffer, mime);
        } catch {}
      }
    }

    // Also scan public/uploads/photos for any file matching applicant_${applicantId}*
    if (fs.existsSync(localUploadsDir)) {
      try {
        const files = await fs.promises.readdir(localUploadsDir);
        const match = files.find((f) => f.startsWith(`applicant_${applicantId}`));
        if (match) {
          const fullPath = path.join(localUploadsDir, match);
          const buffer = await fs.promises.readFile(fullPath);
          const ext = path.extname(match).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          return sendImageResponse(buffer, mime);
        }
      } catch {}
    }

    // 5. Self-Healing Fallback: Check if applicant has any image document in documents table
    try {
      const doc = await prisma.document.findFirst({
        where: {
          applicantId,
          OR: [
            { documentType: { code: 'PHOTO' } },
            { mimeType: { startsWith: 'image/' } },
            { fileName: { contains: 'photo', mode: 'insensitive' } },
            { fileName: { contains: 'profile', mode: 'insensitive' } },
            { fileName: { contains: 'passport', mode: 'insensitive' } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (doc) {
        let buffer: Buffer | null = null;
        let mime = doc.mimeType || 'image/jpeg';

        // Check doc.notes for permanent Base64 Data URI backup
        if (doc.notes && doc.notes.includes('data:image/')) {
          const match = doc.notes.match(/data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+/);
          if (match) {
            const parsed = parseBase64Photo(match[0]);
            if (parsed) {
              buffer = parsed.buffer;
              mime = parsed.mimeType || mime;
            }
          }
        }

        // Check doc.filePath for Base64 Data URI
        if (!buffer && doc.filePath && doc.filePath.startsWith('data:')) {
          const parsed = parseBase64Photo(doc.filePath);
          if (parsed) {
            buffer = parsed.buffer;
            mime = parsed.mimeType || mime;
          }
        }

        // Check storage for doc.filePath or doc.fileUrl
        if (!buffer && doc.filePath) {
          try {
            if (await storage.fileExists(doc.filePath)) {
              buffer = await storage.getFile(doc.filePath);
            }
          } catch {}
        }
        if (!buffer && doc.fileUrl && doc.fileUrl !== doc.filePath) {
          try {
            if (await storage.fileExists(doc.fileUrl)) {
              buffer = await storage.getFile(doc.fileUrl);
            }
          } catch {}
        }

        // Check local disk
        if (!buffer && doc.filePath) {
          const localDocPath = path.resolve(process.cwd(), doc.filePath.replace(/^\/+/, ''));
          if (fs.existsSync(localDocPath) && fs.statSync(localDocPath).isFile()) {
            buffer = await fs.promises.readFile(localDocPath);
          }
        }

        if (buffer && buffer.length > 0) {
          // Self-heal: Save to R2 canonical key and local disk so future lookups are instant
          const canonicalR2Key = `photos/applicant_${applicantId}.jpg`;
          try {
            await storage.saveFile(canonicalR2Key, buffer, {
              originalName: `applicant_${applicantId}.jpg`,
              mimeType: mime,
              size: buffer.length,
              uploadedAt: new Date(),
              applicantId,
              documentType: 'PROFILE_PHOTO',
            });

            if (fs.existsSync(localUploadsDir)) {
              await fs.promises.writeFile(path.join(localUploadsDir, `applicant_${applicantId}.jpg`), buffer);
            }
          } catch (healErr) {
            console.warn('Self-healing photo save to R2 encountered non-fatal error:', healErr);
          }

          return sendImageResponse(buffer, mime);
        }
      }
    } catch (docErr) {
      console.warn('Document fallback inspection error:', docErr);
    }

    // 6. Secondary Failsafe: Check ApplicantProfile notes for Base64 Data URI
    try {
      const applicantProfile = await prisma.applicantProfile.findUnique({
        where: { applicantId },
        select: { notes: true },
      });

      if (applicantProfile?.notes && applicantProfile.notes.includes('data:image/')) {
        const match = applicantProfile.notes.match(/data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+/);
        if (match) {
          const parsed = parseBase64Photo(match[0]);
          if (parsed) {
            const buffer = parsed.buffer;
            const mime = parsed.mimeType || 'image/jpeg';

            // Self-heal to R2 and local disk
            const canonicalR2Key = `photos/applicant_${applicantId}.jpg`;
            try {
              await storage.saveFile(canonicalR2Key, buffer, {
                originalName: `applicant_${applicantId}.jpg`,
                mimeType: mime,
                size: buffer.length,
                uploadedAt: new Date(),
                applicantId,
                documentType: 'PROFILE_PHOTO',
              });

              if (fs.existsSync(localUploadsDir)) {
                await fs.promises.writeFile(path.join(localUploadsDir, `applicant_${applicantId}.jpg`), buffer);
              }
            } catch (healErr) {}

            return sendImageResponse(buffer, mime);
          }
        }
      }
    } catch (profErr) {
      console.warn('ApplicantProfile fallback error:', profErr);
    }

    // 7. Final Fallback: Return 404 (with no-cache headers so future uploads are never blocked)
    return new NextResponse('Photo not found in storage', {
      status: 404,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Error serving applicant photo:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
