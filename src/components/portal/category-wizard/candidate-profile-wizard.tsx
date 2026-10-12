'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  User,
  Camera,
  FileText,
  GraduationCap,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldCheck,
  Upload,
  Calendar,
  MapPin,
  Building2,
  Banknote,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Check,
  Edit2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/components/ui/toast';
import { BRAND } from '@/config/brand';
import { getCountryFlagUrl, getCountryImage } from '@/lib/image-constants';

interface CandidateProfileWizardProps {
  jobId: string;
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: (appData: any) => void;
}

const WIZARD_STEPS = [
  { id: 0, key: 'confirmation', title: 'Job Confirmation', titleBn: 'পদ নিশ্চিতকরণ' },
  { id: 1, key: 'personal', title: 'Personal Information', titleBn: 'ব্যক্তিগত তথ্য' },
  { id: 2, key: 'photo', title: 'Profile Photo', titleBn: 'প্রোফাইল ছবি' },
  { id: 3, key: 'passport', title: 'Passport & Identity', titleBn: 'পাসপোর্ট ও পরিচয়' },
  { id: 4, key: 'education', title: 'Education', titleBn: 'শিক্ষাগত যোগ্যতা' },
  { id: 5, key: 'experience', title: 'Experience & Skills', titleBn: 'অভিজ্ঞতা ও দক্ষতা' },
  { id: 6, key: 'eligibility', title: 'Job Eligibility', titleBn: 'কাজের যোগ্যতা' },
  { id: 7, key: 'documents', title: 'Documents', titleBn: 'নথিপত্র সংযুক্তি' },
  { id: 8, key: 'review', title: 'Review & Submit', titleBn: 'পর্যালোচনা ও নিশ্চিতকরণ' },
];

