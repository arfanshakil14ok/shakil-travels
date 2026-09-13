import { PrismaClient } from '@prisma/client';
import { ProcessingStage } from '@/lib/validations/processing';

export interface GateCheckResult {
  allowed: boolean;
  reason?: string;
  blockers?: string[];
}

export interface DepartureReadinessResult {
  ready: boolean;
  blockers: string[];
  pillarStatus: {
    documents: { passed: boolean; message: string };
    medical: { passed: boolean; message: string };
    visa: { passed: boolean; message: string };
    clearance: { passed: boolean; message: string };
    ticket: { passed: boolean; message: string };
  };
}

/**
 * Validates whether a processing case can transition from currentStage to targetStage
 */
export async function validateStageTransition(
  prisma: PrismaClient,
  processingCaseId: string,
  targetStage: ProcessingStage,
  forceOverride = false
): Promise<GateCheckResult> {
  const pc = await prisma.recruitmentProcessingCase.findUnique({
    where: { id: processingCaseId },
    include: {
      documentRequirements: true,
      medicalCase: true,
      visaCase: true,
      clearanceCase: true,
      travelTicket: true,
      departureCase: true,
      joiningCase: true,
    },
  });

  if (!pc) {
    return { allowed: false, reason: 'Processing case not found' };
  }

  // If already cancelled or completed, cannot casually transition unless privileged override
  if (pc.overallStatus === 'CANCELLED' && !forceOverride) {
    return { allowed: false, reason: 'Cannot transition a cancelled processing case.' };
  }

  if (targetStage === 'ON_HOLD') {
    return { allowed: true };
  }

  if (targetStage === 'CANCELLED') {
    return { allowed: true };
  }

  // Override bypass for managers with documented reasons
  if (forceOverride) {
    return { allowed: true };
  }

  // 1. Gate: Moving to DOCUMENT_VERIFICATION requires mandatory documents to be uploaded
  if (targetStage === 'DOCUMENT_VERIFICATION') {
    const unuploaded = pc.documentRequirements.filter(
      (d) => d.required && d.status === 'REQUIRED'
    );
    if (unuploaded.length > 0) {
      return {
        allowed: false,
        reason: `Cannot move to Document Verification. ${unuploaded.length} required document(s) still not uploaded: ${unuploaded.map((d) => d.title).join(', ')}`,
        blockers: unuploaded.map((d) => `Missing upload: ${d.title}`),
      };
    }
  }

  // 2. Gate: Moving to MEDICAL_PENDING or beyond requires all mandatory documents to be VERIFIED
  if (
    [
      'MEDICAL_PENDING',
      'MEDICAL_SCHEDULED',
      'MEDICAL_COMPLETED',
      'MEDICAL_PASSED',
      'VISA_PREPARATION',
      'VISA_SUBMITTED',
      'VISA_PROCESSING',
      'VISA_APPROVED',
      'CLEARANCE_PENDING',
      'CLEARANCE_PROCESSING',
      'CLEARANCE_COMPLETED',
      'TICKET_PENDING',
      'TICKET_ISSUED',
      'DEPARTURE_READY',
      'DEPARTED',
      'JOINED',
      'COMPLETED',
    ].includes(targetStage)
  ) {
    const unverified = pc.documentRequirements.filter(
      (d) => d.required && d.status !== 'VERIFIED'
    );
    if (unverified.length > 0) {
      return {
        allowed: false,
        reason: `Mandatory document verification gate incomplete. Unverified documents: ${unverified.map((d) => d.title).join(', ')}`,
        blockers: unverified.map((d) => `Unverified document: ${d.title} (Status: ${d.status})`),
      };
    }
  }

  // 3. Gate: Moving to MEDICAL_SCHEDULED requires an appointment date
  if (targetStage === 'MEDICAL_SCHEDULED') {
    if (!pc.medicalCase || !pc.medicalCase.appointmentDate) {
      return {
        allowed: false,
        reason: 'Medical appointment date is required before setting stage to MEDICAL_SCHEDULED.',
      };
    }
  }

  // 4. Gate: Moving to MEDICAL_PASSED requires result = FIT or CONDITIONALLY_FIT
  if (targetStage === 'MEDICAL_PASSED') {
    if (!pc.medicalCase || !['FIT', 'CONDITIONALLY_FIT'].includes(pc.medicalCase.result)) {
      return {
        allowed: false,
        reason: `Cannot mark MEDICAL_PASSED. Medical examination result is: ${pc.medicalCase?.result || 'PENDING'}`,
      };
    }
  }

  // 5. Gate: Progression to VISA stages requires passed medical if medical was scheduled
  if (
    [
      'VISA_PREPARATION',
      'VISA_SUBMITTED',
      'VISA_PROCESSING',
      'VISA_APPROVED',
    ].includes(targetStage)
  ) {
    if (pc.medicalCase && pc.medicalCase.result === 'UNFIT') {
      return {
        allowed: false,
        reason: 'Candidate is medically UNFIT. Visa progression is blocked.',
      };
    }
  }

  // 6. Gate: Moving to VISA_APPROVED requires visa approval details
  if (targetStage === 'VISA_APPROVED') {
    if (!pc.visaCase || pc.visaCase.status !== 'APPROVED') {
      return {
        allowed: false,
        reason: 'Visa application has not been approved yet.',
      };
    }
  }

  // 7. Gate: Moving to TICKET_ISSUED requires ticket
  if (targetStage === 'TICKET_ISSUED') {
    if (!pc.travelTicket || pc.travelTicket.status !== 'ISSUED') {
      return {
        allowed: false,
        reason: 'Valid travel ticket has not been issued yet.',
      };
    }
  }

  // 8. Gate: Moving to DEPARTURE_READY requires 5 pillars
  if (targetStage === 'DEPARTURE_READY') {
    const readiness = await checkDepartureReadiness(prisma, processingCaseId);
    if (!readiness.ready) {
      return {
        allowed: false,
        reason: `Departure readiness gate incomplete. Blockers: ${readiness.blockers.join('; ')}`,
        blockers: readiness.blockers,
      };
    }
  }

  // 9. Gate: Moving to DEPARTED requires DEPARTURE_READY status
  if (targetStage === 'DEPARTED') {
    if (pc.currentStage !== 'DEPARTURE_READY') {
      return {
        allowed: false,
        reason: 'Candidate must be confirmed in DEPARTURE_READY stage before marking DEPARTED.',
      };
    }
  }

  // 10. Gate: Moving to JOINED requires DEPARTED status
  if (targetStage === 'JOINED') {
    if (pc.currentStage !== 'DEPARTED') {
      return {
        allowed: false,
        reason: 'Candidate must have DEPARTED before confirming overseas job joining.',
      };
    }
  }

  // 11. Gate: Moving to COMPLETED requires JOINED status
  if (targetStage === 'COMPLETED') {
    if (pc.currentStage !== 'JOINED' && pc.currentStage !== 'COMPLETED') {
      return {
        allowed: false,
        reason: 'Recruitment case can only be marked COMPLETED after candidate has successfully JOINED overseas employer.',
      };
    }
  }

  return { allowed: true };
}

