import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import prisma from '@/lib/prisma';
import { getCurrentApplicant } from '@/lib/portal-auth';
import { validateProfilePhoto, parseBase64Photo } from '@/lib/validations/photo';
import { storage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const applicant = await getCurrentApplicant();
    if (!applicant) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }

    let buffer: Buffer | null = null;
    let fileName = 'profile_photo.jpg';
    let mimeType = 'image/jpeg';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const photoData = body.photo || body.profilePhoto || body.image || body.photoBase64;
      if (!photoData) {
        return NextResponse.json(
          { success: false, error: 'Profile photo data is required.' },
          { status: 400 }
        );
      }
      const parsed = parseBase64Photo(photoData);
      if (!parsed) {
        return NextResponse.json(
          { success: false, error: 'Invalid photo data format.' },
          { status: 400 }
        );
      }
      buffer = parsed.buffer;
      mimeType = parsed.mimeType;
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') || formData.get('photo') || formData.get('profilePhoto');
      if (!file || typeof file === 'string') {
        return NextResponse.json(
          { success: false, error: 'Profile photo file is required.' },
          { status: 400 }
        );
      }
      const fileObj = file as File;
      const arrayBuffer = await fileObj.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      fileName = fileObj.name || 'profile_photo.jpg';
      mimeType = fileObj.type || 'image/jpeg';
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported Content-Type. Use multipart/form-data or application/json.' },
        { status: 400 }
      );
    }

    // Strict validation
    const validation = validateProfilePhoto(buffer, fileName, mimeType);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Photo validation failed.' },
        { status: 400 }
      );
    }

    const ext = validation.extension || '.jpg';
    const cleanFileName = `applicant_${applicant.id}_${Date.now()}${ext}`;
    const mime = validation.mimeType || 'image/jpeg';

    // 1. Save to R2 with both Canonical Key and Timestamped Backup Key
    const canonicalKey = `photos/applicant_${applicant.id}${ext}`;
    const canonicalJpgKey = `photos/applicant_${applicant.id}.jpg`;
    const timestampKey = `photos/${cleanFileName}`;

    let r2Saved = false;
    try {
      await storage.saveFile(canonicalKey, buffer, {
        originalName: fileName,
        mimeType: mime,
        size: buffer.length,
        uploadedAt: new Date(),
        applicantId: applicant.id,
        documentType: 'PROFILE_PHOTO',
      });

      // Also ensure .jpg alias exists for standard lookups
      if (canonicalKey !== canonicalJpgKey) {
        await storage.saveFile(canonicalJpgKey, buffer, {
          originalName: fileName,
          mimeType: mime,
          size: buffer.length,
          uploadedAt: new Date(),
          applicantId: applicant.id,
          documentType: 'PROFILE_PHOTO',
        });
      }

      await storage.saveFile(timestampKey, buffer, {
        originalName: fileName,
        mimeType: mime,
        size: buffer.length,
        uploadedAt: new Date(),
        applicantId: applicant.id,
        documentType: 'PROFILE_PHOTO',
      });
      r2Saved = true;
    } catch (storageErr) {
      console.warn('R2 storage save failed in upload-photo, proceeding with fallbacks:', storageErr);
    }

    // 2. Persist in local public uploads for development and immediate disk resolution
    try {
      const publicUploadsDir = path.resolve(process.cwd(), 'public/uploads/photos');
      if (!fs.existsSync(publicUploadsDir)) {
        fs.mkdirSync(publicUploadsDir, { recursive: true });
      }
      await fs.promises.writeFile(path.join(publicUploadsDir, `applicant_${applicant.id}.jpg`), buffer);
      await fs.promises.writeFile(path.join(publicUploadsDir, `applicant_${applicant.id}${ext}`), buffer);
      await fs.promises.writeFile(path.join(publicUploadsDir, cleanFileName), buffer);
    } catch (fsErr) {
      console.warn('Local disk write skipped in serverless environment:', fsErr);
    }

    // 3. Backup to documents table under 'PHOTO' document type (failsafe redundancy)
    const base64DataUri = `data:${mime};base64,${buffer.toString('base64')}`;
    try {
      const photoDocType = await prisma.documentType.findFirst({
        where: { code: 'PHOTO' },
      });

      if (photoDocType) {
        // Check if an existing profile photo document exists for this candidate
        const existingPhotoDoc = await prisma.document.findFirst({
          where: {
            applicantId: applicant.id,
            documentTypeId: photoDocType.id,
          },
        });

        if (existingPhotoDoc) {
          await prisma.document.update({
            where: { id: existingPhotoDoc.id },
            data: {
              fileName: `profile_photo_${applicant.id}${ext}`,
              filePath: canonicalKey,
              fileUrl: canonicalKey,
              notes: base64DataUri, // Guaranteed permanent backup in database
              fileSize: buffer.length,
              mimeType: mime,
              status: 'VERIFIED',
              updatedAt: new Date(),
            },
          });
        } else {
          await prisma.document.create({
            data: {
              applicantId: applicant.id,
              documentTypeId: photoDocType.id,
              fileName: `profile_photo_${applicant.id}${ext}`,
              filePath: canonicalKey,
              fileUrl: canonicalKey,
              notes: base64DataUri, // Guaranteed permanent backup in database
              fileSize: buffer.length,
              mimeType: mime,
              status: 'VERIFIED',
            },
          });
        }
      }
    } catch (docErr) {
      console.warn('Document table backup skipped:', docErr);
    }

    // 4. Update applicant record with consistent endpoint
    const endpointUrl = `/api/portal/photo/${applicant.id}`;
    const updatedApplicant = await prisma.applicant.update({
      where: { id: applicant.id },
      data: {
        profilePhoto: endpointUrl,
        status: applicant.status === 'PROFILE_INCOMPLETE' ? 'ACTIVE' : applicant.status,
      },
    });

    await prisma.applicantProfile.upsert({
      where: { applicantId: applicant.id },
      create: {
        applicantId: applicant.id,
        notes: `PHOTO_B64:${base64DataUri}`,
      },
      update: {
        notes: `PHOTO_B64:${base64DataUri}`,
      },
    });

    const cacheBustedUrl = `${endpointUrl}?v=${Date.now()}`;

    return NextResponse.json({
      success: true,
      message: 'Profile photo uploaded successfully.',
      photoUrl: cacheBustedUrl,
      data: {
        photoUrl: cacheBustedUrl,
        applicant: {
          id: updatedApplicant.id,
          fullName: updatedApplicant.fullName,
          profilePhoto: cacheBustedUrl,
        },
      },
    });
  } catch (error: any) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload profile photo.' },
      { status: 500 }
    );
  }
}
