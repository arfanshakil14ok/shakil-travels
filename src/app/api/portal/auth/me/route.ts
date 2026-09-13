import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentApplicant, calculateProfileCompletion } from '@/lib/portal-auth';

export async function GET() {
  try {
    const applicant = await getCurrentApplicant();

    if (!applicant) {
      return NextResponse.json(
        { success: false, error: 'Unauthenticated' },
        { status: 401 }
      );
    }

    const [unreadNotifications, activeApplications, activeVisaCount] = await Promise.all([
      prisma.notification.count({
        where: {
          applicantId: applicant.id,
          isRead: false,
        },
      }),
      prisma.application.count({
        where: {
          applicantId: applicant.id,
          status: {
            notIn: ['REJECTED', 'WITHDRAWN', 'COMPLETED'],
          },
        },
      }),
      prisma.visaApplication.count({
        where: {
          applicantId: applicant.id,
          status: {
            notIn: ['REJECTED', 'CANCELLED', 'STAMPED'],
          },
        },
      }),
    ]);

    const completion = calculateProfileCompletion(applicant);

    return NextResponse.json({
      success: true,
      needsPhoto: !applicant.profilePhoto,
      hasPhoto: !!applicant.profilePhoto,
      data: {
        needsPhoto: !applicant.profilePhoto,
        hasPhoto: !!applicant.profilePhoto,
        applicant: {
          id: applicant.id,
          applicantNumber: applicant.applicantNumber,
          fullName: applicant.fullName,
          phone: applicant.phone,
          email: applicant.email,
          passportNumber: applicant.passportNumber,
          passportAvailable: applicant.passportAvailable,
          status: applicant.status,
          district: applicant.district,
          nationality: applicant.nationality,
          preferredCountry: applicant.preferredCountry?.name || null,
          preferredJobCategory: applicant.preferredJobCategory?.name || null,
          profilePhoto: applicant.profilePhoto || null,
          hasPhoto: !!applicant.profilePhoto,
          needsPhoto: !applicant.profilePhoto,
          isEmailVerified: applicant.isEmailVerified,
          isPhoneVerified: applicant.isPhoneVerified,
          profileCompletion: completion.percentage,
          missingFields: completion.missingFields,
        },
        counts: {
          unreadNotifications,
          activeApplications,
          activeVisaCount,
        },
      },
    });
  } catch (error: any) {
    console.error('Portal /me error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
