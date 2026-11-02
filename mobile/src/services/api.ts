import { Platform } from 'react-native';
import { MOCK_TRACKING_DATABASE, ALL_JOBS } from '../data/mockData';
import { JobCircular, VisaTrackingResult } from '../types';
import { getJobImage } from '../utils/jobImages';

// Dynamic API Base URL supporting localhost, LAN IP (192.168.0.127), and Android Emulator
export const getApiBaseUrl = (): string => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3000/api`;
    }
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }
  return 'http://localhost:3000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export interface LoginResult {
  success: boolean;
  token?: string;
  userType?: 'CANDIDATE' | 'STAFF';
  role?: string;
  data?: any;
  error?: string;
}

export const ApiService = {
  /**
   * Login candidate or ERP staff using same username (Phone, Email, Applicant Number, Passport) and password
   */
  async login(identifier: string, password: string): Promise<LoginResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/portal/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে ইন্টারনেট ও সার্ভার চালু আছে কি না পরীক্ষা করুন।',
      };
    }
  },

  /**
   * Fetch current authenticated applicant profile from ERP database
   */
  async getProfile(token: string): Promise<any | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/portal/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return json.data.applicant;
        }
      }
    } catch {
      // Return null on failure
    }
    return null;
  },

  /**
   * Fetch current candidate applications from ERP database
   */
  async getApplications(token: string): Promise<any[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/portal/applications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {
      // Return empty array
    }
    return [];
  },

  /**
   * Fetch current candidate documents from ERP database
   */
  async getDocuments(token: string): Promise<any[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/portal/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && Array.isArray(json.data.documents)) {
          return json.data.documents;
        }
      }
    } catch {
      // Return empty array
    }
    return [];
  },

  /**
   * Fetch candidate financial summary and invoices from ERP database
   */
  async getFinance(token: string): Promise<any | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/portal/finance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // Return null
    }
    return null;
  },

  /**
   * Register new candidate directly into ERP database
   */
  async register(formData: any): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/portal/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await response.json();
      return json;
    } catch {
      return { success: false, error: 'সার্ভারে নিবন্ধন পাঠানো যায়নি।' };
    }
  },

  /**
   * Track Visa or Application status by passport or application code
   */
  async trackApplication(query: string): Promise<VisaTrackingResult | null> {
    const cleanQuery = query.trim().toUpperCase();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/track?q=${encodeURIComponent(cleanQuery)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.data) {
          const item = data.data;
          // Transform backend response to mobile app model
          const candidateName = item.candidateName || item.applicant?.fullName || item.applicant?.name || 'আবেদনকারী';
          const jobTitle = item.jobTitle || item.job?.title || 'সাধারণ কর্মী';
          const countryName = item.countryName || item.job?.country?.name || 'সৌদি আরব';
          const stageTitle = item.stageTitle || item.stageTitleBn || 'প্রসেসিং চলমান';

          return {
            passportNumber: item.passportNumber || item.applicant?.passportNumber || cleanQuery,
            candidateName,
            jobTitle,
            country: countryName,
            flag: countryName.toLowerCase().includes('saudi') ? '🇸🇦' : (item.job?.country?.flag || '🇸🇦'),
            agencyRef: item.applicationCode || item.slipNumber || item.applicantNumber || 'ST-2026-LIVE',
            status: item.status || 'UNDER_REVIEW',
            statusLabel: stageTitle,
            updatedAt: new Date(item.lastUpdated || item.updatedAt || Date.now()).toLocaleDateString('bn-BD', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }),
            steps: [
              { title: 'Screening', titleBn: 'নিবন্ধন ও ইন্টারভিউ', desc: 'বাছাই প্রক্রিয়া সম্পন্ন', completed: true, current: (item.stageIndex || 1) === 1 },
              { title: 'Medical', titleBn: 'মেডিকেল ফিটনেস', desc: 'স্বাস্থ্য পরীক্ষা', completed: (item.stageIndex || 1) >= 4, current: (item.stageIndex || 1) === 4 },
              { title: 'Visa', titleBn: 'ভিসা অনুমোদন ও স্ট্যাম্পিং', desc: 'দূতাবাস কার্যক্রম', completed: (item.stageIndex || 1) >= 5, current: (item.stageIndex || 1) === 5 },
              { title: 'BMET', titleBn: 'বিএমইটি স্মার্ট কার্ড', desc: 'সরকারি ছাড়পত্র', completed: (item.stageIndex || 1) >= 6, current: (item.stageIndex || 1) === 6 },
              { title: 'Flight', titleBn: 'ফ্লাইট ও ডিপার্চার', desc: 'যাত্রা প্রস্তুতি', completed: (item.stageIndex || 1) >= 7, current: (item.stageIndex || 1) === 7 },
            ],
          };
        }
      }
    } catch {
      // Fallback seamlessly to mock database
    }

    // Fallback to local mock database
    return MOCK_TRACKING_DATABASE[cleanQuery] || null;
  },

  /**
   * Fetch active job circulars from ERP database
   */
  async getJobs(): Promise<JobCircular[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/jobs?status=PUBLISHED&limit=30`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json && json.data) {
          const items = Array.isArray(json.data) ? json.data : json.data.items;
          if (Array.isArray(items) && items.length > 0) {
            return items.map((j: any) => ({
              id: j.id,
              title: j.title,
              titleBn: j.titleBn || j.title,
              country: j.country?.name || 'সৌদি আরব',
              countryCode: j.country?.code || 'KSA',
              flag: j.country?.flag || '🇸🇦',
              companyName: j.employer?.companyName || 'স্বনামধন্য প্রতিষ্ঠান',
              salary: j.salaryRange || `${j.salaryMin || 2000} - ${j.salaryMax || 2500}`,
              currency: j.currency || 'SAR',
              vacancies: j.vacancyCount || j.vacancies || 10,
              deadline: j.applicationDeadline ? new Date(j.applicationDeadline).toLocaleDateString('en-GB') : 'Open',
              category: j.jobCategory?.slug || j.category?.slug || 'general',
              tags: [j.featured ? 'Featured' : 'Urgent', 'Govt Approved'],
              imageUrl: getJobImage({
                category: j.jobCategory?.slug || j.category?.slug,
                title: j.title,
                titleBn: j.titleBn,
              }),
            }));
          }
        }
      }
    } catch {
      // Offline fallback
    }

    return ALL_JOBS;
  },
};
