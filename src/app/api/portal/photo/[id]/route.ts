import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseBase64Photo } from '@/lib/validations/photo';

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

    // If it's a data URL, decode and stream
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

    // If it's a relative URL or full URL, redirect or rewrite
    return NextResponse.redirect(new URL(photo, request.url));
  } catch (error) {
    console.error('Error serving applicant photo:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
