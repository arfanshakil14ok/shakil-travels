/**
 * Recruitment Pipeline Stage Synchronization & Normalization
 * 
 * Provides unified stage mapping and milestone progression across:
 * 1. Application.status / Application.currentStage
 * 2. RecruitmentProcessingCase.currentStage
 * 3. VisaApplication.status
 */

export interface CanonicalMilestone {
  key: string;
  order: number;
  label: string;
  labelBn: string;
  description: string;
  descriptionBn: string;
}

export const CANONICAL_MILESTONES: CanonicalMilestone[] = [
  {
    key: 'APPLIED',
    order: 0,
    label: 'Application Submitted',
    labelBn: 'আবেদন দাখিল',
    description: 'Application submitted and registered in recruitment registry',
    descriptionBn: 'আবেদনপত্র সফলভাবে দাখিল ও নিবন্ধিত হয়েছে',
  },
  {
    key: 'SCREENING',
    order: 1,
    label: 'Profile Screening',
    labelBn: 'প্রাথমিক যাচাই',
    description: 'Document verification and employer eligibility review',
    descriptionBn: 'যোগ্যতা ও প্রয়োজনীয় নথিপত্র যাচাই সম্পন্ন হচ্ছে',
  },
  {
    key: 'SHORTLISTED',
    order: 2,
    label: 'Shortlisted',
    labelBn: 'শর্টলিস্টেড',
    description: 'Candidate profile selected for overseas employer review',
    descriptionBn: 'বিদেশি নিয়োগকর্তার প্রাথমিক পর্যালোচনার জন্য মনোনীত',
  },
  {
    key: 'INTERVIEW',
    order: 3,
    label: 'Interview',
    labelBn: 'সাক্ষাৎকার',
    description: 'Agency or employer client interview scheduled and evaluated',
    descriptionBn: 'নিয়োগকারী কর্তৃপক্ষের সাক্ষাৎকার সম্পন্ন ও মূল্যায়ন',
  },
  {
    key: 'SELECTED',
    order: 4,
    label: 'Selected & Offer',
    labelBn: 'চূড়ান্ত নির্বাচন ও চুক্তি',
    description: 'Officially selected by overseas employer; contract issued',
    descriptionBn: 'নিয়োগকর্তা কর্তৃক চূড়ান্ত নির্বাচন ও নিয়োগ চুক্তিপত্র প্রদান',
  },
  {
    key: 'DOCUMENTATION',
    order: 5,
    label: 'Documentation',
    labelBn: 'ডকুমেন্ট প্রসেসিং',
    description: 'Passport, attested certificates, and police clearance ready',
    descriptionBn: 'পাসপোর্ট ও পুলিশ ক্লিয়ারেন্স সত্যায়ন ও যাচাই সম্পন্ন',
  },
  {
    key: 'MEDICAL',
    order: 6,
    label: 'Medical Fitness',
    labelBn: 'মেডিকেল ফিটনেস',
    description: 'GAMCA / Embassy accredited clinical fitness verified',
    descriptionBn: 'অনুমোদিত মেডিকেল সেন্টার থেকে স্বাস্থ্য ফিটনেস সনদ প্রাপ্ত',
  },
  {
    key: 'VISA',
    order: 7,
    label: 'Visa Processing',
    labelBn: 'ভিসা প্রসেসিং',
    description: 'Visa submitted, processed, and approved by embassy',
    descriptionBn: 'দূতাবাস কর্তৃক ভিসা অনুমোদন ও স্ট্যাম্পিং সম্পন্ন',
  },
  {
    key: 'CLEARANCE',
    order: 8,
    label: 'Govt & BMET Clearance',
    labelBn: 'বিএমইটি ক্লিয়ারেন্স',
    description: 'BMET Smart Emigration Card & government clearance issued',
    descriptionBn: 'জনশক্তি ব্যুরো (BMET) ইমিগ্রেশন ক্লিয়ারেন্স ও স্মার্ট কার্ড প্রাপ্ত',
  },
  {
    key: 'DEPLOYED',
    order: 9,
    label: 'Flight & Deployment',
    labelBn: 'ফ্লাইট ও ডিপার্চার',
    description: 'Air ticket confirmed, pre-departure briefing, and departed',
    descriptionBn: 'এয়ার টিকিট নিশ্চিতকরণ, ব্রিফিং ও কর্মস্থলে গমন সম্পন্ন',
  },
];

