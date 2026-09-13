import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';

function getNextAction(stage: string) {
  switch (stage) {
    case 'SELECTED':
      return {
        title: 'Processing Case Initiated',
        titleBn: 'প্রক্রিয়াকরণ কেস শুরু হয়েছে',
        description: 'Your recruitment file has been opened. Please prepare your passport and NID documents.',
        descriptionBn: 'আপনার ফাইল খোলা হয়েছে। আপনার পাসপোর্ট ও জাতীয় পরিচয়পত্র প্রস্তুত রাখুন।',
        actionType: 'WAIT',
      };
    case 'DOCUMENT_PROCESSING':
      return {
        title: 'Upload Mandatory Documents',
        titleBn: 'প্রয়োজনীয় কাগজপত্র আপলোড করুন',
        description: 'Please upload all required documents (passport, NID, medical certificates) to proceed.',
        descriptionBn: 'অগ্রগতির জন্য আপনার পাসপোর্ট, এনআইডি এবং প্রয়োজনীয় কাগজপত্র আপলোড করুন।',
        actionType: 'UPLOAD_DOCS',
      };
    case 'DOCUMENT_VERIFICATION':
      return {
        title: 'Document Verification in Progress',
        titleBn: 'কাগজপত্র যাচাই চলছে',
        description: 'Our compliance officers are currently verifying your submitted documents.',
        descriptionBn: 'আমাদের কমপ্লায়েন্স টিম আপনার কাগজপত্র যাচাই করছে।',
        actionType: 'WAIT',
      };
    case 'MEDICAL_PENDING':
    case 'MEDICAL_SCHEDULED':
      return {
        title: 'Attend Medical Examination',
        titleBn: 'মেডিকেল পরীক্ষায় উপস্থিত হোন',
        description: 'Please attend your GAMCA medical appointment at the assigned medical center on time.',
        descriptionBn: 'নির্ধারিত তারিখে সময়মতো অনুমোদিত গামকা মেডিকেল সেন্টারে উপস্থিত থাকুন।',
        actionType: 'ATTEND_MEDICAL',
      };
    case 'MEDICAL_PASSED':
      return {
        title: 'Medical Fitness Cleared',
        titleBn: 'মেডিকেল ফিটনেস উত্তীর্ণ',
        description: 'Congratulations on passing the medical exam! Visa file preparation is commencing.',
        descriptionBn: 'মেডিকেলে উত্তীর্ণ হওয়ার জন্য অভিনন্দন! ভিসা আবেদন প্রস্তুত করা হচ্ছে।',
        actionType: 'WAIT',
      };
    case 'MEDICAL_FAILED':
      return {
        title: 'Medical Review Required',
        titleBn: 'মেডিকেল পর্যালোচনার প্রয়োজন',
        description: 'Medical report indicated unfit status. Please contact our office immediately for retest options.',
        descriptionBn: 'মেডিকেল রিপোর্টে সমস্যা পাওয়া গেছে। পুনরায় পরীক্ষার জন্য অফিসে যোগাযোগ করুন।',
        actionType: 'CONTACT_OFFICE',
      };
    case 'VISA_PREPARATION':
    case 'VISA_SUBMITTED':
    case 'VISA_PROCESSING':
      return {
        title: 'Visa Stamping in Embassy',
        titleBn: 'দূতাবাসে ভিসা প্রসেসিং চলছে',
        description: 'Your visa papers have been submitted to the embassy for stamping.',
        descriptionBn: 'ভিসা স্ট্যাম্পিংয়ের জন্য আপনার কাগজপত্র দূতাবাসে জমা রয়েছে।',
        actionType: 'WAIT',
      };
    case 'VISA_APPROVED':
      return {
        title: 'Visa Approved!',
        titleBn: 'ভিসা অনুমোদিত হয়েছে!',
        description: 'Your employment visa is approved. BMET emigration smart card processing will now begin.',
        descriptionBn: 'আপনার ভিসা অনুমোদিত হয়েছে। এখন বিএমইটি স্মার্ট কার্ড প্রসেস করা হবে।',
        actionType: 'WAIT',
      };
    case 'CLEARANCE_PENDING':
    case 'CLEARANCE_PROCESSING':
      return {
        title: 'BMET Smart Card Processing',
        titleBn: 'বিএমইটি স্মার্ট কার্ড প্রসেসিং',
        description: 'Government emigration clearance and BMET smart card are being processed.',
        descriptionBn: 'সরকারি বহির্গমন ছাড়পত্র এবং বিএমইটি স্মার্ট কার্ড প্রস্তুত হচ্ছে।',
        actionType: 'WAIT',
      };
    case 'CLEARANCE_COMPLETED':
      return {
        title: 'Clearance Complete',
        titleBn: 'ছাড়পত্র সম্পন্ন হয়েছে',
        description: 'BMET smart card received. Flight booking and ticket issuance in progress.',
        descriptionBn: 'বিএমইটি স্মার্ট কার্ড সম্পন্ন হয়েছে। ফ্লাইটের টিকিট ইস্যু করা হচ্ছে।',
        actionType: 'WAIT',
      };
    case 'TICKET_ISSUED':
      return {
        title: 'Download Flight Ticket',
        titleBn: 'ফ্লাইটের টিকিট ডাউনলোড করুন',
        description: 'Your flight ticket is confirmed. Please review your flight timing and baggage allowance.',
        descriptionBn: 'আপনার টিকিট নিশ্চিত হয়েছে। ফ্লাইটের সময় ও লাগেজের নিয়মাবলি দেখে নিন।',
        actionType: 'VIEW_TICKET',
      };
    case 'DEPARTURE_READY':
      return {
        title: 'Departure Briefing & Airport Reporting',
        titleBn: 'প্রাক-যাত্রা ব্রিফিং ও বিমানবন্দরে উপস্থিতি',
        description: 'You are completely departure ready! Please attend pre-departure briefing and report to airport on time.',
        descriptionBn: 'আপনি বিদেশযাত্রার জন্য প্রস্তুত! ব্রিফিং শুনুন এবং সময়মতো বিমানবন্দরে উপস্থিত হোন।',
        actionType: 'DEPARTURE_BRIEFING',
      };
    case 'DEPARTED':
      return {
        title: 'In Transit / Reporting to Employer',
        titleBn: 'যাত্রা পথে / নিয়োগকর্তার কাছে রিপোর্ট করুন',
        description: 'Safe journey! Upon arrival, please confirm reporting with the employer representative.',
        descriptionBn: 'শুভ যাত্রা! পৌঁছানোর পর নিয়োগকর্তার প্রতিনিধির কাছে রিপোর্ট করুন।',
        actionType: 'CONFIRM_JOINING',
      };
    case 'JOINED':
    case 'COMPLETED':
      return {
        title: 'Deployment Completed Successfully',
        titleBn: 'নিয়োগ প্রক্রিয়া সফলভাবে সম্পন্ন',
        description: 'Your overseas deployment is complete. Welcome to your new role!',
        descriptionBn: 'আপনার বৈদেশিক নিয়োগ প্রক্রিয়া সম্পন্ন হয়েছে। কর্মজীবনে শুভকামনা!',
        actionType: 'COMPLETED',
      };
    case 'ON_HOLD':
      return {
        title: 'Case Temporarily On Hold',
        titleBn: 'কেস সাময়িকভাবে স্থগিত',
        description: 'Your processing case is paused. Please check details or contact your recruitment officer.',
        descriptionBn: 'আপনার প্রক্রিয়াকরণ সাময়িকভাবে স্থগিত রয়েছে। বিস্তারিত জানার জন্য যোগাযোগ করুন।',
        actionType: 'CONTACT_OFFICE',
      };
    default:
      return {
        title: 'In Progress',
        titleBn: 'প্রক্রিয়াধীন',
        description: 'Your recruitment processing is progressing normally.',
        descriptionBn: 'আপনার প্রক্রিয়াকরণ স্বাভাবিকভাবে চলছে।',
        actionType: 'WAIT',
      };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const applicant = await requireApplicantAuth();
    const { id } = await params;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { processingCode: id }] },
          { applicantId: applicant.id },
        ],
      },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fromStage: true,
            toStage: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    const nextAction = getNextAction(pc.currentStage);

    return NextResponse.json({
      success: true,
      data: {
        currentStage: pc.currentStage,
        overallStatus: pc.overallStatus,
        nextAction,
        timeline: pc.statusHistory,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal processing timeline error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch timeline' }, { status: 500 });
  }
}
