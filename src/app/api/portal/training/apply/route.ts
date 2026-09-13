import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';
import { generateTrainingApplicationCode } from '@/lib/id-generator';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const applySchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  batchId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const applicant = await requireApplicantAuth();
    const body = await request.json();
    const parsed = applySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { courseId, batchId, notes } = parsed.data;

    const course = await prisma.trainingCourse.findUnique({
      where: { id: courseId },
      include: { category: true },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Training course not found' },
        { status: 404 }
      );
    }

    // Check for existing pending/active application for this course
    const existing = await prisma.trainingApplication.findFirst({
      where: {
        applicantId: applicant.id,
        courseId,
        status: { in: ['APPLIED', 'UNDER_REVIEW', 'APPROVED', 'ENROLLED'] },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already have an active training application for this course.',
          errorBn: 'এই কোর্সে আপনার একটি সক্রিয় আবেদন ইতিমধ্যে জমা রয়েছে।',
        },
        { status: 409 }
      );
    }

    const applicationCode = await generateTrainingApplicationCode(prisma);

    const trainingApp = await prisma.$transaction(async (tx) => {
      const app = await tx.trainingApplication.create({
        data: {
          applicationCode,
          applicantId: applicant.id,
          courseId,
          batchId: batchId || null,
          status: 'APPLIED',
          reviewNotes: notes || null,
        },
        include: {
          course: true,
          batch: {
            include: { center: true },
          },
        },
      });

      // Deliver notification to applicant inbox
      await tx.notification.create({
        data: {
          applicantId: applicant.id,
          type: 'TRAINING_APPLICATION',
          title: 'স্কিল ট্রেনিং আবেদন গৃহীত হয়েছে',
          message: `আপনার "${course.banglaTitle}" কোর্সের আবেদন জমা হয়েছে। আবেদন ট্র্যাকিং কোড: ${applicationCode}। কর্তৃপক্ষ শীঘ্রই ব্যাচ অনুমোদন জানাবে।`,
          link: '/portal/training',
        },
      });

      return app;
    });

    await createAuditLog({
      applicantId: applicant.id,
      actorType: 'APPLICANT',
      action: 'TRAINING_APPLIED',
      entity: 'TRAINING_APPLICATION',
      entityId: trainingApp.id,
      description: `Applicant applied for training course: ${course.title} (${applicationCode})`,
    });

    return NextResponse.json({
      success: true,
      message: 'Training application submitted successfully',
      data: trainingApp,
    }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error submitting training application:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit training application' },
      { status: 500 }
    );
  }
}
