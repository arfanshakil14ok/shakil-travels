import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function maskName(name?: string | null): string {
  if (!name) return 'আবেদনকারী';
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => {
      if (p.length <= 2) return p;
      return `${p[0]}${'*'.repeat(Math.max(2, p.length - 2))}${p[p.length - 1]}`;
    })
    .join(' ');
}

function maskPassport(passport?: string | null): string {
  if (!passport) return '';
  const trimmed = passport.trim();
  if (trimmed.length <= 3) return '***';
  return `${trimmed.slice(0, 2)}****${trimmed.slice(-2)}`;
}

// Map pipeline statuses to high-level customer stages (1 to 7)
function getStageInfo(status: string) {
  const norm = (status || '').toUpperCase();

  if (norm === 'REJECTED' || norm === 'CANCELLED') {
    return {
      stageIndex: 1,
      isTerminated: true,
      stageTitleBn: 'আবেদন বাতিল / স্থগিত',
      stageDescBn: 'দুঃখিত, আবেদনটি সংশ্লিষ্ট কর্তৃপক্ষ বা নিয়োগকর্তা কর্তৃক বাতিল অথবা স্থগিত করা হয়েছে। বিস্তারিত জানতে অফিসে যোগাযোগ করুন।',
      badgeColor: 'rose',
    };
  }

  // Stage 7: Deployment & Travel
  if (['DEPLOYED', 'RECRUITMENT_COMPLETED', 'COMPLETED', 'TICKET_CONFIRMED', 'FLIGHT_BOOKED'].includes(norm)) {
    return {
      stageIndex: 7,
      isTerminated: false,
      stageTitleBn: 'ফ্লাইট প্রস্তুতি ও কর্মস্থলে যাত্রা',
      stageDescBn: 'অভিনন্দন! আপনার ভিসা ও বিএমইটি স্মার্টকার্ড ছাড়পত্র সম্পন্ন হয়েছে এবং ফ্লাইট টিকেট কনফার্ম করা হয়েছে।',
      badgeColor: 'emerald',
    };
  }

  // Stage 6: BMET Clearance
  if (['CLEARANCE_OBTAINED', 'CLEARANCE_COMPLETED', 'BMET_CLEARANCE', 'SMART_CARD_ISSUED'].includes(norm)) {
    return {
      stageIndex: 6,
      isTerminated: false,
      stageTitleBn: 'BMET স্মার্ট কার্ড ও সরকারি ছাড়পত্র',
      stageDescBn: 'ভিসা স্ট্যাম্পিং শেষে সরকারি জনশক্তি ছাড়পত্র ও স্মার্ট কার্ডের জন্য প্রক্রিয়া চলছে।',
      badgeColor: 'emerald',
    };
  }

  // Stage 5: Visa Processing
  if (['VISA_STAMPED', 'VISA_ISSUED', 'VISA_APPROVED', 'EMBASSY_PROCESSING', 'VISA_SUBMITTED'].includes(norm)) {
    return {
      stageIndex: 5,
      isTerminated: false,
      stageTitleBn: 'ভিসা ইস্যু ও পাসপোর্ট স্ট্যাম্পিং',
      stageDescBn: 'সংশ্লিষ্ট দেশের দূতাবাস থেকে ভিসা অনুমোদন ও স্ট্যাম্পিং সম্পন্ন হয়েছে।',
      badgeColor: 'purple',
    };
  }

  // Stage 4: Medical Examination
  if (['MEDICAL_PASSED', 'MEDICAL_DONE', 'MEDICAL_FIT', 'GAMCA_FIT'].includes(norm)) {
    return {
      stageIndex: 4,
      isTerminated: false,
      stageTitleBn: 'মেডিকেল ফিটনেস ছাড়পত্র',
      stageDescBn: 'GAMCA / অনুমোদিত মেডিকেল সেন্টারে আপনার স্বাস্থ্য পরীক্ষা সফলভাবে সম্পন্ন হয়েছে।',
      badgeColor: 'teal',
    };
  }

  // Stage 3: Interview & Selection
  if (['SELECTED', 'OFFER_LETTER_ISSUED', 'CONTRACT_SIGNED', 'INTERVIEW_PASSED', 'INTERVIEW_SCHEDULED'].includes(norm)) {
    return {
      stageIndex: 3,
      isTerminated: false,
      stageTitleBn: 'সাক্ষাৎকার ও কোম্পানি সিলেকশন',
      stageDescBn: 'নিয়োগকর্তা কোম্পানি কর্তৃক প্রাথমিক সিলেকশন ও চুক্তিপত্র স্বাক্ষরের প্রক্রিয়া সম্পন্ন হচ্ছে।',
      badgeColor: 'indigo',
    };
  }

  // Stage 2: Screening & Shortlist
  if (['SHORTLISTED', 'SCREENING', 'UNDER_REVIEW'].includes(norm)) {
    return {
      stageIndex: 2,
      isTerminated: false,
      stageTitleBn: 'যোগ্যতা ও ডকুমেন্ট যাচাইকরণ (শর্টলিস্ট)',
      stageDescBn: 'আপনার জমা দেওয়া কাগজপত্র এবং পেশাগত অভিজ্ঞতা এজেন্সি রিক্রুটিং টিম দ্বারা যাচাই করা হচ্ছে।',
      badgeColor: 'blue',
    };
  }

  // Default Stage 1: Received / Applied
  return {
    stageIndex: 1,
    isTerminated: false,
    stageTitleBn: 'আবেদন গৃহীত ও ডাটা এন্ট্রি',
    stageDescBn: 'আপনার বৈদেশিক চাকরির আবেদন সফলভাবে গ্রহণ করা হয়েছে এবং সেন্ট্রাল ডাটাবেসে তালিকাভুক্ত হয়েছে।',
    badgeColor: 'sky',
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawQuery = (searchParams.get('q') || searchParams.get('trackingNumber') || '').trim();

    if (!rawQuery) {
      return NextResponse.json(
        { success: false, error: 'অনুগ্রহ করে ফাইল নম্বর, আবেদন নম্বর অথবা পাসপোর্ট নম্বর প্রদান করুন।' },
        { status: 400 }
      );
    }

    // Lookup application by multiple flexible identifiers
    const application = await prisma.application.findFirst({
      where: {
        OR: [
          { applicationCode: { equals: rawQuery, mode: 'insensitive' } },
          { applicationNumber: { equals: rawQuery, mode: 'insensitive' } },
          { id: { equals: rawQuery, mode: 'insensitive' } },
          {
            applicant: {
              OR: [
                { passportNumber: { equals: rawQuery, mode: 'insensitive' } },
                { applicantNumber: { equals: rawQuery, mode: 'insensitive' } },
                { phone: { equals: rawQuery } },
              ],
            },
          },
        ],
      },
      include: {
        applicant: {
          select: {
            id: true,
            fullName: true,
            applicantNumber: true,
            passportNumber: true,
            phone: true,
            status: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            titleLocal: true,
            jobCode: true,
            country: {
              select: {
                id: true,
                name: true,
                flag: true,
              },
            },
            employer: {
              select: {
                companyName: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            fromStatus: true,
            toStatus: true,
            notes: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!application) {
      return NextResponse.json({
        success: true,
        found: false,
        message: 'উক্ত ট্র্যাকিং কোড বা পাসপোর্ট নম্বরে কোনো সক্রিয় ফাইল পাওয়া যায়নি। অনুগ্রহ করে সঠিক নম্বর দিয়ে পুনরায় চেষ্টা করুন অথবা আমাদের সেন্ট্রাল ডেস্কে যোগাযোগ করুন।',
      });
    }

    const stageInfo = getStageInfo(application.status || application.currentStage);

    // Standard 7-stage roadmap
    const STAGES_MASTER = [
      { step: 1, title: 'আবেদন জমা', desc: 'আবেদন নথিভুক্তকরণ' },
      { step: 2, title: 'বাছাই ও শর্টলিস্ট', desc: 'নথি ও দক্ষতা যাচাই' },
      { step: 3, title: 'ইন্টারভিউ ও সিলেকশন', desc: 'কোম্পানি চূড়ান্ত অনুমোদন' },
      { step: 4, title: 'মেডিকেল টেস্ট', desc: 'GAMCA স্বাস্থ্য পরীক্ষা' },
      { step: 5, title: 'ভিসা প্রসেসিং', desc: 'দূতাবাস ভিসা স্ট্যাম্পিং' },
      { step: 6, title: 'BMET ছাড়পত্র', desc: 'সরকারি স্মার্ট কার্ড প্রদান' },
      { step: 7, title: 'ফ্লাইট ও যাত্রা', desc: 'টিকেট ইস্যু ও বিদেশ গমন' },
    ];

    const stages = STAGES_MASTER.map((s) => {
      let state: 'COMPLETED' | 'CURRENT' | 'PENDING' = 'PENDING';
      if (stageInfo.isTerminated) {
        state = 'PENDING';
      } else if (s.step < stageInfo.stageIndex) {
        state = 'COMPLETED';
      } else if (s.step === stageInfo.stageIndex) {
        state = 'CURRENT';
      }
      return {
        ...s,
        state,
      };
    });

    return NextResponse.json({
      success: true,
      found: true,
      data: {
        applicationCode: application.applicationCode || application.applicationNumber || application.id.slice(0, 8),
        applicantNumber: application.applicant.applicantNumber,
        candidateNameMasked: maskName(application.applicant.fullName),
        passportMasked: maskPassport(application.applicant.passportNumber),
        jobTitle: application.job?.titleLocal || application.job?.title || 'আন্তর্জাতিক নিয়োগ ফাইল',
        countryName: application.job?.country?.name || 'অনুমোদিত বৈদেশিক দেশ',
        countryFlag: application.job?.country?.flag || '🌐',
        employerName: application.job?.employer?.companyName || 'স্বীকৃত বৈদেশিক নিয়োগকর্তা',
        status: application.status,
        stageIndex: stageInfo.stageIndex,
        stageTitle: stageInfo.stageTitleBn,
        stageDesc: stageInfo.stageDescBn,
        badgeColor: stageInfo.badgeColor,
        isTerminated: stageInfo.isTerminated,
        appliedDate: application.appliedAt,
        lastUpdated: application.updatedAt,
        stages,
        recentActivity: application.statusHistory.map((h) => ({
          status: h.toStatus,
          notes: h.notes,
          date: h.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('File tracking API error:', error);
    return NextResponse.json(
      { success: false, error: 'ফাইল ট্র্যাকিং তথ্য লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}
