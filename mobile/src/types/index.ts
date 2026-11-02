export interface JobCircular {
  id: string;
  title: string;
  titleBn?: string;
  country: string;
  countryCode: string;
  flag: string;
  companyName: string;
  salary: string;
  currency: string;
  vacancies: number;
  deadline: string;
  category: string;
  tags: string[];
  imageUrl?: string;
}

export type ProcessingStatus = 
  | 'REGISTERED' 
  | 'MEDICAL_PASSED' 
  | 'VISA_SUBMITTED' 
  | 'VISA_APPROVED' 
  | 'BMET_CARD_ISSUED' 
  | 'FLIGHT_READY' 
  | 'DEPARTED';

export interface TrackingStep {
  title: string;
  titleBn: string;
  desc: string;
  completed: boolean;
  current: boolean;
  date?: string;
}

export interface VisaTrackingResult {
  passportNumber: string;
  candidateName: string;
  jobTitle: string;
  country: string;
  flag: string;
  agencyRef: string;
  status: ProcessingStatus;
  statusLabel: string;
  updatedAt: string;
  steps: TrackingStep[];
}

export interface DestinationCountry {
  id: string;
  name: string;
  nameBn: string;
  flag: string;
  code: string;
  activeDemands: number;
}