/**
 * Checks all 5 pillars of overseas deployment readiness:
 * 1. Mandatory documents verified
 * 2. Medical passed
 * 3. Visa approved
 * 4. Clearance completed
 * 5. Ticket issued
 */
export async function checkDepartureReadiness(
  prisma: PrismaClient,
  processingCaseId: string
): Promise<DepartureReadinessResult> {
  const pc = await prisma.recruitmentProcessingCase.findUnique({
    where: { id: processingCaseId },
    include: {
      documentRequirements: true,
      medicalCase: true,
      visaCase: true,
      clearanceCase: true,
      travelTicket: true,
      departureCase: true,
    },
  });

  if (!pc) {
    return {
      ready: false,
      blockers: ['Processing case not found'],
      pillarStatus: {
        documents: { passed: false, message: 'Case not found' },
        medical: { passed: false, message: 'Case not found' },
        visa: { passed: false, message: 'Case not found' },
        clearance: { passed: false, message: 'Case not found' },
        ticket: { passed: false, message: 'Case not found' },
      },
    };
  }

  const blockers: string[] = [];

  // Pillar 1: Mandatory Documents
  const unverifiedDocs = pc.documentRequirements.filter(
    (d) => d.required && d.status !== 'VERIFIED'
  );
  const docsPassed = unverifiedDocs.length === 0;
  if (!docsPassed) {
    blockers.push(`Mandatory documents unverified (${unverifiedDocs.length} pending: ${unverifiedDocs.map((d) => d.title).join(', ')})`);
  }

  // Pillar 2: Medical Fitness
  const medPassed = !pc.medicalCase || ['FIT', 'CONDITIONALLY_FIT'].includes(pc.medicalCase.result);
  if (!medPassed) {
    blockers.push(`Medical examination not passed (Current: ${pc.medicalCase?.result || 'PENDING'})`);
  }

  // Pillar 3: Visa Approval
  const visaPassed = !pc.visaCase || pc.visaCase.status === 'APPROVED';
  if (!visaPassed) {
    blockers.push(`Visa not approved (Current: ${pc.visaCase?.status || 'PREPARATION'})`);
  }

  // Pillar 4: Emigration & Police Clearance
  const clearancePassed = !pc.clearanceCase || pc.clearanceCase.status === 'COMPLETED';
  if (!clearancePassed) {
    blockers.push(`Government clearance incomplete (Current: ${pc.clearanceCase?.status || 'NOT_STARTED'})`);
  }

  // Pillar 5: Travel Ticket
  const ticketPassed = Boolean(pc.travelTicket && pc.travelTicket.status === 'ISSUED');
  if (!ticketPassed) {
    blockers.push(`Flight ticket not issued (Current: ${pc.travelTicket?.status || 'PENDING'})`);
  }

  // Overall case status checks
  if (pc.overallStatus === 'ON_HOLD') {
    blockers.push(`Processing case is currently ON HOLD (${pc.holdReason || 'No reason specified'})`);
  }
  if (pc.overallStatus === 'CANCELLED') {
    blockers.push(`Processing case has been CANCELLED (${pc.cancellationReason || 'No reason specified'})`);
  }

  const ready = blockers.length === 0;

  return {
    ready,
    blockers,
    pillarStatus: {
      documents: {
        passed: docsPassed,
        message: docsPassed ? 'All mandatory documents verified' : `${unverifiedDocs.length} documents pending verification`,
      },
      medical: {
        passed: medPassed,
        message: medPassed ? (pc.medicalCase ? `Passed (${pc.medicalCase.result})` : 'Medical not required') : `Medical result: ${pc.medicalCase?.result}`,
      },
      visa: {
        passed: visaPassed,
        message: visaPassed ? (pc.visaCase ? 'Visa Approved' : 'Visa not required') : `Visa status: ${pc.visaCase?.status}`,
      },
      clearance: {
        passed: clearancePassed,
        message: clearancePassed ? (pc.clearanceCase ? 'Clearance Completed' : 'Clearance not required') : `Clearance status: ${pc.clearanceCase?.status}`,
      },
      ticket: {
        passed: ticketPassed,
        message: ticketPassed ? `Ticket Issued (${pc.travelTicket?.airline} - ${pc.travelTicket?.flightNumber})` : 'Ticket Pending',
      },
    },
  };
}

/**
 * Initializes default required documents when a processing case is started
 */
export const DEFAULT_REQUIRED_DOCS = [
  { documentType: 'PASSPORT', title: 'Passport (Original & Clear Copy)', titleLocal: 'মূল পাসপোর্ট ও রঙিন কপি', required: true },
  { documentType: 'NID', title: 'National ID Card / Birth Certificate', titleLocal: 'জাতীয় পরিচয়পত্র / জন্ম সনদ', required: true },
  { documentType: 'EMPLOYMENT_CONTRACT', title: 'Overseas Employment Agreement / Work Contract', titleLocal: 'বিদেশি কর্মচুক্তি পত্র', required: true },
  { documentType: 'POLICE_CLEARANCE', title: 'Police Clearance Certificate', titleLocal: 'পুলিশ ক্লিয়ারেন্স সার্টিফিকেট', required: true },
  { documentType: 'MEDICAL_FITNESS', title: 'GAMCA Medical Fitness Certificate', titleLocal: 'গামকা মেডিকেল ফিটনেস রিপোর্ট', required: true },
];
