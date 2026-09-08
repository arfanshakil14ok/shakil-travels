import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { publicJobApplicationSchema } from '@/lib/validations/job';
import { generateFormattedId } from '@/lib/id-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = publicJobApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify job is PUBLISHED
    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
      include: { country: true, jobCategory: true },
    });

    if (!job || job.status !== 'PUBLISHED') {
      return NextResponse.json(
        { success: false, error: 'This job vacancy is not currently accepting applications.' },
        { status: 400 }
      );
    }

    // Check if applicant already exists by phone
    let applicant: any = await prisma.applicant.findFirst({
      where: { phone: data.phone },
      include: { customer: true },
    });

    if (!applicant) {
      const applicantNumber = await generateFormattedId(prisma, 'applicant');
      applicant = await prisma.$transaction(async (tx) => {
        const newApplicant = await tx.applicant.create({
          data: {
            applicantNumber,
            fullName: data.fullName,
            phone: data.phone,
            email: data.email || null,
            district: data.district || null,
            passportAvailable: data.passportAvailable,
            passportNumber: data.passportNumber || null,
            yearsOfExperience: data.yearsOfExperience,
            preferredCountryId: job.countryId,
            preferredJobCategoryId: job.jobCategoryId,
            status: 'NEW',
            source: 'WEBSITE',
          },
        });

        await tx.customer.create({
          data: {
            customerType: 'APPLICANT',
            name: data.fullName,
            phone: data.phone,
            email: data.email || null,
            applicantId: newApplicant.id,
          },
        });

        return newApplicant;
      });
    }

    // Check if already applied
    const existingApp = await prisma.application.findFirst({
      where: {
        applicantId: applicant.id,
        jobId: job.id,
      },
    });

    if (existingApp) {
      return NextResponse.json({
        success: true,
        message: 'Your application has already been received. Our recruitment officers will contact you soon.',
        data: {
          applicationCode: existingApp.applicationCode,
          applicantNumber: applicant.applicantNumber,
        },
      });
    }

    // Generate application code
    const applicationCode = await generateFormattedId(prisma, 'application');

    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          applicationCode,
          applicantId: applicant!.id,
          jobId: job.id,
          currentStage: 'APPLIED',
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: app.id,
          fromStage: 'APPLIED',
          toStage: 'APPLIED',
          notes: data.remarks || 'Application submitted via website portal',
        },
      });

      return app;
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully. An official recruitment officer will review your profile.',
      data: {
        applicationCode: application.applicationCode,
        applicantNumber: applicant.applicantNumber,
      },
    });
  } catch (error: any) {
    console.error('Error initiating application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit application. Please try again or contact our helpline.' },
      { status: 500 }
    );
  }
}
