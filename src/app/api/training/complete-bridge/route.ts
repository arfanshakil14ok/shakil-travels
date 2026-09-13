import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateCertificateNumber } from '@/lib/id-generator';
import { createAuditLog } from '@/lib/audit';
import crypto from 'crypto';
import { z } from 'zod';

const bridgeSchema = z.object({
  applicantId: z.string().min(1, 'Applicant ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  enrollmentId: z.string().optional().nullable(),
  centerId: z.string().optional().nullable(),
  grade: z.string().default('PASSED'),
  scorePercentage: z.number().int().min(40).max(100).default(85),
  skillAcquired: z.string().optional(),
  specificSkills: z.array(z.string()).optional(),
  remarks: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized staff session' }, { status: 401 });
    }

    // Role / Permission Check: Super Admin, Training Manager, or TRAINING_CERTIFICATE_ISSUE permission
    const hasBridgeAuth =
      user.role.name === 'SUPER_ADMIN' ||
      user.role.name === 'TRAINING_MANAGER' ||
      user.permissions.includes('TRAINING_CERTIFICATE_ISSUE');

    if (!hasBridgeAuth) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Requires TRAINING_CERTIFICATE_ISSUE permission' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = bridgeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const applicant = await prisma.applicant.findUnique({
      where: { id: data.applicantId },
      include: { profile: true },
    });

    if (!applicant) {
      return NextResponse.json({ success: false, error: 'Applicant record not found' }, { status: 404 });
    }

    const course = await prisma.trainingCourse.findUnique({
      where: { id: data.courseId },
      include: { category: true },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Training course not found' }, { status: 404 });
    }

    // Idempotency: Check if verified certificate already exists for this applicant and course
    const existingCert = await prisma.trainingCertificate.findFirst({
      where: {
        applicantId: applicant.id,
        courseId: course.id,
        verifiedStatus: 'VERIFIED',
      },
    });

    if (existingCert) {
      return NextResponse.json(
        {
          success: false,
          error: `A verified certificate (${existingCert.certificateNumber}) has already been issued to this candidate for this course. Duplicate bridge execution prevented.`,
          certificateNumber: existingCert.certificateNumber,
        },
        { status: 409 }
      );
    }

    // Default center if not specified
    let targetCenterId = data.centerId;
    if (!targetCenterId) {
      const defaultCenter = await prisma.trainingCenter.findFirst({ where: { isActive: true } });
      targetCenterId = defaultCenter?.id;
    }

    if (!targetCenterId) {
      return NextResponse.json({ success: false, error: 'No active training center available' }, { status: 400 });
    }

    const certificateNumber = await generateCertificateNumber(prisma);
    const verificationCode = `SGR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const mainSkill = data.skillAcquired || `${course.title} Certified Specialist`;

    const specificSkillsList = data.specificSkills && data.specificSkills.length > 0
      ? data.specificSkills
      : [course.category.name, course.title.replace(' Level 1', ''), 'General Safety'];

    // Atomic Execution of Bridge
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Training Certificate
      const cert = await tx.trainingCertificate.create({
        data: {
          certificateNumber,
          enrollmentId: data.enrollmentId || null,
          applicantId: applicant.id,
          courseId: course.id,
          centerId: targetCenterId!,
          grade: data.grade,
          scorePercentage: data.scorePercentage,
          skillAcquired: mainSkill,
          verificationCode,
          verifiedStatus: 'VERIFIED',
          verifiedById: user.id,
          verifiedAt: new Date(),
          remarks: data.remarks || 'Successfully completed technical curriculum and verified by administrative board.',
        },
      });

      // 2. Complete Enrollment if exists
      if (data.enrollmentId) {
        await tx.trainingEnrollment.update({
          where: { id: data.enrollmentId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            finalGrade: data.grade,
          },
        });
      }

      // 3. Promote Candidate: candidateType becomes SKILLED
      const existingSkills = applicant.skills ? applicant.skills.split(',').map((s) => s.trim()) : [];
      const mergedSkills = Array.from(new Set([...existingSkills, ...specificSkillsList])).join(', ');

      const updatedApplicant = await tx.applicant.update({
        where: { id: applicant.id },
        data: {
          candidateType: 'SKILLED',
          profession: applicant.profession || course.category.name,
          skills: mergedSkills,
          status: applicant.status === 'NEW' ? 'ACTIVE' : applicant.status,
        },
      });

      // 4. Insert into candidate_skills table
      for (const skillName of specificSkillsList) {
        await tx.candidateSkill.create({
          data: {
            applicantId: applicant.id,
            skillName,
            category: course.category.name,
            proficiencyLevel: 'INTERMEDIATE',
            isVerified: true,
            verifiedAt: new Date(),
            certificateId: cert.id,
            acquiredVia: 'TRAINING',
          },
        });
      }

      // 5. Send Celebration & Job Notification to Applicant
      await tx.notification.create({
        data: {
          applicantId: applicant.id,
          type: 'CERTIFICATE_ISSUED',
          title: 'অভিনন্দন! স্কিল ট্রেনিং সম্পন্ন ও সার্টিফিকেট ইস্যু',
          message: `আপনার "${course.banglaTitle}" কোর্সের ট্রেনিং সফলভাবে সম্পন্ন হয়েছে ও সার্টিফিকেট নং ${certificateNumber} ইস্যু করা হয়েছে। আপনার প্রোফাইল এখন "দক্ষ (SKILLED)" হিসেবে উন্নীত হয়েছে এবং আপনি বৈদেশিক চাকরির জন্য যোগ্য!`,
          link: '/portal/jobs',
        },
      });

      return {
        certificate: cert,
        applicant: updatedApplicant,
      };
    });

    // 6. Find matching overseas vacancies for newly acquired skill
    const recommendedJobs = await prisma.job.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { jobCategoryId: course.category.id },
          ...specificSkillsList.map((skill) => ({
            title: { contains: skill, mode: 'insensitive' as const },
          })),
        ],
      },
      include: {
        country: true,
        employer: { select: { companyName: true } },
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
    });

    // 7. Audit Log Entry
    await createAuditLog({
      userId: user.id,
      applicantId: applicant.id,
      actorType: 'STAFF',
      action: 'TRAINING_BRIDGE_COMPLETED_PROMOTED_TO_SKILLED',
      entity: 'APPLICANT',
      entityId: applicant.id,
      description: `Candidate promoted from ${applicant.candidateType} to SKILLED upon certificate ${certificateNumber}`,
      newValue: {
        certificateNumber,
        previousCandidateType: applicant.candidateType,
        newCandidateType: 'SKILLED',
        skillsAwarded: specificSkillsList,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Training-to-Recruitment bridge executed successfully. Candidate promoted to SKILLED.',
      data: {
        certificate: result.certificate,
        applicant: {
          id: result.applicant.id,
          applicantNumber: result.applicant.applicantNumber,
          fullName: result.applicant.fullName,
          previousType: applicant.candidateType,
          currentType: result.applicant.candidateType,
          skills: result.applicant.skills,
        },
        recommendedJobs,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in training bridge execution:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute training bridge' },
      { status: 500 }
    );
  }
}
