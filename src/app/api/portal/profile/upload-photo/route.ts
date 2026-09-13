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
    const storageSubPath = `photos/${cleanFileName}`;

    // Save to unified private storage
    await storage.saveFile(storageSubPath, buffer, {
      originalName: fileName,
      mimeType: validation.mimeType || 'image/jpeg',
      size: buffer.length,
      uploadedAt: new Date(),
      applicantId: applicant.id,
      documentType: 'PROFILE_PHOTO',
    });

    // Also persist in public uploads for ultra-fast CDN/Next.js Image serving
    const publicUploadsDir = path.resolve(process.cwd(), 'public/uploads/photos');
    if (!fs.existsSync(publicUploadsDir)) {
      fs.mkdirSync(publicUploadsDir, { recursive: true });
    }
    await fs.promises.writeFile(path.join(publicUploadsDir, cleanFileName), buffer);

    const publicPhotoUrl = `/uploads/photos/${cleanFileName}`;

    // Update applicant record and profile
    const updatedApplicant = await prisma.applicant.update({
      where: { id: applicant.id },
      data: {
        profilePhoto: publicPhotoUrl,
        status: applicant.status === 'PROFILE_INCOMPLETE' ? 'ACTIVE' : applicant.status,
      },
    });

    await prisma.applicantProfile.upsert({
      where: { applicantId: applicant.id },
      create: {
        applicantId: applicant.id,
      },
      update: {},
    });

    return NextResponse.json({
      success: true,
      message: 'Profile photo uploaded successfully.',
      photoUrl: publicPhotoUrl,
      data: {
        photoUrl: publicPhotoUrl,
        applicant: {
          id: updatedApplicant.id,
          fullName: updatedApplicant.fullName,
          profilePhoto: updatedApplicant.profilePhoto,
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