// Map any known stage alias across the system to the canonical milestone index (0 to 9)
export function getCanonicalMilestoneIndex(rawStage?: string | null): number {
  if (!rawStage) return 0;
  const s = rawStage.trim().toUpperCase();

  // Terminal stages don't represent progress index, but map appropriately
  if (['REJECTED', 'CANCELLED', 'WITHDRAWN', 'MEDICAL_FAILED', 'VISA_REJECTED'].includes(s)) {
    return -1;
  }

  // 0. APPLIED
  if (['NEW', 'APPLIED', 'SUBMITTED', 'APPLICATION_SUBMITTED', 'PROFILE_INCOMPLETE', 'DRAFT'].includes(s)) {
    return 0;
  }

  // 1. SCREENING
  if (['SCREENING', 'UNDER_REVIEW', 'IN_REVIEW', 'DOCUMENT_CHECK', 'PROFILE_REVIEW'].includes(s)) {
    return 1;
  }

  // 2. SHORTLISTED
  if (['SHORTLISTED', 'POOLED'].includes(s)) {
    return 2;
  }

  // 3. INTERVIEW
  if ([
    'INTERVIEW_SCHEDULED',
    'INTERVIEW',
    'INTERVIEWED',
    'INTERVIEW_PASSED',
    'ASSESSMENT_SCHEDULED',
    'ASSESSMENT_PASSED',
  ].includes(s)) {
    return 3;
  }

  // 4. SELECTED & OFFER
  if ([
    'SELECTED',
    'OFFER_LETTER_ISSUED',
    'OFFER_ACCEPTED',
    'CONTRACT_SIGNED',
    'PRE_PROCESSING',
  ].includes(s)) {
    return 4;
  }

  // 5. DOCUMENTATION
  if ([
    'DOCUMENT_PROCESSING',
    'DOCUMENT_VERIFICATION',
    'DOCUMENTATION',
    'DOCUMENT_READY',
    'DOCUMENT_PENDING',
    'ATTESTATION',
  ].includes(s)) {
    return 5;
  }

  // 6. MEDICAL
  if ([
    'MEDICAL_PENDING',
    'MEDICAL_SCHEDULED',
    'MEDICAL_COMPLETED',
    'MEDICAL_PASSED',
    'MEDICAL_FIT',
    'MEDICAL',
    'GAMCA_SLIP_ISSUED',
  ].includes(s)) {
    return 6;
  }

  // 7. VISA
  if ([
    'VISA_PREPARATION',
    'VISA_SUBMITTED',
    'VISA_PROCESSING',
    'VISA_APPROVED',
    'VISA_STAMPED',
    'VISA_APPLIED',
    'BIOMETRICS',
    'VISA_READY',
  ].includes(s)) {
    return 7;
  }

  // 8. CLEARANCE
  if ([
    'CLEARANCE_PENDING',
    'CLEARANCE_PROCESSING',
    'CLEARANCE_COMPLETED',
    'BMET_PROCESSING',
    'BMET_CLEARANCE',
    'BMET_SMART_CARD',
    'MANPOWER_CLEARANCE',
  ].includes(s)) {
    return 8;
  }

  // 9. DEPLOYED
  if ([
    'TICKET_PENDING',
    'TICKET_ISSUED',
    'TICKET_CONFIRMED',
    'DEPARTURE_READY',
    'DEPARTED',
    'JOINED',
    'COMPLETED',
    'RECRUITMENT_COMPLETED',
    'DEPLOYED',
    'DEPARTURE',
  ].includes(s)) {
    return 9;
  }

  return 0;
}

/**
 * Determine the highest active effective stage across Application,
 * linked RecruitmentProcessingCase, and linked VisaApplication.
 */
export function getEffectiveStage(application: {
  status?: string | null;
  currentStage?: string | null;
  processingCase?: { currentStage?: string | null; overallStatus?: string | null } | null;
  visaApplications?: Array<{ status?: string | null }> | null;
}): string {
  if (!application) return 'APPLIED';

  const appStatus = (application.status || application.currentStage || 'APPLIED').toUpperCase();
  if (['REJECTED', 'CANCELLED', 'WITHDRAWN'].includes(appStatus)) {
    return appStatus;
  }

  let highestStage = application.currentStage || application.status || 'APPLIED';
  let highestIdx = getCanonicalMilestoneIndex(highestStage);

  // Check processing case stage
  if (application.processingCase?.currentStage) {
    const pcStage = application.processingCase.currentStage;
    const pcIdx = getCanonicalMilestoneIndex(pcStage);
    if (pcIdx > highestIdx) {
      highestIdx = pcIdx;
      highestStage = pcStage;
    }
  }

  // Check visa application stage
  if (application.visaApplications && application.visaApplications.length > 0) {
    const visaStage = application.visaApplications[0]?.status;
    if (visaStage) {
      const vIdx = getCanonicalMilestoneIndex(visaStage);
      if (vIdx > highestIdx) {
        highestIdx = vIdx;
        highestStage = visaStage;
      }
    }
  }

  return highestStage;
}

/**
 * Generates the standardized 10-step milestone timeline for the applicant portal
 */
export function generatePortalTimeline(activeRawStage: string) {
  const isRejected = ['REJECTED', 'CANCELLED', 'WITHDRAWN', 'MEDICAL_FAILED', 'VISA_REJECTED'].includes(
    activeRawStage.toUpperCase()
  );
  const currentIdx = getCanonicalMilestoneIndex(activeRawStage);

  return CANONICAL_MILESTONES.map((milestone, idx) => {
    let state: 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'TERMINATED' = 'UPCOMING';

    if (isRejected) {
      state = idx === currentIdx ? 'TERMINATED' : 'UPCOMING';
    } else if (currentIdx === -1) {
      state = 'TERMINATED';
    } else if (idx < currentIdx) {
      state = 'COMPLETED';
    } else if (idx === currentIdx) {
      state = 'CURRENT';
    } else {
      state = 'UPCOMING';
    }

    return {
      key: milestone.key,
      order: milestone.order,
      label: milestone.label,
      labelBn: milestone.labelBn,
      description: milestone.description,
      descriptionBn: milestone.descriptionBn,
      state,
    };
  });
}
