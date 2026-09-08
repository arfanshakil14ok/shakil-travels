import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';
import { z } from 'zod';

const preferencesSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  whatsapp: z.boolean(),
  inApp: z.boolean(),
});

export async function GET() {
  try {
    const applicant = await requireApplicantAuth();

    let prefs = { email: true, sms: true, whatsapp: true, inApp: true };
    if (applicant.notificationPreferences) {
      try {
        prefs = JSON.parse(applicant.notificationPreferences);
      } catch (e) {
        // use default
      }
    }

    return NextResponse.json({ success: true, data: prefs });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const applicant = await requireApplicantAuth();
    const body = await request.json();

    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid preferences payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await prisma.applicant.update({
      where: { id: applicant.id },
      data: {
        notificationPreferences: JSON.stringify(parsed.data),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: parsed.data,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to update preferences' }, { status: 500 });
  }
}
