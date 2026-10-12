import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseBase64Photo } from '@/lib/validations/photo';
import { storage } from '@/lib/storage';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicantId = params.id;
    if (!applicantId) {
      return new NextResponse('Applicant ID is required', { status: 400 });
    }

    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
      select: { profilePhoto: true },
    });

    if (!applicant || !applicant.profilePhoto) {
      return new NextResponse('Photo not found', { status: 404 });
    }

    const photo = applicant.profilePhoto;

    // 1. If it's a data URL, decode and stream
    if (photo.startsWith('data:')) {
      const parsed = parseBase64Photo(photo);
      if (!parsed) {
        return new NextResponse('Invalid photo data', { status: 500 });
      }

      return new NextResponse(new Uint8Array(parsed.buffer), {
        status: 200,
        headers: {
          'Content-Type': parsed.mimeType || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    // 2. Try fetching from Cloudflare R2 / S3 storage provider
    const storageKeysToTry: string[] = [];
    if (!photo.startsWith('/') && !photo.startsWith('http')) {
      storageKeysToTry.push(photo);
    }
    // Also try standard applicant photo keys
    storageKeysToTry.push(
      `photos/applicant_${applicantId}.jpg`,
      `photos/applicant_${applicantId}.png`,
      `photos/applicant_${applicantId}.webp`
    );

    for (const key of storageKeysToTry) {
      try {
        const exists = await storage.fileExists(key);
        if (exists) {
          const buffer = await storage.getFile(key);
          const ext = key.slice(key.lastIndexOf('.')).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
              'Content-Type': mime,
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            },
          });
        }
      } catch {}
    }

    // 3. Fallback: local disk file resolution
    const localCandidates = [
      path.join(process.cwd(), 'public', photo.replace(/^\//, '')),
      path.join(process.cwd(), 'public/uploads/photos', `applicant_${applicantId}.jpg`),
      path.join(process.cwd(), 'public/uploads/photos', `applicant_${applicantId}.png`),
      path.join(process.cwd(), 'uploads/private/photos', `applicant_${applicantId}.jpg`),
      path.join(process.cwd(), 'uploads/private/photos', `applicant_${applicantId}.png`),
    ];
    for (const cand of localCandidates) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        const buffer = await fs.promises.readFile(cand);
        const ext = path.extname(cand).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': mime,
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    }

    // 4. If it's a full external URL, redirect
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return NextResponse.redirect(photo);
    }

    return new NextResponse('Photo not found in storage', { status: 404 });
  } catch (error) {
    console.error('Error serving applicant photo:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
