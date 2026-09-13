import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { BRAND } from '@/config/brand';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { certificateNumber: string } }
) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(`cert_verify:${ip}`, 30, 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, isAuthentic: false, error: 'Too many verification requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const rawParam = decodeURIComponent(params.certificateNumber).trim();

    const certificate = await prisma.trainingCertificate.findFirst({
      where: {
        OR: [
          { certificateNumber: { equals: rawParam, mode: 'insensitive' } },
          { verificationCode: { equals: rawParam, mode: 'insensitive' } },
        ],
      },
      include: {
        applicant: {
          select: {
            fullName: true,
            applicantNumber: true,
            nationality: true,
            candidateType: true,
          },
        },
        course: {
          select: {
            title: true,
            banglaTitle: true,
            durationWeeks: true,
            certificationType: true,
            category: { select: { name: true, banglaName: true } },
          },
        },
        center: {
          select: {
            name: true,
            banglaName: true,
            district: true,
            code: true,
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        {
          success: false,
          isAuthentic: false,
          error: 'No valid certificate found matching the provided reference.',
          errorBn: 'প্রদত্ত রেফারেন্স নম্বরের সাথে কোনো বৈধ সার্টিফিকেট পাওয়া যায়নি।',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      isAuthentic: certificate.verifiedStatus === 'VERIFIED',
      data: {
        certificateNumber: certificate.certificateNumber,
        verificationCode: certificate.verificationCode,
        status: certificate.verifiedStatus,
        issueDate: certificate.issueDate,
        grade: certificate.grade,
        skillAcquired: certificate.skillAcquired,
        candidateName: certificate.applicant.fullName,
        candidateId: certificate.applicant.applicantNumber,
        nationality: certificate.applicant.nationality,
        candidateType: certificate.applicant.candidateType,
        courseTitle: certificate.course.title,
        courseTitleBn: certificate.course.banglaTitle,
        durationWeeks: certificate.course.durationWeeks,
        certificationType: certificate.course.certificationType,
        trainingCenter: certificate.center.name,
        trainingCenterBn: certificate.center.banglaName,
        centerDistrict: certificate.center.district,
        issuingAgency: BRAND.name,
        agencyLicense: BRAND.licenseNumber,
        hotline: BRAND.phone,
        officeAddress: BRAND.addressBn,
      },
    });
  } catch (error: any) {
    console.error('Error in certificate verification endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal verification service error' },
      { status: 500 }
    );
  }
}