export const CandidateProfileWizard: React.FC<CandidateProfileWizardProps> = ({
  jobId,
  isModal = false,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { success, error: toastError } = useToast();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Loaded metadata & state
  const [job, setJob] = useState<any | null>(null);
  const [applicant, setApplicant] = useState<any | null>(null);
  const [quota, setQuota] = useState<{ currentCount: number; maxLimit: number; isLimitReached: boolean }>({
    currentCount: 0,
    maxLimit: 3,
    isLimitReached: false,
  });
  const [existingSubmittedApp, setExistingSubmittedApp] = useState<any | null>(null);
  const [existingDraftApp, setExistingDraftApp] = useState<any | null>(null);
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);

  // Step 1: Personal Info
  const [personalForm, setPersonalForm] = useState({
    fullName: '',
    fullNameBn: '',
    dateOfBirth: '',
    gender: 'MALE',
    phone: '',
    email: '',
    district: '',
    upazila: '',
    address: '',
    permanentAddress: '',
    sameAsPresent: false,
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
  });

  // Step 2: Photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Passport & Identity
  const [passportForm, setPassportForm] = useState({
    passportAvailable: false,
    passportNumber: '',
    issueDate: '',
    expiryDate: '',
    issuingCountry: 'Bangladesh',
    nidNumber: '',
    birthRegNumber: '',
  });

  // Step 4: Education
  const [educationForm, setEducationForm] = useState({
    highestLevel: 'SSC',
    institution: '',
    degree: '',
    passingYear: '',
    result: '',
    technicalTraining: '',
  });

  // Step 5: Work Experience & Skills
  const [experienceForm, setExperienceForm] = useState({
    status: 'EXPERIENCED', // 'EXPERIENCED' | 'FRESHER'
    occupation: '',
    employer: '',
    yearsOfExperience: 2,
    experienceCountry: 'BANGLADESH', // 'BANGLADESH' | 'OVERSEAS'
    skills: '',
    languages: 'Bangla, Basic English',
  });

  // Step 6: Job-Specific Eligibility
  const [eligibilityForm, setEligibilityForm] = useState({
    meetsExperience: true,
    meetsEducation: true,
    healthDeclaration: true,
    policeClearance: true,
    joiningAvailability: 'IMMEDIATE', // 'IMMEDIATE' | '1_MONTH' | '2_MONTHS'
    salaryAgreed: true,
    additionalNotes: '',
  });

  // Step 7: Documents
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<string>('');

  // Step 8: Confirmation
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [accuracyConfirmed, setAccuracyConfirmed] = useState(false);
  const [submittedAppResult, setSubmittedAppResult] = useState<any | null>(null);

  // Load Wizard Draft Data
  useEffect(() => {
    let isMounted = true;
    async function loadWizardData() {
      setLoading(true);
      setGlobalError(null);
      try {
        const [wizardRes, docRes] = await Promise.all([
          fetch(`/api/portal/jobs/${jobId}/wizard-draft`),
          fetch('/api/portal/documents'),
        ]);

        const wizardData = await wizardRes.json();
        const docData = await docRes.json();

        if (!isMounted) return;

        if (wizardData.success) {
          const { job: j, applicant: a, quota: q, existingApplication: existing } = wizardData.data;
          setJob(j);
          setApplicant(a);
          if (q) setQuota(q);

          if (docData.success) {
            setAvailableDocuments(docData.data?.documents || []);
            setDocumentTypes(docData.data?.documentTypes || []);
            if (docData.data?.documentTypes?.length > 0) {
              setSelectedDocTypeId(docData.data.documentTypes[0].id);
            }
          }

          // Check if already submitted
          if (existing && existing.isSubmitted) {
            setExistingSubmittedApp(existing);
          } else if (existing) {
            setExistingDraftApp(existing);
            // Restore draft progress
            if (existing.completedSteps) {
              setCompletedSteps(existing.completedSteps);
            }
            if (existing.draftStep && existing.draftStep > 0) {
              setCurrentStep(existing.draftStep);
            }
            if (existing.draftAnswers) {
              setEligibilityForm((prev) => ({ ...prev, ...existing.draftAnswers }));
            }
          }

          // Populate initial forms from applicant record
          if (a) {
            setPersonalForm({
              fullName: a.fullName || '',
              fullNameBn: '',
              dateOfBirth: a.dateOfBirth ? a.dateOfBirth.split('T')[0] : '',
              gender: a.gender || 'MALE',
              phone: a.phone || '',
              email: a.email || '',
              district: a.district || '',
              upazila: a.upazila || '',
              address: a.address || a.profile?.currentAddress || '',
              permanentAddress: a.profile?.permanentAddress || '',
              sameAsPresent: a.address && a.profile?.permanentAddress ? a.address === a.profile.permanentAddress : false,
              emergencyName: '',
              emergencyRelation: '',
              emergencyPhone: a.profile?.emergencyContact || '',
            });

            if (a.profilePhoto) {
              setPhotoPreview(a.profilePhoto);
            }

            setPassportForm({
              passportAvailable: Boolean(a.passportAvailable),
              passportNumber: a.passportNumber || '',
              issueDate: '',
              expiryDate: a.passportExpiry ? a.passportExpiry.split('T')[0] : '',
              issuingCountry: 'Bangladesh',
              nidNumber: '',
              birthRegNumber: '',
            });

            setEducationForm({
              highestLevel: a.education || a.profile?.education || 'SSC',
              institution: '',
              degree: '',
              passingYear: '',
              result: '',
              technicalTraining: '',
            });

            setExperienceForm({
              status: (a.yearsOfExperience && a.yearsOfExperience > 0) || a.profession ? 'EXPERIENCED' : 'FRESHER',
              occupation: a.profession || '',
              employer: '',
              yearsOfExperience: a.yearsOfExperience || 0,
              experienceCountry: 'BANGLADESH',
              skills: a.skills || a.profile?.skills || '',
              languages: a.languages || 'Bangla, Basic English',
            });
          }
        } else {
          setGlobalError(wizardData.error || 'Failed to load job application details');
        }
      } catch (err: any) {
        setGlobalError('Network error connecting to server. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWizardData();
    return () => {
      isMounted = false;
    };
  }, [jobId]);

  // Validation function for current active category
  const validateCategory = (stepNum: number): boolean => {
    const errs: Record<string, string> = {};

    if (stepNum === 1) {
      if (!personalForm.fullName.trim() || personalForm.fullName.trim().length < 2) {
        errs.fullName = language === 'bn' ? 'ইংরেজি পূর্ণ নাম প্রদান করুন (কমপক্ষে ২ অক্ষর)' : 'Full name in English is required';
      }
      if (!personalForm.phone.trim() || !/^(\+?8801|01)[3-9]\d{8}$/.test(personalForm.phone.replace(/[\s-]/g, ''))) {
        errs.phone = language === 'bn' ? 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)' : 'Valid Bangladeshi phone number required';
      }
      if (!personalForm.dateOfBirth) {
        errs.dateOfBirth = language === 'bn' ? 'জন্মতারিখ প্রদান করুন' : 'Date of birth is required';
      } else {
        const birthDate = new Date(personalForm.dateOfBirth);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        if (age < 18) {
          errs.dateOfBirth = language === 'bn' ? 'প্রার্থীর বয়স কমপক্ষে ১৮ বছর হতে হবে' : 'Applicant must be at least 18 years old';
        }
      }
      if (!personalForm.district.trim()) {
        errs.district = language === 'bn' ? 'নিজ জেলা নির্বাচন করুন' : 'District is required';
      }
      if (!personalForm.address.trim()) {
        errs.address = language === 'bn' ? 'বর্তমান ঠিকানা প্রদান করুন' : 'Current address is required';
      }
      if (!personalForm.emergencyPhone.trim()) {
        errs.emergencyPhone = language === 'bn' ? 'জরুরি যোগাযোগের ফোন নম্বর প্রদান করুন' : 'Emergency contact phone is required';
      }
    } else if (stepNum === 2) {
      if (!photoPreview) {
        errs.photo = language === 'bn' ? 'পাসপোর্ট সাইজের রঙিন ছবি আপলোড করা আবশ্যক' : 'Profile photo is required';
      }
    } else if (stepNum === 3) {
      if (passportForm.passportAvailable) {
        if (!passportForm.passportNumber.trim() || passportForm.passportNumber.trim().length < 6) {
          errs.passportNumber = language === 'bn' ? 'সঠিক পাসপোর্ট নম্বর প্রদান করুন' : 'Valid passport number is required';
        }
        if (!passportForm.expiryDate) {
          errs.expiryDate = language === 'bn' ? 'পাসপোর্টের মেয়াদোত্তীর্ণের তারিখ দিন' : 'Passport expiry date is required';
        } else {
          const expDate = new Date(passportForm.expiryDate);
          if (expDate <= new Date()) {
            errs.expiryDate = language === 'bn' ? 'পাসপোর্টের মেয়াদ অবশ্যই ভবিষ্যৎ তারিখ হতে হবে' : 'Passport must not be expired';
          }
        }
      } else {
        if (!passportForm.nidNumber.trim() || passportForm.nidNumber.trim().length < 10) {
          errs.nidNumber = language === 'bn' ? 'পাসপোর্ট না থাকলে সঠিক জাতীয় পরিচয়পত্র (NID) নম্বর দিন' : 'Valid NID number is required if passport is unavailable';
        }
      }
    } else if (stepNum === 4) {
      if (!educationForm.highestLevel) {
        errs.highestLevel = language === 'bn' ? 'সর্বোচ্চ শিক্ষাগত স্তর নির্বাচন করুন' : 'Highest education level is required';
      }
      if (!educationForm.institution.trim()) {
        errs.institution = language === 'bn' ? 'শিক্ষা প্রতিষ্ঠান / বোর্ডের নাম লিখুন' : 'Institution name is required';
      }
    } else if (stepNum === 5) {
      if (experienceForm.status === 'EXPERIENCED') {
        if (!experienceForm.occupation.trim()) {
          errs.occupation = language === 'bn' ? 'পেশা বা পদবী উল্লেখ করুন' : 'Occupation / trade is required';
        }
        if (experienceForm.yearsOfExperience < 0) {
          errs.yearsOfExperience = language === 'bn' ? 'অভিজ্ঞতার বছর লিখুন' : 'Valid years of experience is required';
        }
      }
    } else if (stepNum === 6) {
      if (!eligibilityForm.healthDeclaration) {
        errs.healthDeclaration = language === 'bn' ? 'বৈদেশিক কর্মসংস্থানে মেডিকেল ফিটনেস ঘোষণা নিশ্চিত করুন' : 'Health fitness declaration is required';
      }
      if (!eligibilityForm.policeClearance) {
        errs.policeClearance = language === 'bn' ? 'পুলিশ ক্লিয়ারেন্স সংক্রান্ত ঘোষণা নিশ্চিত করুন' : 'Police clearance declaration is required';
      }
      if (!eligibilityForm.salaryAgreed) {
        errs.salaryAgreed = language === 'bn' ? 'সার্কুলার অনুযায়ী বেতন ও শর্তাবলীতে সম্মতি প্রদান করুন' : 'You must agree to the designated salary & terms';
      }
    } else if (stepNum === 8) {
      if (!accuracyConfirmed) {
        errs.accuracyConfirmed = language === 'bn' ? 'সকল তথ্যের সত্যতা নিশ্চিতকরণ আবশ্যক' : 'You must confirm the accuracy of your details';
      }
      if (!termsAgreed) {
        errs.termsAgreed = language === 'bn' ? 'রিক্রুটমেন্ট নিয়মাবলী ও গোপনীয়তা শর্তাবলীতে সম্মতি দিন' : 'You must accept recruitment terms & privacy policy';
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Save category progress to backend draft
  const saveCategoryProgress = async (stepNum: number) => {
    setSaving(true);
    setGlobalError(null);

    try {
      const updatedCompleted = Array.from(new Set([...completedSteps, stepNum]));

      // Gather profile updates from state
      const profileData: any = {};
      if (stepNum === 1) {
        profileData.fullName = personalForm.fullName.trim();
        profileData.phone = personalForm.phone.trim();
        profileData.email = personalForm.email.trim() || null;
        profileData.gender = personalForm.gender;
        profileData.dateOfBirth = personalForm.dateOfBirth;
        profileData.district = personalForm.district.trim();
        profileData.upazila = personalForm.upazila.trim() || null;
        profileData.address = personalForm.address.trim();
        profileData.permanentAddress = personalForm.sameAsPresent
          ? personalForm.address.trim()
          : personalForm.permanentAddress.trim() || personalForm.address.trim();
        profileData.emergencyContact = personalForm.emergencyPhone.trim();
      } else if (stepNum === 2) {
        if (photoPreview) profileData.profilePhoto = photoPreview;
      } else if (stepNum === 3) {
        profileData.passportAvailable = passportForm.passportAvailable;
        profileData.passportNumber = passportForm.passportAvailable ? passportForm.passportNumber.trim() : null;
        profileData.passportExpiry = passportForm.passportAvailable && passportForm.expiryDate ? passportForm.expiryDate : null;
      } else if (stepNum === 4) {
        profileData.education = `${educationForm.highestLevel} - ${educationForm.institution.trim()}`;
      } else if (stepNum === 5) {
        profileData.profession = experienceForm.status === 'EXPERIENCED' ? experienceForm.occupation.trim() : 'Fresher';
        profileData.yearsOfExperience = experienceForm.status === 'EXPERIENCED' ? Number(experienceForm.yearsOfExperience) || 0 : 0;
        profileData.skills = experienceForm.skills.trim() || null;
        profileData.languages = experienceForm.languages.trim() || null;
      }

      const res = await fetch(`/api/portal/jobs/${jobId}/wizard-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: stepNum + 1,
          completedSteps: updatedCompleted,
          profileData,
          eligibilityAnswers: eligibilityForm,
          documentIds: selectedDocIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCompletedSteps(updatedCompleted);
        return true;
      } else {
        setGlobalError(data.error || 'Failed to save progress. Please check inputs.');
        return false;
      }
    } catch {
      setGlobalError('Network error saving draft progress.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Next Button handler
  const handleContinue = async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
      return;
    }

    const isValid = validateCategory(currentStep);
    if (!isValid) {
      return;
    }

    const saved = await saveCategoryProgress(currentStep);
    if (saved) {
      setCurrentStep((prev) => Math.min(prev + 1, 8));
    }
  };

  // Back Button handler
  const handleBack = () => {
    setFieldErrors({});
    setGlobalError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Photo Upload Handler (Step 2)
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        photo: language === 'bn' ? 'ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে' : 'Photo size must be under 5MB',
      }));
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFieldErrors((prev) => ({
        ...prev,
        photo: language === 'bn' ? 'শুধুমাত্র JPG, PNG বা WebP ফরম্যাট গ্রহণযোগ্য' : 'Only JPG, PNG or WebP images accepted',
      }));
      return;
    }

    setPhotoUploading(true);
    setFieldErrors((prev) => ({ ...prev, photo: '' }));

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        setPhotoPreview(base64Data);

        // Upload to server
        const res = await fetch('/api/portal/profile/upload-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo: base64Data }),
        });

        const data = await res.json();
        if (data.success) {
          success(language === 'bn' ? 'প্রোফাইল ছবি সংরক্ষিত হয়েছে' : 'Profile photo saved successfully');
        } else {
          setFieldErrors((prev) => ({ ...prev, photo: data.error || 'Failed to upload photo' }));
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setFieldErrors((prev) => ({ ...prev, photo: 'Error processing photo' }));
    } finally {
      setPhotoUploading(false);
    }
  };

  // Document Upload Handler (Step 7)
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDocTypeId) return;

    setUploadingDoc(true);
    setDocUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentTypeId', selectedDocTypeId);

    try {
      const res = await fetch('/api/portal/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data?.document) {
        const newDoc = data.data.document;
        setAvailableDocuments((prev) => [newDoc, ...prev]);
        setSelectedDocIds((prev) => Array.from(new Set([...prev, newDoc.id])));
        success(language === 'bn' ? 'ডকুমেন্ট আপলোড সম্পন্ন হয়েছে' : 'Document uploaded successfully');
      } else {
        setDocUploadError(data.error || 'Document upload failed');
      }
    } catch {
      setDocUploadError('Network error uploading document');
    } finally {
      setUploadingDoc(false);
      if (docFileInputRef.current) docFileInputRef.current.value = '';
    }
  };

  // Final Step 8 Submission
  const handleSubmitApplication = async () => {
    const isValid = validateCategory(8);
    if (!isValid) return;

    setSubmitting(true);
    setGlobalError(null);

    try {
      const res = await fetch(`/api/portal/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: eligibilityForm.additionalNotes || undefined,
          eligibilitySnapshot: {
            eligibilityAnswers: eligibilityForm,
            educationSummary: educationForm,
            experienceSummary: experienceForm,
            passportSummary: passportForm,
            submittedAt: new Date().toISOString(),
          },
          documentIds: selectedDocIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedAppResult(data.data);
        if (onSuccess) onSuccess(data.data);
      } else {
        setGlobalError(data.error || 'Application submission failed. Please try again.');
      }
    } catch {
      setGlobalError('Network error submitting final application.');
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Early Returns: Loading / Existing Application / Quota Limit
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#E4EAF1]">
        <div className="w-8 h-8 border-2 border-[#102B50] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-[#66758A] font-bengali">
          {t('আবেদন উইজার্ড ও প্রার্থীর তথ্য প্রস্তুত করা হচ্ছে...', 'Preparing application wizard & candidate profile...')}
        </p>
      </div>
    );
  }

  // If candidate already has an active submitted application for this job
  if (existingSubmittedApp) {
    return (
      <div className="bg-white rounded-xl border border-[#E4EAF1] p-6 sm:p-8 text-center space-y-4 font-bengali max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-[#24856A]/10 text-[#24856A] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#172B45]">
          {t('আপনার আবেদন ইতোমধ্যে জমা রয়েছে', 'Application Already Submitted')}
        </h2>
        <p className="text-xs text-[#66758A] leading-relaxed">
          {t(
            'এই নির্দিষ্ট পদের জন্য আপনার আবেদনটি সক্রিয় রয়েছে। নতুন করে আবেদনের প্রয়োজন নেই। আপনি আবেদন ট্র্যাকিং পাতায় অগ্রগতি পর্যবেক্ষণ করতে পারেন।',
            'You already have an active submitted application for this position. You can track progress in your applications dashboard.'
          )}
        </p>
        <div className="p-3 bg-[#F6F8FB] border border-[#E4EAF1] rounded-lg text-xs font-mono text-[#102B50]">
          ID: {existingSubmittedApp.applicationCode}
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Link href={`/portal/applications/${existingSubmittedApp.id}`}>
            <Button variant="primary" size="sm" className="w-full sm:w-auto bg-[#102B50] hover:bg-[#0B1D35] text-white">
              {t('আবেদন ট্র্যাকিং দেখুন', 'View Application Status')}
            </Button>
          </Link>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose} className="border-[#E4EAF1]">
              {t('বন্ধ করুন', 'Close')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Quota Reached Check (Max 3 active applications)
  if (quota.isLimitReached && !existingDraftApp) {
    return (
      <div className="bg-white rounded-xl border border-[#E4EAF1] p-6 sm:p-8 text-center space-y-4 font-bengali max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-[#B7791F]/10 text-[#B7791F] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#172B45]">
          {t('আবেদন কোটা পূর্ণ হয়েছে (সর্বোচ্চ ৩টি)', 'Application Limit Reached (Max 3)')}
        </h2>
        <p className="text-xs text-[#66758A] leading-relaxed">
          {t(
            'সরকারি ও এজেন্সি নীতিমালা অনুযায়ী একজন প্রার্থী একসাথে সর্বোচ্চ ৩টি পদের জন্য সক্রিয় আবেদন রাখতে পারেন। পূর্ববর্তী কোনো আবেদনের প্রসেস সমাপ্ত হলে আপনি পুনরায় আবেদন করতে পারবেন।',
            'Under recruitment regulations, candidates may maintain up to 3 active applications concurrently.'
          )}
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/portal/applications">
            <Button variant="primary" size="sm" className="w-full sm:w-auto bg-[#102B50] hover:bg-[#0B1D35] text-white">
              {t('আমার আবেদনসমূহ দেখুন', 'View My Applications')}
            </Button>
          </Link>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose} className="border-[#E4EAF1]">
              {t('বন্ধ করুন', 'Close')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Successful Final Submission Confirmation Screen
  // --------------------------------------------------------------------------
  if (submittedAppResult) {
    return (
      <div className="bg-white rounded-xl border border-[#E4EAF1] p-6 sm:p-8 space-y-6 font-bengali max-w-2xl mx-auto shadow-sm">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-[#24856A]/10 text-[#24856A] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold text-[#24856A] uppercase tracking-wider bg-[#24856A]/10 px-3 py-1 rounded-full inline-block">
            {t('আবেদন সফলভাবে গৃহীত হয়েছে', 'Application Submitted Successfully')}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#172B45]">
            {job?.title}
          </h2>
          <p className="text-xs text-[#66758A]">
            {BRAND.name} • {BRAND.licenseNumber} (BMET অনুমোদিত)
          </p>
        </div>

        {/* Application Reference Box */}
        <div className="p-4 bg-[#F6F8FB] border border-[#E4EAF1] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <div className="text-[11px] text-[#66758A] font-semibold uppercase">অফিসিয়াল অ্যাপ্লিকেশন রেফারেন্স কোড</div>
            <div className="text-lg font-black text-[#102B50] font-mono tracking-wider">
              {submittedAppResult.applicationCode || 'SGR-APP-2026-PENDING'}
            </div>
          </div>
          <div className="text-xs text-[#66758A]">
            জমার সময়: {new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* 5-Stage Next Steps Roadmap */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-[#172B45]">পরবর্তী নিয়োগ ধাপসমূহ (What Happens Next):</h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg border border-[#24856A]/30 bg-[#24856A]/5 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#24856A] shrink-0" />
              <div>
                <span className="font-bold text-[#172B45]">ধাপ ১: আবেদন গ্রহণ (Completed)</span>
                <p className="text-[#66758A] text-[11px]">আপনার প্রোফাইল ও প্রাথমিক কাগজপত্র ডাটাবেজে সংরক্ষিত হয়েছে।</p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-[#102B50]/30 bg-[#102B50]/5 flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#102B50] shrink-0" />
              <div>
                <span className="font-bold text-[#102B50]">ধাপ ২: প্রোফাইল ও ডকুমেন্ট স্ক্রিনিং (Current Stage)</span>
                <p className="text-[#66758A] text-[11px]">আমাদের অভিজ্ঞ রিক্রুটমেন্ট অফিসার প্রার্থীর যোগ্যতা ও পাসপোর্ট যাচাই করবেন।</p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-[#E4EAF1] bg-[#F6F8FB] flex items-center gap-3 opacity-80">
              <User className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <span className="font-bold text-[#172B45]">ধাপ ৩: ইন্টারভিউ ও প্রাথমিক সিলেকশন (Upcoming)</span>
                <p className="text-[#66758A] text-[11px]">শর্টলিস্টেড হলে সরাসরি বা ভিডিও কনফারেন্সে ইন্টারভিউ শিডিউল জানানো হবে।</p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-[#E4EAF1] bg-[#F6F8FB] flex items-center gap-3 opacity-80">
              <Award className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <span className="font-bold text-[#172B45]">ধাপ ৪: দূতাবাস ভিসা ও BMET স্মার্ট কার্ড (Upcoming)</span>
                <p className="text-[#66758A] text-[11px]">সিলেকশনের পর মেডিকেল টেস্ট ও সরকারি ইমিগ্রেশন ছাড়পত্র প্রসেসিং।</p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-[#E4EAF1] bg-[#F6F8FB] flex items-center gap-3 opacity-80">
              <Briefcase className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <span className="font-bold text-[#172B45]">ধাপ ৫: প্রাক-যাত্রা ব্রিফিং ও ফ্লাইট (Final Stage)</span>
                <p className="text-[#66758A] text-[11px]">নিরাপদ বিদেশ গমন ও চুক্তিপত্রের শতভাগ বাস্তবায়ন।</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="pt-4 border-t border-[#E4EAF1] flex flex-col sm:flex-row gap-3">
          <Link href={`/portal/applications/${submittedAppResult.id}`} className="flex-1">
            <Button variant="primary" className="w-full bg-[#102B50] hover:bg-[#0B1D35] text-white py-2.5">
              {t('আমার আবেদন বিস্তারিত দেখুন', 'View Application Details')}
            </Button>
          </Link>
          <Link href="/portal" className="flex-1">
            <Button variant="outline" className="w-full border-[#E4EAF1] text-[#172B45] hover:bg-[#F6F8FB] py-2.5">
              {t('ড্যাশবোর্ডে ফিরুন', 'Go to Dashboard')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Main Wizard Layout
  // --------------------------------------------------------------------------
  const countryFlag = job?.country?.code ? getCountryFlagUrl(job.country.code) : '';
  const currentStepDef = WIZARD_STEPS.find((s) => s.id === currentStep) || WIZARD_STEPS[0];
  const progressPercent = Math.round((currentStep / (WIZARD_STEPS.length - 1)) * 100);

  return (
    <div className="bg-white rounded-xl border border-[#E4EAF1] shadow-sm overflow-hidden flex flex-col font-sans">
      {/* Top Wizard Header & Stepper */}
      <div className="p-4 sm:p-5 border-b border-[#E4EAF1] bg-[#F6F8FB]">
        <div className="flex items-center justify-between mb-3 font-bengali">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#102B50] bg-white border border-[#E4EAF1] px-2.5 py-1 rounded-md">
              ধাপ {currentStep} / 8
            </span>
            <span className="text-xs font-bold text-[#172B45]">
              {language === 'bn' ? currentStepDef.titleBn : currentStepDef.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-[#66758A]">
              অগ্রগতি: {progressPercent}%
            </span>
            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-slate-200 text-[#66758A] transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#E4EAF1] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-1.5 bg-[#102B50] rounded-full transition-all duration-300"
            style={{ width: `${Math.max(progressPercent, 4)}%` }}
          />
        </div>

        {/* Desktop Stepper Bar (Only 1 active category, completed marked) */}
        <div className="hidden lg:grid grid-cols-9 gap-1.5 mt-3 pt-2 border-t border-[#E4EAF1]/60 font-bengali">
          {WIZARD_STEPS.map((stepItem) => {
            const isCompleted = completedSteps.includes(stepItem.id);
            const isActive = currentStep === stepItem.id;
            return (
              <button
                key={stepItem.id}
                type="button"
                onClick={() => {
                  if (isCompleted || stepItem.id <= currentStep) {
                    setCurrentStep(stepItem.id);
                  }
                }}
                disabled={!isCompleted && stepItem.id > currentStep}
                className={`text-left p-1.5 rounded text-[11px] transition-all flex items-center gap-1.5 truncate ${
                  isActive
                    ? 'bg-[#102B50] text-white font-bold shadow-2xs'
                    : isCompleted
                    ? 'bg-white text-[#24856A] border border-[#E4EAF1] font-semibold hover:bg-slate-50'
                    : 'text-[#66758A] opacity-60 cursor-not-allowed'
                }`}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-mono">
                  {isCompleted ? <Check className="w-3 h-3 text-[#24856A]" /> : stepItem.id}
                </span>
                <span className="truncate">{language === 'bn' ? stepItem.titleBn : stepItem.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Error Banner */}
      {globalError && (
        <div className="m-4 p-3 bg-[#C2414B]/10 border border-[#C2414B]/30 rounded-lg text-xs text-[#C2414B] flex items-center gap-2 font-bengali">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Wizard Step Content Body */}
      <div className="p-5 sm:p-7 flex-1 overflow-y-auto">
        {/* =========================================================================
            STEP 0: JOB CONFIRMATION
            ========================================================================= */}
        {currentStep === 0 && (
          <div className="space-y-6 font-bengali max-w-2xl mx-auto">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-[#102B50] uppercase tracking-wider bg-[#F6F8FB] border border-[#E4EAF1] px-3 py-1 rounded-full inline-block">
                নিয়োগ বিজ্ঞপ্তি পর্যালোচনা
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#172B45]">
                পদের বিবরণ ও শর্তাবলী নিশ্চিতকরণ
              </h2>
              <p className="text-xs text-[#66758A]">
                আবেদন শুরুর পূর্বে পদের মৌলিক যোগ্যতা ও সুবিধাসমূহ মনোযোগ দিয়ে দেখে নিন।
              </p>
            </div>

            {/* Job Summary Card */}
            <div className="bg-[#F6F8FB] border border-[#E4EAF1] rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {countryFlag && (
                      <div className="relative w-5 h-3.5 rounded-xs overflow-hidden border border-slate-200">
                        <Image src={countryFlag} alt="Flag" fill className="object-cover" />
                      </div>
                    )}
                    <span className="text-xs font-bold text-[#172B45] font-sans">
                      {job?.country?.name || 'International'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#102B50]">
                    {job?.title}
                  </h3>
                  <div className="text-xs text-[#66758A] flex flex-wrap items-center gap-2">
                    <span>কোড: {job?.jobCode || 'SK-JOB'}</span>
                    <span>•</span>
                    <span>ক্যাটাগরি: {job?.jobCategory?.name || 'General'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#66758A] block uppercase font-semibold">শূন্যপদ সংখ্যা</span>
                  <span className="text-sm font-bold text-[#102B50]">{job?.vacancyCount || 1} জন</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#E4EAF1] text-xs">
                <div className="p-3 bg-white rounded-lg border border-[#E4EAF1]">
                  <span className="text-[11px] text-[#66758A] block mb-1">অনুমোদিত নিয়োগকর্তা / কোম্পানি</span>
                  <div className="font-bold text-[#172B45] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#102B50]" />
                    <span>{job?.employer?.companyName || 'অনুমোদিত বিদেশি প্রতিষ্ঠান'}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#E4EAF1]">
                  <span className="text-[11px] text-[#66758A] block mb-1">মাসিক বেতন (নির্ধারিত)</span>
                  <div className="font-bold text-[#24856A] flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-[#24856A]" />
                    <span>
                      {job?.salaryMin
                        ? `${job.currency || 'BDT'} ${Number(job.salaryMin).toLocaleString()} - ${Number(job.salaryMax || job.salaryMin).toLocaleString()}`
                        : 'কোম্পানি চুক্তি অনুযায়ী'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#E4EAF1]">
                  <span className="text-[11px] text-[#66758A] block mb-1">প্রয়োজনীয় অভিজ্ঞতা</span>
                  <div className="font-bold text-[#172B45] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#102B50]" />
                    <span>
                      {job?.experienceRequired
                        ? `${job.experienceRequired} বছরের সংশ্লিষ্ট কাজের অভিজ্ঞতা`
                        : 'ফ্রেশার বা পূর্ব অভিজ্ঞতা ছাড়া আবেদনযোগ্য'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#E4EAF1]">
                  <span className="text-[11px] text-[#66758A] block mb-1">শিক্ষাগত ন্যূনতম যোগ্যতা</span>
                  <div className="font-bold text-[#172B45] flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#102B50]" />
                    <span>{job?.educationRequired || 'অষ্টম শ্রেণি / এস.এস.সি / সমমান'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#24856A]/5 border border-[#24856A]/20 rounded-lg text-xs text-[#172B45] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#24856A] shrink-0 mt-0.5" />
              <span>
                এই আবেদন প্রক্রিয়ায় কোনো প্রকার মধ্যস্বত্বভোগী বা অননুমোদিত চার্জ নেওয়া হয় না। পরবর্তী ধাপে আপনার প্রোফাইল তথ্য বিভাগওয়ারী যাচাই করে সংরক্ষণ করা হবে।
              </span>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 1: PERSONAL INFORMATION
            ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-5 font-bengali max-w-2xl mx-auto">
            <div>
              <h2 className="text-lg font-bold text-[#172B45]">ব্যক্তিগত তথ্য (Personal Information)</h2>
              <p className="text-xs text-[#66758A]">পাসপোর্ট ও জাতীয় পরিচয়পত্র অনুযায়ী সঠিক তথ্য পূরণ করুন।</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1">
                  পূর্ণ নাম (ইংরেজিতে পাসপোর্ট অনুযায়ী) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={personalForm.fullName}
                  onChange={(e) => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                  placeholder="e.g. MOHAMMED RAHIM UDDIN"
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                    fieldErrors.fullName ? 'border-[#C2414B] focus:ring-[#C2414B]' : 'border-[#E4EAF1] focus:ring-[#102B50]'
                  }`}
                />
                {fieldErrors.fullName && <p className="text-[11px] text-[#C2414B] mt-1">{fieldErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1">
                  মোবাইল নম্বর <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  placeholder="017XXXXXXXX"
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                    fieldErrors.phone ? 'border-[#C2414B] focus:ring-[#C2414B]' : 'border-[#E4EAF1] focus:ring-[#102B50]'
                  }`}
                />
                {fieldErrors.phone && <p className="text-[11px] text-[#C2414B] mt-1">{fieldErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1">
                  জন্ম তারিখ <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  value={personalForm.dateOfBirth}
                  onChange={(e) => setPersonalForm({ ...personalForm, dateOfBirth: e.target.value })}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                    fieldErrors.dateOfBirth ? 'border-[#C2414B] focus:ring-[#C2414B]' : 'border-[#E4EAF1] focus:ring-[#102B50]'
                  }`}
                />
                {fieldErrors.dateOfBirth && <p className="text-[11px] text-[#C2414B] mt-1">{fieldErrors.dateOfBirth}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1">
                  লিঙ্গ (Gender) <span className="text-rose-600">*</span>
                </label>
                <select
                  value={personalForm.gender}
                  onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E4EAF1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#102B50]"
                >
                  <option value="MALE">পুরুষ (Male)</option>
                  <option value="FEMALE">মহিলা (Female)</option>
                  <option value="OTHER">অন্যান্য (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1">
                  ইমেইল (যদি থাকে)
                </label>
                <input
                  type="email"
                  value={personalForm.email}
                  onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-xs border border-[#E4EAF1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#102B50]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1">
                  নিজ জেলা (District) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={personalForm.district}
                  onChange={(e) => setPersonalForm({ ...personalForm, district: e.target.value })}
                  placeholder="যেমন: কুমিল্লা, ঢাকা, সিলেট..."
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                    fieldErrors.district ? 'border-[#C2414B] focus:ring-[#C2414B]' : 'border-[#E4EAF1] focus:ring-[#102B50]'
                  }`}
                />
                {fieldErrors.district && <p className="text-[11px] text-[#C2414B] mt-1">{fieldErrors.district}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#172B45] mb-1">
                  বর্তমান ঠিকানা (গ্রাম, ডাকঘর, থানা) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={personalForm.address}
                  onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })}
                  placeholder="বর্তমান বসবাসের পূর্ণ ঠিকানা..."
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                    fieldErrors.address ? 'border-[#C2414B] focus:ring-[#C2414B]' : 'border-[#E4EAF1] focus:ring-[#102B50]'
                  }`}
                />
                {fieldErrors.address && <p className="text-[11px] text-[#C2414B] mt-1">{fieldErrors.address}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#172B45] mb-1">
                  জরুরি যোগাযোগের ফোন নম্বর (অভিভাবক/নিকটাত্মীয়) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  value={personalForm.emergencyPhone}
                  onChange={(e) => setPersonalForm({ ...personalForm, emergencyPhone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                    fieldErrors.emergencyPhone ? 'border-[#C2414B] focus:ring-[#C2414B]' : 'border-[#E4EAF1] focus:ring-[#102B50]'
                  }`}
                />
                {fieldErrors.emergencyPhone && <p className="text-[11px] text-[#C2414B] mt-1">{fieldErrors.emergencyPhone}</p>}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: PROFILE PHOTO
            ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 font-bengali max-w-xl mx-auto text-center">
            <div>
              <h2 className="text-lg font-bold text-[#172B45]">প্রোফাইল ছবি (Profile Photo)</h2>
              <p className="text-xs text-[#66758A]">
                আন্তর্জাতিক নিয়োগকর্তা ও ভিসা অনুমোদনের জন্য প্রার্থীর সাম্প্রতিক পাসপোর্ট সাইজ ছবি বাধ্যতামূলক।
              </p>
            </div>

            <div className="p-6 border-2 border-dashed border-[#E4EAF1] rounded-2xl bg-[#F6F8FB] space-y-4">
              <div className="relative w-36 h-44 mx-auto bg-white border border-[#E4EAF1] rounded-xl overflow-hidden shadow-sm flex items-center justify-center">
                {photoPreview ? (
                  <Image src={photoPreview} alt="Profile preview" fill className="object-cover" />
                ) : (
                  <div className="text-center p-3 text-[#66758A]">
                    <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                    <span className="text-[10px] block">পাসপোর্ট সাইজ ছবি</span>
                  </div>
                )}
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                  className="bg-white border-[#E4EAF1] text-[#102B50] font-bold text-xs px-5 py-2 hover:bg-slate-50"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  {photoUploading ? 'আপলোড হচ্ছে...' : photoPreview ? 'ছবি পরিবর্তন করুন' : 'ছবি আপলোড করুন'}
                </Button>

                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="block mx-auto text-[11px] text-[#C2414B] hover:underline"
                  >
                    ছবি বাতিল করুন
                  </button>
                )}
              </div>

              <p className="text-[11px] text-[#66758A] max-w-xs mx-auto leading-relaxed">
                সাদা ব্যাকগ্রাউন্ডযুক্ত স্পষ্ট ছবি। সাইজ সর্বোচ্চ ৫ মেগাবাইট (JPG, PNG বা WebP)।
              </p>

              {fieldErrors.photo && (
                <div className="p-2.5 bg-[#C2414B]/10 border border-[#C2414B]/30 rounded-lg text-xs text-[#C2414B] flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{fieldErrors.photo}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: PASSPORT & IDENTITY
            ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-5 font-bengali max-w-2xl mx-auto">
            <div>
              <h2 className="text-lg font-bold text-[#172B45]">পাসপোর্ট ও জাতীয় পরিচয় (Passport & Identity)</h2>
              <p className="text-xs text-[#66758A]">
                আন্তর্জাতিক অভিবাসনের জন্য পাসপোর্ট বাধ্যতামূলক। পাসপোর্ট না থাকলে এনআইডি নম্বর প্রদান করুন।
              </p>
            </div>

            {/* Passport Toggle */}
            <div className="p-4 bg-[#F6F8FB] border border-[#E4EAF1] rounded-xl space-y-3">
              <span className="block text-xs font-bold text-[#172B45]">
                আপনার কি বৈধ বাংলাদেশি পাসপোর্ট আছে?
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPassportForm({ ...passportForm, passportAvailable: true })}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                    passportForm.passportAvailable
                      ? 'bg-[#102B50] text-white border-[#102B50]'
                      : 'bg-white text-[#172B45] border-[#E4EAF1] hover:bg-slate-50'
                  }`}
                >
                  হ্যাঁ, পাসপোর্ট আছে (Yes)
                </button>
                <button
                  type="button"
                  onClick={() => setPassportForm({ ...passportForm, passportAvailable: false })}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                    !passportForm.passportAvailable
                      ? 'bg-[#102B50] text-white border-[#102B50]'
                      : 'bg-white text-[#172B45] border-[#E4EAF1] hover:bg-slate-50'
                  }`}
                >
                  না, পাসপোর্ট নেই (No)
                </button>
              </div>
            </div>

            {passportForm.passportAvailable ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172B45] mb-1">
                    পাসপোর্ট নম্বর (Passport No) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={passportForm.passportNumber}
                    onChange={(e) => setPassportForm({ ...passportForm, passportNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. A01234567"
                    className={`w-full px-3 py-2 text-xs border rounded-lg font-mono uppercase focus:outline-none focus:ring-1 ${
                      fieldErrors.passportNumber ? 'border-[#C2414B] focus:ring-[#C2414B]' : 'border-[#E4EAF1] focus:ring-[#102B50]'
                    }`}
                  />
                  {fieldErrors.passportNumber && (
                    <p className="text-[11px] text-[#C2414B] mt-1">{fieldErrors.passportNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172B45] mb-1">
                    মেয়াদোত্তীর্ণের তারিখ (Expiry Date) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={passportForm.expiryDate}
                    onChange={(e) => setPassportForm({ ...passportForm, expiryDate: e.target.value })}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                      fieldErrors.expiryDate ? 'border-[#C2414B] focus:ring-[#C2414B]' : 'border-[#E4EAF1] focus:ring-[#102B50]'
                    }`}
                  />
                  {fieldErrors.expiryDate && (
                    <p className="text-[11px] text-[#C2414B] mt-1">{fieldErrors.expiryDate}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#172B45] mb-1">
                    পাসপোর্ট প্রদানকারী দেশ
                  </label>
                  <input
                    type="text"
                    disabled
                    value="বাংলাদেশ (Bangladesh)"
                    className="w-full px-3 py-2 text-xs border border-[#E4EAF1] bg-slate-100 text-[#66758A] rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#172B45] mb-1">
                    জাতীয় পরিচয়পত্র (NID) নম্বর <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={passportForm.nidNumber}
                    onChange={(e) => setPassportForm({ ...passportForm, nidNumber: e.target.value })}
                    placeholder="১০ অথবা ১৭ ডিজিটের এনআইডি নম্বর"
                    className={`w-full px-3 py-2 text-xs border rounded-lg font-mono focus:outline-none focus:ring-1 ${
                      fieldErrors.nidNumber ? 'border-[#C2414B] focus:ring-[#C2414B]' : 'border-[#E4EAF1] focus:ring-[#102B50]'
                    }`}
                  />
                  {fieldErrors.nidNumber && (
                    <p className="text-[11px] text-[#C2414B] mt-1">{fieldErrors.nidNumber}</p>
                  )}
                </div>

                <div className="p-3 bg-[#B7791F]/10 border border-[#B7791F]/30 rounded-lg text-xs text-[#B7791F]">
                  পাসপোর্ট না থাকলে প্রাথমিক আবেদন সম্পন্ন করা যাবে, তবে ভিসা প্রসেসিং ও চূড়ান্ত সিলেকশনের জন্য জরুরি ভিত্তিতে পাসপোর্ট করতে হবে।
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            STEP 4: EDUCATION & QUALIFICATIONS
            ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-5 font-bengali max-w-2xl mx-auto">
            <div>
              <h2 className="text-lg font-bold text-[#172B45]">শিক্ষাগত যোগ্যতা (Education & Qualifications)</h2>
              <p className="text-xs text-[#66758A]">আপনার সর্বোচ্চ শিক্ষাগত বিবরণ প্রদান করুন।</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1">
                  সর্বোচ্চ শিক্ষাগত স্তর <span className="text-rose-600">*</span>
                </label>
                <select
                  value={educationForm.highestLevel}
                  onChange={(e) => setEducationForm({ ...educationForm, highestLevel: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E4EAF1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#102B50]"
                >
                  <option value="PRIMARY">প্রাথমিক (Primary / Class 5)</option>
                  <option value="JSC">জে.এস.সি / অষ্টম শ্রেণি (Class 8)</option>
                  <option value="SSC">এস.এস.সি / দাখিল (SSC / Dakhil)</option>
                  <option value="HSC">এইচ.এস.সি / আলিম (HSC / Alim)</option>
                  <option value="DIPLOMA">ডিপ্লোমা (Polytechnic / Diploma)</option>
                  <option value="GRADUATE">স্নাতক (Bachelor / Degree)</option>
                  <option value="POST_GRADUATE">স্নাতকোত্তর (Masters)</option>
                  <option value="VOCATIONAL">কারিগরি / ভোকেশনাল (Vocational)</option>
                  <option value="LITERATE">স্বাক্ষরজ্ঞানসম্পন্ন (Basic Literacy)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1">
                  শিক্ষা প্রতিষ্ঠান / বোর্ডের নাম <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={educationForm.institution}
                  onChange={(e) => setEducationForm({ ...educationForm, institution: e.target.value })}
                  placeholder="e.g. ঢাকা শিক্ষা বোর্ড / টেকনিক্যাল স্কুল"
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                    fieldErrors.institution ? 'border-[#C2414B] focus:ring-[#C2414B]' : 'border-[#E4EAF1] focus:ring-[#102B50]'
                  }`}
                />
                {fieldErrors.institution && (
                  <p className="text-[11px] text-[#C2414B] mt-1">{fieldErrors.institution}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1">
                  বিভাগ / বিষয় (Major / Group)
                </label>
                <input
                  type="text"
                  value={educationForm.degree}
                  onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })}
                  placeholder="যেমন: মানবিক, বিজ্ঞান, টেকনিক্যাল..."
                  className="w-full px-3 py-2 text-xs border border-[#E4EAF1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#102B50]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1">
                  পাসের সন (Passing Year)
                </label>
                <input
                  type="number"
                  value={educationForm.passingYear}
                  onChange={(e) => setEducationForm({ ...educationForm, passingYear: e.target.value })}
                  placeholder="যেমন: 2018"
                  className="w-full px-3 py-2 text-xs border border-[#E4EAF1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#102B50]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#172B45] mb-1">
                  কারিগরি বা ভোকেশনাল ট্রেনিং (যদি থাকে)
                </label>
                <input
                  type="text"
                  value={educationForm.technicalTraining}
                  onChange={(e) => setEducationForm({ ...educationForm, technicalTraining: e.target.value })}
                  placeholder="যেমন: TTC ড্রাইভিং ট্রেনিং, ওয়েল্ডিং কোর্স ৬ মাস..."
                  className="w-full px-3 py-2 text-xs border border-[#E4EAF1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#102B50]"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 5: WORK EXPERIENCE & SKILLS
            ========================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-5 font-bengali max-w-2xl mx-auto">
            <div>
              <h2 className="text-lg font-bold text-[#172B45]">কাজের অভিজ্ঞতা ও দক্ষতা (Work Experience & Skills)</h2>
              <p className="text-xs text-[#66758A]">আপনার পূর্ববর্তী কাজের অভিজ্ঞতা ও বৃত্তিমূলক ট্রেড দক্ষতা জানান।</p>
            </div>

            {/* Experienced vs Fresher Toggle */}
            <div className="p-4 bg-[#F6F8FB] border border-[#E4EAF1] rounded-xl space-y-3">
              <span className="block text-xs font-bold text-[#172B45]">
                আপনার কি সংশ্লিষ্ট কাজে পূর্ব অভিজ্ঞতা রয়েছে?
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setExperienceForm({ ...experienceForm, status: 'EXPERIENCED' })}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                    experienceForm.status === 'EXPERIENCED'
                      ? 'bg-[#102B50] text-white border-[#102B50]'
                      : 'bg-white text-[#172B45] border-[#E4EAF1] hover:bg-slate-50'
                  }`}
                >
                  অভিজ্ঞ (Experienced)
                </button>
                <button
                  type="button"
                  onClick={() => setExperienceForm({ ...experienceForm, status: 'FRESHER' })}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                    experienceForm.status === 'FRESHER'
                      ? 'bg-[#102B50] text-white border-[#102B50]'
                      : 'bg-white text-[#172B45] border-[#E4EAF1] hover:bg-slate-50'
                  }`}
                >
                  ফ্রেশার (Fresher - কোনো পূর্ব অভিজ্ঞতা নেই)
                </button>
              </div>
            </div>

            {experienceForm.status === 'EXPERIENCED' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172B45] mb-1">
                    পেশা বা পদের নাম <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={experienceForm.occupation}
                    onChange={(e) => setExperienceForm({ ...experienceForm, occupation: e.target.value })}
                    placeholder="যেমন: ইলেকট্রিশিয়ান, ড্রাইভার, রাজমিস্ত্রি..."
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                      fieldErrors.occupation ? 'border-[#C2414B] focus:ring-[#C2414B]' : 'border-[#E4EAF1] focus:ring-[#102B50]'
                    }`}
                  />
                  {fieldErrors.occupation && (
                    <p className="text-[11px] text-[#C2414B] mt-1">{fieldErrors.occupation}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172B45] mb-1">
                    অভিজ্ঞতার সময়কাল (বছর) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={experienceForm.yearsOfExperience}
                    onChange={(e) => setExperienceForm({ ...experienceForm, yearsOfExperience: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#E4EAF1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#102B50]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172B45] mb-1">
                    অভিজ্ঞতার ধরণ
                  </label>
                  <select
                    value={experienceForm.experienceCountry}
                    onChange={(e) => setExperienceForm({ ...experienceForm, experienceCountry: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E4EAF1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#102B50]"
                  >
                    <option value="BANGLADESH">বাংলাদেশে কাজ করেছেন (Local)</option>
                    <option value="OVERSEAS">বিদেশে কাজ করেছেন (GCC / Abroad Returned)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172B45] mb-1">
                    পূর্বে যেখানে কাজ করেছেন (কোম্পানি/প্রতিষ্ঠান)
                  </label>
                  <input
                    type="text"
                    value={experienceForm.employer}
                    onChange={(e) => setExperienceForm({ ...experienceForm, employer: e.target.value })}
                    placeholder="কোম্পানির নাম (যদি থাকে)"
                    className="w-full px-3 py-2 text-xs border border-[#E4EAF1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#102B50]"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-[#F6F8FB] border border-[#E4EAF1] rounded-lg text-xs text-[#66758A]">
                ফ্রেশার প্রার্থীদের ক্ষেত্রে কোম্পানি ও পূর্ব অভিজ্ঞতার ক্ষেত্রগুলো বাধ্যতামূলক নয়। আপনার আগ্রহ ও ভাষার দক্ষতাই স্ক্রিনিংয়ে প্রধান বিবেচিত হবে।
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1">
                কারিগরি দক্ষতা ও ট্রেড স্কিলসমূহ (Technical Skills)
              </label>
              <input
                type="text"
                value={experienceForm.skills}
                onChange={(e) => setExperienceForm({ ...experienceForm, skills: e.target.value })}
                placeholder="যেমন: পাইপ ফিটিং, হাউস ওয়্যারিং, আর্ক ওয়েল্ডিং, হেভি ড্রাইভিং..."
                className="w-full px-3 py-2 text-xs border border-[#E4EAF1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#102B50]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1">
                ভাষাগত দক্ষতা (Languages Known)
              </label>
              <input
                type="text"
                value={experienceForm.languages}
                onChange={(e) => setExperienceForm({ ...experienceForm, languages: e.target.value })}
                placeholder="যেমন: বাংলা (মাতৃভাষা), ইংরেজি (সাধারণ), আরবি (কথোপকথন)..."
                className="w-full px-3 py-2 text-xs border border-[#E4EAF1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#102B50]"
              />
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 6: JOB-SPECIFIC ELIGIBILITY
            ========================================================================= */}
        {currentStep === 6 && (
          <div className="space-y-5 font-bengali max-w-2xl mx-auto">
            <div>
              <h2 className="text-lg font-bold text-[#172B45]">কাজের যোগ্যতা ও সম্মতি (Job-Specific Eligibility)</h2>
              <p className="text-xs text-[#66758A]">নির্বাচিত পদের শর্তাবলী ও আবশ্যক যোগ্যতার ঘোষণা নিশ্চিত করুন।</p>
            </div>

            {/* Checklist of Eligibility Questions */}
            <div className="space-y-3">
              <label className="p-3.5 rounded-xl border border-[#E4EAF1] bg-[#F6F8FB] flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={eligibilityForm.healthDeclaration}
                  onChange={(e) => setEligibilityForm({ ...eligibilityForm, healthDeclaration: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-[#102B50] focus:ring-[#102B50]"
                />
                <div>
                  <span className="text-xs font-bold text-[#172B45] block">
                    শারীরিক ও মেডিকেল ফিটনেস ঘোষণা <span className="text-rose-600">*</span>
                  </span>
                  <span className="text-[11px] text-[#66758A]">
                    আমি ঘোষণা করছি যে আমি শারীরিকভাবে সম্পূর্ণ সুস্থ, কঠিন কোনো সংক্রামক ব্যাধি নেই এবং বিদেশে ভারী কাজের জন্য উপযুক্ত।
                  </span>
                </div>
              </label>
              {fieldErrors.healthDeclaration && (
                <p className="text-[11px] text-[#C2414B] pl-2">{fieldErrors.healthDeclaration}</p>
              )}

              <label className="p-3.5 rounded-xl border border-[#E4EAF1] bg-[#F6F8FB] flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={eligibilityForm.policeClearance}
                  onChange={(e) => setEligibilityForm({ ...eligibilityForm, policeClearance: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-[#102B50] focus:ring-[#102B50]"
                />
                <div>
                  <span className="text-xs font-bold text-[#172B45] block">
                    পুলিশ ক্লিয়ারেন্স ও আইনি স্বচ্ছতা ঘোষণা <span className="text-rose-600">*</span>
                  </span>
                  <span className="text-[11px] text-[#66758A]">
                    আমার বিরুদ্ধে কোনো ফৌজদারি অপরাধের রেকর্ড নেই এবং আমি বিদেশ গমনের জন্য পুলিশ ক্লিয়ারেন্স সনদ প্রদানে সম্মত।
                  </span>
                </div>
              </label>
              {fieldErrors.policeClearance && (
                <p className="text-[11px] text-[#C2414B] pl-2">{fieldErrors.policeClearance}</p>
              )}

              <label className="p-3.5 rounded-xl border border-[#E4EAF1] bg-[#F6F8FB] flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={eligibilityForm.salaryAgreed}
                  onChange={(e) => setEligibilityForm({ ...eligibilityForm, salaryAgreed: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-[#102B50] focus:ring-[#102B50]"
                />
                <div>
                  <span className="text-xs font-bold text-[#172B45] block">
                    বেতন ও কর্মঘণ্টা সম্মতি <span className="text-rose-600">*</span>
                  </span>
                  <span className="text-[11px] text-[#66758A]">
                    আমি বিজ্ঞপ্তিতে উল্লেখিত নির্ধারিত বেতন ও কর্মঘণ্টায় কাজ করতে স্বেচ্ছায় রাজি আছি।
                  </span>
                </div>
              </label>
              {fieldErrors.salaryAgreed && (
                <p className="text-[11px] text-[#C2414B] pl-2">{fieldErrors.salaryAgreed}</p>
              )}

              <div className="pt-2">
                <label className="block text-xs font-bold text-[#172B45] mb-1">
                  সিলেকশনের পর বিদেশ যাওয়ার প্রস্তুতি (Joining Availability)
                </label>
                <select
                  value={eligibilityForm.joiningAvailability}
                  onChange={(e) => setEligibilityForm({ ...eligibilityForm, joiningAvailability: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E4EAF1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#102B50]"
                >
                  <option value="IMMEDIATE">অবিলম্বে যেতে প্রস্তুত (Immediate)</option>
                  <option value="1_MONTH">১ মাসের মধ্যে (Within 1 Month)</option>
                  <option value="2_MONTHS">২ মাসের মধ্যে (Within 2 Months)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 7: DOCUMENTS & ATTACHMENTS
            ========================================================================= */}
        {currentStep === 7 && (
          <div className="space-y-5 font-bengali max-w-2xl mx-auto">
            <div>
              <h2 className="text-lg font-bold text-[#172B45]">নথিপত্র ও সনদ সংযুক্তি (Documents & Attachments)</h2>
              <p className="text-xs text-[#66758A]">
                আপনার আপলোডকৃত ফাইলসমূহ থেকে এই পদের সাথে সংযুক্ত করুন অথবা নতুন ডকুমেন্ট আপলোড করুন।
              </p>
            </div>

            {/* Document Upload Widget */}
            <div className="p-4 bg-[#F6F8FB] border border-[#E4EAF1] rounded-xl space-y-3">
              <span className="text-xs font-bold text-[#172B45] block">
                নতুন ডকুমেন্ট আপলোড করুন
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedDocTypeId}
                  onChange={(e) => setSelectedDocTypeId(e.target.value)}
                  className="px-3 py-2 text-xs border border-[#E4EAF1] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#102B50] sm:w-1/2"
                >
                  {documentTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.name}
                    </option>
                  ))}
                </select>

                <input
                  ref={docFileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleDocumentUpload}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => docFileInputRef.current?.click()}
                  disabled={uploadingDoc}
                  className="bg-white border-[#E4EAF1] text-[#102B50] font-bold text-xs px-4 py-2 hover:bg-slate-50 flex items-center justify-center gap-1.5 flex-1"
                >
                  <Upload className="w-3.5 h-3.5 text-[#102B50]" />
                  {uploadingDoc ? 'আপলোড হচ্ছে...' : 'ফাইল নির্বাচন ও আপলোড'}
                </Button>
              </div>

              {docUploadError && (
                <p className="text-[11px] text-[#C2414B]">{docUploadError}</p>
              )}
            </div>

            {/* List of Available Documents to Attach */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#172B45] block">
                আবেদনের সাথে সংযুক্ত নথিপত্র ({availableDocuments.length}টি সংরক্ষিত ফাইল):
              </span>

              {availableDocuments.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-[#E4EAF1] rounded-lg text-center text-xs text-[#66758A]">
                  এখনও কোনো ফাইল আপলোড করা হয়নি। পাসপোর্ট বা সনদের কপি আপলোড করতে ওপরের বাটনটি ব্যবহার করুন।
                </div>
              ) : (
                <div className="space-y-2">
                  {availableDocuments.map((doc) => {
                    const isAttached = selectedDocIds.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          if (isAttached) {
                            setSelectedDocIds(selectedDocIds.filter((id) => id !== doc.id));
                          } else {
                            setSelectedDocIds([...selectedDocIds, doc.id]);
                          }
                        }}
                        className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          isAttached
                            ? 'bg-[#102B50]/5 border-[#102B50]'
                            : 'bg-white border-[#E4EAF1] hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isAttached}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-[#102B50] focus:ring-[#102B50]"
                          />
                          <div>
                            <div className="text-xs font-bold text-[#172B45]">{doc.fileName}</div>
                            <div className="text-[10px] text-[#66758A]">
                              {doc.documentType?.name || 'Document'} • {new Date(doc.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isAttached ? 'bg-[#102B50] text-white' : 'bg-slate-100 text-[#66758A]'
                          }`}
                        >
                          {isAttached ? 'সংযুক্ত' : 'যুক্ত করুন'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 8: REVIEW & SUBMISSION
            ========================================================================= */}
        {currentStep === 8 && (
          <div className="space-y-6 font-bengali max-w-2xl mx-auto">
            <div>
              <h2 className="text-lg font-bold text-[#172B45]">আবেদন পর্যালোচনা (Review & Submission)</h2>
              <p className="text-xs text-[#66758A]">
                চূড়ান্তভাবে জমা দেওয়ার আগে প্রতিটি ক্যাটাগরির তথ্য সাবধানে মিলিয়ে নিন। প্রয়োজনে সম্পাদনা বাটনে ক্লিক করে সংশোধন করতে পারবেন।
              </p>
            </div>

            {/* Read-Only Summary Grouped by Category with Edit Buttons */}
            <div className="space-y-3">
              {/* Category 1: Personal */}
              <div className="p-4 bg-[#F6F8FB] border border-[#E4EAF1] rounded-xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#E4EAF1]">
                  <span className="text-xs font-bold text-[#102B50] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#102B50]" />
                    ১. ব্যক্তিগত তথ্য
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-[11px] font-bold text-[#102B50] hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> সম্পাদনা
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-[#172B45]">
                  <div>নাম: <strong>{personalForm.fullName || 'N/A'}</strong></div>
                  <div>মোবাইল: <strong>{personalForm.phone || 'N/A'}</strong></div>
                  <div>জন্ম তারিখ: <strong>{personalForm.dateOfBirth || 'N/A'}</strong></div>
                  <div>জেলা: <strong>{personalForm.district || 'N/A'}</strong></div>
                  <div className="col-span-2">বর্তমান ঠিকানা: {personalForm.address || 'N/A'}</div>
                </div>
              </div>

              {/* Category 2: Photo */}
              <div className="p-4 bg-[#F6F8FB] border border-[#E4EAF1] rounded-xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#E4EAF1]">
                  <span className="text-xs font-bold text-[#102B50] flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#102B50]" />
                    ২. পাসপোর্ট সাইজ ছবি
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-[11px] font-bold text-[#102B50] hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> সম্পাদনা
                  </button>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  {photoPreview ? (
                    <div className="relative w-12 h-14 rounded border border-[#E4EAF1] overflow-hidden">
                      <Image src={photoPreview} alt="Review Photo" fill className="object-cover" />
                    </div>
                  ) : (
                    <span className="text-xs text-[#C2414B]">ছবি আপলোড করা হয়নি</span>
                  )}
                  <span className="text-xs text-[#24856A] font-semibold">
                    {photoPreview ? 'ছবি সফলভাবে সংযুক্ত রয়েছে' : ''}
                  </span>
                </div>
              </div>

              {/* Category 3: Passport */}
              <div className="p-4 bg-[#F6F8FB] border border-[#E4EAF1] rounded-xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#E4EAF1]">
                  <span className="text-xs font-bold text-[#102B50] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#102B50]" />
                    ৩. পাসপোর্ট / জাতীয় পরিচয়
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-[11px] font-bold text-[#102B50] hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> সম্পাদনা
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-[#172B45]">
                  <div>পাসপোর্ট স্ট্যাটাস: <strong>{passportForm.passportAvailable ? 'আছে' : 'নেই'}</strong></div>
                  <div>
                    {passportForm.passportAvailable ? (
                      <>পাসপোর্ট নং: <strong className="font-mono">{passportForm.passportNumber}</strong></>
                    ) : (
                      <>এনআইডি নং: <strong className="font-mono">{passportForm.nidNumber}</strong></>
                    )}
                  </div>
                  {passportForm.passportAvailable && (
                    <div>মেয়াদ: <strong>{passportForm.expiryDate}</strong></div>
                  )}
                </div>
              </div>

              {/* Category 4: Education */}
              <div className="p-4 bg-[#F6F8FB] border border-[#E4EAF1] rounded-xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#E4EAF1]">
                  <span className="text-xs font-bold text-[#102B50] flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#102B50]" />
                    ৪. শিক্ষাগত যোগ্যতা
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="text-[11px] font-bold text-[#102B50] hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> সম্পাদনা
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-[#172B45]">
                  <div>সর্বোচ্চ স্তর: <strong>{educationForm.highestLevel}</strong></div>
                  <div>প্রতিষ্ঠান: <strong>{educationForm.institution || 'N/A'}</strong></div>
                </div>
              </div>

              {/* Category 5: Experience */}
              <div className="p-4 bg-[#F6F8FB] border border-[#E4EAF1] rounded-xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#E4EAF1]">
                  <span className="text-xs font-bold text-[#102B50] flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#102B50]" />
                    ৫. কাজের অভিজ্ঞতা ও দক্ষতা
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="text-[11px] font-bold text-[#102B50] hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> সম্পাদনা
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-[#172B45]">
                  <div>অভিজ্ঞতা স্ট্যাটাস: <strong>{experienceForm.status === 'EXPERIENCED' ? 'অভিজ্ঞ' : 'ফ্রেশার'}</strong></div>
                  <div>পেশা: <strong>{experienceForm.occupation || 'N/A'}</strong></div>
                  <div>কাজের সময়কাল: <strong>{experienceForm.yearsOfExperience} বছর</strong></div>
                  <div>দক্ষতা: <strong>{experienceForm.skills || 'N/A'}</strong></div>
                </div>
              </div>

              {/* Category 6: Eligibility */}
              <div className="p-4 bg-[#F6F8FB] border border-[#E4EAF1] rounded-xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#E4EAF1]">
                  <span className="text-xs font-bold text-[#102B50] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#102B50]" />
                    ৬. কাজের যোগ্যতা ও সম্মতি
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(6)}
                    className="text-[11px] font-bold text-[#102B50] hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> সম্পাদনা
                  </button>
                </div>
                <div className="pt-2 text-xs text-[#172B45] space-y-1">
                  <div>মেডিকেল ও হেলথ ঘোষণা: <strong>{eligibilityForm.healthDeclaration ? 'হ্যাঁ (ফিট)' : 'না'}</strong></div>
                  <div>বেতন ও শর্তে সম্মতি: <strong>{eligibilityForm.salaryAgreed ? 'হ্যাঁ (সম্মত)' : 'না'}</strong></div>
                  <div>বিদেশ যাওয়ার প্রস্তুতি: <strong>{eligibilityForm.joiningAvailability}</strong></div>
                </div>
              </div>

              {/* Category 7: Documents */}
              <div className="p-4 bg-[#F6F8FB] border border-[#E4EAF1] rounded-xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#E4EAF1]">
                  <span className="text-xs font-bold text-[#102B50] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#102B50]" />
                    ৭. নথিপত্র সংযুক্তি
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(7)}
                    className="text-[11px] font-bold text-[#102B50] hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> সম্পাদনা
                  </button>
                </div>
                <div className="pt-2 text-xs text-[#172B45]">
                  সংযুক্ত ফাইলের সংখ্যা: <strong>{selectedDocIds.length} টি</strong>
                </div>
              </div>
            </div>

            {/* Confirmation & Privacy Checkboxes */}
            <div className="space-y-3 pt-3 border-t border-[#E4EAF1]">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#172B45]">
                <input
                  type="checkbox"
                  checked={accuracyConfirmed}
                  onChange={(e) => setAccuracyConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#102B50] focus:ring-[#102B50]"
                />
                <span>
                  আমি নিশ্চিত করছি যে উপরের সকল তথ্য ও জমাকৃত নথিপত্র সম্পূর্ণ সত্য এবং নির্ভুল। কোনো তথ্য অসত্য প্রমাণিত হলে আমার আবেদন বাতিলযোগ্য হবে। <span className="text-rose-600">*</span>
                </span>
              </label>
              {fieldErrors.accuracyConfirmed && (
                <p className="text-[11px] text-[#C2414B] pl-6">{fieldErrors.accuracyConfirmed}</p>
              )}

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#172B45]">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#102B50] focus:ring-[#102B50]"
                />
                <span>
                  আমি {BRAND.name}-এর সরকারি নীতিমালা ({BRAND.licenseNumber}), নিয়োগ শর্তাবলী ও প্রার্থীর তথ্য সংরক্ষণ নীতিমালায় সম্মতি জানাচ্ছি। <span className="text-rose-600">*</span>
                </span>
              </label>
              {fieldErrors.termsAgreed && (
                <p className="text-[11px] text-[#C2414B] pl-6">{fieldErrors.termsAgreed}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Wizard Bottom Navigation Bar */}
      <div className="p-4 sm:p-5 border-t border-[#E4EAF1] bg-[#F6F8FB] flex items-center justify-between gap-3 font-bengali">
        <div>
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              disabled={saving || submitting}
              className="border-[#E4EAF1] text-[#172B45] hover:bg-white text-xs font-semibold px-4 py-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              পূর্ববর্তী ধাপ
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentStep < 8 ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleContinue}
              disabled={saving}
              className="bg-[#102B50] hover:bg-[#0B1D35] text-white font-bold text-xs px-6 py-2 shadow-2xs"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  সংরক্ষণ হচ্ছে...
                </>
              ) : currentStep === 0 ? (
                <>
                  আবেদন শুরু করুন
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-[#E8A2C1]" />
                </>
              ) : (
                <>
                  সংরক্ষণ ও পরবর্তী ধাপ
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-[#E8A2C1]" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSubmitApplication}
              disabled={submitting}
              className="bg-[#102B50] hover:bg-[#0B1D35] text-white font-black text-xs px-7 py-2.5 shadow-md flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  আবেদন জমা হচ্ছে...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#E8A2C1]" />
                  চূড়ান্ত আবেদন জমা দিন
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
