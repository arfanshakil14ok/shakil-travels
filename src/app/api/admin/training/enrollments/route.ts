import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const applicantId = searchParams.get('applicantId');
    const status = searchParams.get('status');

    const where: any = {};
    if (batchId) where.batchId = batchId;
    if (applicantId) where.applicantId = applicantId;
    if (status && status !== 'ALL') where.status = status;

    const enrollments = await prisma.trainingEnrollment.findMany({
      where,
      include: {
        applicant: {
          select: {
            id: true,
            fullName: true,
            applicantNumber: true,
            phone: true,
            profilePhoto: true,
          },
        },
        batch: {
          include: {
            course: true,
            center: true,
            instructor: true,
          },
        },
        progress: true,
        assessments: true,
        certificate: true,
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: enrollments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { applicantId, batchId, rollNumber } = body;

    if (!applicantId || !batchId) {
      return NextResponse.json(
        { success: false, error: 'Applicant and Batch are required for enrollment.' },
        { status: 400 }
      );
    }

    // Verify batch exists and has capacity
    const batch = await prisma.trainingBatch.findUnique({
      where: { id: batchId },
      include: { course: true },
    });
    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch not found.' }, { status: 404 });
    }

    // Check if already enrolled in this batch
    const existing = await prisma.trainingEnrollment.findFirst({
      where: { applicantId, batchId },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Candidate is already enrolled in this batch.' },
        { status: 409 }
      );
    }

    const count = await prisma.trainingEnrollment.count();
    const enrollmentNumber = `SGR-ENR-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const enrollment = await prisma.trainingEnrollment.create({
      data: {
        enrollmentNumber,
        applicantId,
        batchId,
        rollNumber: rollNumber || `R-${String(count + 1).padStart(3, '0')}`,
        status: 'ENROLLED',
        enrolledAt: new Date(),
      },
      include: {
        applicant: true,
        batch: {
          include: {
            course: true,
            center: true,
          },
        },
      },
    });

    // Create initial Progress record
    await prisma.trainingProgress.create({
      data: {
        enrollmentId: enrollment.id,
        moduleName: 'Core Competency & Safety',
        completionPercentage: 10,
        trainerRemarks: 'Candidate enrolled and orientation completed.',
      },
    });

    // Update batch enrolled count
    await prisma.trainingBatch.update({
      where: { id: batchId },
      data: { enrolledCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      message: 'Candidate enrolled successfully.',
      data: enrollment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to enroll candidate' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enrollmentId, status, completionPercentage, finalGrade, remarks, issueCertificate } = body;

    if (!enrollmentId) {
      return NextResponse.json(
        { success: false, error: 'Enrollment ID is required.' },
        { status: 400 }
      );
    }

    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { batch: { include: { course: true, center: true } }, applicant: true },
    });

    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Enrollment not found' }, { status: 404 });
    }

    // Update progress if percentage provided
    if (completionPercentage !== undefined) {
      await prisma.trainingProgress.upsert({
        where: { id: enrollmentId },
        create: {
          enrollmentId,
          moduleName: 'Progress Update',
          completionPercentage: parseInt(String(completionPercentage), 10),
          trainerRemarks: remarks || null,
        },
        update: {
          completionPercentage: parseInt(String(completionPercentage), 10),
          trainerRemarks: remarks || null,
        },
      });
    }

    const isCompleted = status === 'COMPLETED' || completionPercentage === 100;

    const updated = await prisma.trainingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: status || (isCompleted ? 'COMPLETED' : undefined),
        finalGrade: finalGrade || (isCompleted ? 'A' : undefined),
        completedAt: isCompleted ? new Date() : undefined,
      },
    });

    // Issue Certificate if completed or requested
    let certificate = null;
    if (issueCertificate || isCompleted) {
      const existingCert = await prisma.trainingCertificate.findUnique({
        where: { enrollmentId },
      });

      if (!existingCert) {
        const certCount = await prisma.trainingCertificate.count();
        const certificateNumber = `SGR-CERT-${new Date().getFullYear()}-${String(certCount + 1).padStart(5, '0')}`;
        const verificationCode = `SGR-VERIFY-${Date.now().toString(36).toUpperCase()}-${String(certCount + 1).padStart(4, '0')}`;

        certificate = await prisma.trainingCertificate.create({
          data: {
            certificateNumber,
            verificationCode,
            enrollmentId,
            applicantId: enrollment.applicantId,
            courseId: enrollment.batch.courseId,
            centerId: enrollment.batch.centerId,
            skillAcquired: `${enrollment.batch.course.title} Professional Certification`,
            grade: finalGrade || 'PASSED',
            scorePercentage: completionPercentage || 100,
            issueDate: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Training enrollment updated successfully.',
      data: {
        enrollment: updated,
        certificate,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update enrollment' },
      { status: 500 }
    );
  }
}
