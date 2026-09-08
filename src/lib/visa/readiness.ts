import { PrismaClient } from '@prisma/client';

export interface ReadinessItem {
  id: string;
  name: string;
  category: 'PASSPORT' | 'VISA' | 'CONTRACT' | 'TICKET' | 'MEDICAL' | 'CLEARANCE' | 'EMPLOYER' | 'EMERGENCY_CONTACT';
  isReady: boolean;
  statusText: string;
  details?: string;
  expiryDate?: Date | null;
  isExpired?: boolean;
  daysToExpiry?: number | null;
}

export interface DepartureReadinessReport {
  visaApplicationId: string;
  visaApplicationNumber: string;
  applicantName: string;
  isReadyForDeparture: boolean;
  status: 'READY' | 'NOT_READY';
  completionPercentage: number;
  totalChecks: number;
  passedChecks: number;
  items: ReadinessItem[];
  missingItems: ReadinessItem[];
  warnings: string[];
}

/**
 * Evaluates candidate departure readiness based on real database records
 */
export async function calculateDepartureReadiness(
  prisma: PrismaClient,
  visaApplicationId: string
): Promise<DepartureReadinessReport | null> {
  const visaApp = await prisma.visaApplication.findUnique({
    where: { id: visaApplicationId },
    include: {
      applicant: {
        include: {
          profile: true,
          documents: {
            include: { documentType: true },
          },
        },
      },
      application: {
        include: {
          job: {
            include: { employer: true },
          },
          documents: {
            include: { documentType: true },
          },
        },
      },
      country: true,
    },
  });

  if (!visaApp) return null;

  const now = new Date();
  const applicant = visaApp.applicant;
  const profile = applicant.profile;
  const employer = visaApp.application.job.employer;

  // Combine applicant and application documents
  const allDocs = [...applicant.documents, ...visaApp.application.documents];

  const items: ReadinessItem[] = [];
  const warnings: string[] = [];

  // 1. Passport Check
  const passportExpiry = applicant.passportExpiry;
  let passportReady = false;
  let passportStatus = 'Missing passport details';
  let passportDaysToExpiry: number | null = null;
  let passportIsExpired = false;

  if (applicant.passportNumber && passportExpiry) {
    passportDaysToExpiry = Math.ceil((passportExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    passportIsExpired = passportDaysToExpiry <= 0;

    if (passportIsExpired) {
      passportStatus = `Expired on ${passportExpiry.toISOString().split('T')[0]}`;
      warnings.push(`Passport is expired (${applicant.passportNumber})`);
    } else if (passportDaysToExpiry < 180) {
      passportStatus = `Expires in ${passportDaysToExpiry} days (< 6 months requirement)`;
      warnings.push(`Passport has less than 6 months validity (${passportDaysToExpiry} days left)`);
    } else {
      passportReady = true;
      passportStatus = `Valid (${passportDaysToExpiry} days left)`;
    }
  }

  items.push({
    id: 'passport',
    name: 'Passport (Validity > 6 Months)',
    category: 'PASSPORT',
    isReady: passportReady,
    statusText: passportStatus,
    details: applicant.passportNumber ? `No: ${applicant.passportNumber}` : undefined,
    expiryDate: passportExpiry,
    isExpired: passportIsExpired,
    daysToExpiry: passportDaysToExpiry,
  });

  // 2. Visa Approval Check
  const isVisaApproved = visaApp.status === 'APPROVED' || visaApp.status === 'COMPLETED';
  let visaDaysToExpiry: number | null = null;
  let visaIsExpired = false;
  let visaStatus = `Status: ${visaApp.status}`;

  if (visaApp.visaExpiryDate) {
    visaDaysToExpiry = Math.ceil((visaApp.visaExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    visaIsExpired = visaDaysToExpiry <= 0;
    if (visaIsExpired) {
      visaStatus = `Expired on ${visaApp.visaExpiryDate.toISOString().split('T')[0]}`;
      warnings.push('Visa has expired');
    }
  }

  items.push({
    id: 'visa',
    name: 'Visa Stamped & Approved',
    category: 'VISA',
    isReady: isVisaApproved && !visaIsExpired,
    statusText: isVisaApproved ? (visaIsExpired ? 'Expired' : 'Approved') : visaStatus,
    details: visaApp.referenceNumber ? `Ref: ${visaApp.referenceNumber}` : undefined,
    expiryDate: visaApp.visaExpiryDate,
    isExpired: visaIsExpired,
    daysToExpiry: visaDaysToExpiry,
  });

  // 3. Employment Contract Document
  const contractDoc = allDocs.find((d) => 
    d.documentType.code === 'EMPLOYMENT_CONTRACT' || 
    d.documentType.name.toLowerCase().includes('contract')
  );
  const isContractVerified = contractDoc?.status === 'VERIFIED';
  items.push({
    id: 'contract',
    name: 'Employment Contract',
    category: 'CONTRACT',
    isReady: isContractVerified,
    statusText: isContractVerified ? 'Verified' : contractDoc ? `Status: ${contractDoc.status}` : 'Not Uploaded',
  });

  // 4. Flight Ticket / Travel Booking
  const ticketDoc = allDocs.find((d) => 
    d.documentType.code === 'AIR_TICKET' || 
    d.documentType.name.toLowerCase().includes('ticket') ||
    d.fileName.toLowerCase().includes('ticket')
  );
  const isTicketUploaded = !!ticketDoc;
  items.push({
    id: 'ticket',
    name: 'Air Ticket / Travel Booking',
    category: 'TICKET',
    isReady: isTicketUploaded,
    statusText: ticketDoc ? (ticketDoc.status === 'VERIFIED' ? 'Verified' : 'Uploaded') : 'Pending Booking',
  });

  // 5. Medical Fitness Certificate
  const medicalDoc = allDocs.find((d) => 
    d.documentType.code === 'MEDICAL_REPORT' || 
    d.documentType.name.toLowerCase().includes('medical')
  );
  let medicalReady = false;
  let medicalStatus = 'Not Uploaded';
  let medicalDaysToExpiry: number | null = null;
  let medicalIsExpired = false;

  if (medicalDoc) {
    if (medicalDoc.expiryDate) {
      medicalDaysToExpiry = Math.ceil((medicalDoc.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      medicalIsExpired = medicalDaysToExpiry <= 0;
    }
    if (medicalIsExpired) {
      medicalStatus = 'Expired';
      warnings.push('Medical fitness certificate is expired');
    } else if (medicalDoc.status === 'VERIFIED') {
      medicalReady = true;
      medicalStatus = 'Verified Fit';
    } else {
      medicalStatus = `Status: ${medicalDoc.status}`;
    }
  }

  items.push({
    id: 'medical',
    name: 'Medical Fitness (GAMCA/Authorized)',
    category: 'MEDICAL',
    isReady: medicalReady,
    statusText: medicalStatus,
    expiryDate: medicalDoc?.expiryDate,
    isExpired: medicalIsExpired,
    daysToExpiry: medicalDaysToExpiry,
  });

  // 6. Police Clearance
  const policeDoc = allDocs.find((d) => 
    d.documentType.code === 'POLICE_CLEARANCE' || 
    d.documentType.name.toLowerCase().includes('police')
  );
  let policeReady = false;
  let policeStatus = 'Not Uploaded';
  let policeDaysToExpiry: number | null = null;
  let policeIsExpired = false;

  if (policeDoc) {
    if (policeDoc.expiryDate) {
      policeDaysToExpiry = Math.ceil((policeDoc.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      policeIsExpired = policeDaysToExpiry <= 0;
    }
    if (policeIsExpired) {
      policeStatus = 'Expired';
      warnings.push('Police clearance certificate is expired');
    } else if (policeDoc.status === 'VERIFIED') {
      policeReady = true;
      policeStatus = 'Verified Clear';
    } else {
      policeStatus = `Status: ${policeDoc.status}`;
    }
  }

  items.push({
    id: 'police_clearance',
    name: 'Police Clearance Certificate',
    category: 'CLEARANCE',
    isReady: policeReady,
    statusText: policeStatus,
    expiryDate: policeDoc?.expiryDate,
    isExpired: policeIsExpired,
    daysToExpiry: policeDaysToExpiry,
  });

  // 7. Employer Information
  const isEmployerValid = !!employer && (employer.verificationStatus === 'VERIFIED' || !!employer.companyName);
  items.push({
    id: 'employer',
    name: 'Overseas Employer Verification',
    category: 'EMPLOYER',
    isReady: isEmployerValid,
    statusText: isEmployerValid ? `Confirmed: ${employer?.companyName || 'Verified'}` : 'Pending Confirmation',
    details: employer ? `${employer.companyName} (${employer.countryId || ''})` : undefined,
  });

  // 8. Emergency Contact
  const hasEmergencyContact = !!(profile?.emergencyContact && profile.emergencyContact.trim().length > 0);
  items.push({
    id: 'emergency_contact',
    name: 'Emergency Contact Person',
    category: 'EMERGENCY_CONTACT',
    isReady: hasEmergencyContact,
    statusText: hasEmergencyContact ? 'Registered' : 'Missing in Profile',
    details: profile?.emergencyContact || undefined,
  });

  const totalChecks = items.length;
  const passedChecks = items.filter((i) => i.isReady).length;
  const missingItems = items.filter((i) => !i.isReady);
  const completionPercentage = Math.round((passedChecks / totalChecks) * 100);
  const isReadyForDeparture = missingItems.length === 0;

  return {
    visaApplicationId: visaApp.id,
    visaApplicationNumber: visaApp.visaApplicationNumber,
    applicantName: applicant.fullName,
    isReadyForDeparture,
    status: isReadyForDeparture ? 'READY' : 'NOT_READY',
    completionPercentage,
    totalChecks,
    passedChecks,
    items,
    missingItems,
    warnings,
  };
}

export { calculateDepartureReadiness as evaluateDepartureReadiness };
