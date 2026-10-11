'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Plane,
  Briefcase,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  MapPin,
  Building2,
  ShieldCheck,
  Phone,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/components/ui/toast';
import { compressImageFile } from '@/lib/client-compress';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

interface JobApplyWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any | null;
  onApplicationSuccess: (applicationData: any) => void;
  applicationQuota: {
    currentCount: number;
    maxLimit: number;
    isLimitReached: boolean;
  };
}

export function JobApplyWizardModal({
  isOpen,
  onClose,
  job,
  onApplicationSuccess,
  applicationQuota,
}: JobApplyWizardModalProps) {
  const { language, t } = useLanguage();
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [savingStep, setSavingStep] = useState(false);
  const [submittingApply, setSubmittingApply] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const [applyNotes, setApplyNotes] = useState('');
  const [countries, setCountries] = useState<any[]>([]);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    district: '',
    upazila: '',
    address: '',
    emergencyContact: '',
    passportAvailable: false,
    passportNumber: '',
    passportExpiry: '',
    education: '',
    profession: '',
    yearsOfExperience: 0,
    skills: '',
    languages: '',
    profilePhoto: '',
  });

  // Calculate live completion percentage (0 - 100)
  const calculateLiveCompletion = () => {
    const checks = [
      { id: 'fullName', pass: !!(profileForm.fullName && profileForm.fullName.trim().length > 0) },
      { id: 'phone', pass: !!(profileForm.phone && profileForm.phone.trim().length > 0) },
      { id: 'photo', pass: !!(profileForm.profilePhoto && profileForm.profilePhoto.trim().length > 0) },
      { id: 'address', pass: !!(profileForm.district && profileForm.address && profileForm.address.trim().length > 0) },
      { id: 'emergency', pass: !!(profileForm.emergencyContact && profileForm.emergencyContact.trim().length > 0) },
      { id: 'education', pass: !!(profileForm.education && profileForm.education.trim().length > 0) },
      { id: 'skills', pass: !!(profileForm.profession || (profileForm.skills && profileForm.skills.trim().length > 0)) },
      { id: 'passport', pass: !!(profileForm.passportAvailable && profileForm.passportNumber && profileForm.passportNumber.trim().length > 0) },
    ];

    const passed = checks.filter((c) => c.pass).length;
    return Math.round((passed / checks.length) * 100);
  };

  const completionScore = calculateLiveCompletion();
  const is100Percent = completionScore === 100;

  // Load applicant profile and lookups when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadCandidateProfile() {
      setLoadingInitial(true);
      setStepError(null);
      try {
        const [profRes, cRes] = await Promise.all([
          fetch('/api/portal/profile'),
          fetch('/api/countries?activeOnly=true'),
        ]);

        const [profData, cData] = await Promise.all([profRes.json(), cRes.json()]);

        if (!isMounted) return;

        if (cData.success) {
          setCountries(cData.data || []);
        }

        if (profData.success && profData.data) {
          const p = profData.data;
          const prof = p.profile || {};

          const loadedData = {
            fullName: p.fullName || '',
            phone: p.phone || '',
            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
            gender: p.gender || 'MALE',
            district: p.district || '',
            upazila: p.upazila || '',
            address: p.address || prof.currentAddress || '',
            emergencyContact: prof.emergencyContact || '',
            passportAvailable: p.passportAvailable ?? false,
            passportNumber: p.passportNumber || '',
            passportExpiry: p.passportExpiry ? p.passportExpiry.slice(0, 10) : '',
            education: p.education || prof.education || '',
            profession: p.profession || '',
            yearsOfExperience: p.yearsOfExperience || prof.experienceYears || 0,
            skills: p.skills || prof.skills || '',
            languages: p.languages || '',
            profilePhoto: p.profilePhoto || '',
          };

          setProfileForm(loadedData);

          // Determine starting step based on completeness
          const pLiveChecks = [
            !!(loadedData.fullName && loadedData.phone && loadedData.district && loadedData.address && loadedData.emergencyContact),
            !!(loadedData.passportAvailable && loadedData.passportNumber),
            !!(loadedData.education && (loadedData.profession || loadedData.skills)),
            !!loadedData.profilePhoto,
          ];

          if (pLiveChecks.every(Boolean)) {
            setStep(5); // 100% complete: land directly on review & apply
          } else if (!pLiveChecks[0]) {
            setStep(1);
          } else if (!pLiveChecks[1]) {
            setStep(2);
          } else if (!pLiveChecks[2]) {
            setStep(3);
          } else if (!pLiveChecks[3]) {
            setStep(4);
          } else {
            setStep(1);
          }
        }
      } catch (err) {
        console.error('Failed to load profile for apply wizard', err);
        setStepError('Failed to load candidate profile. Please check connection.');
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    }

    loadCandidateProfile();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen || !job) return null;

  // Persist profile updates to backend
  const saveProfileData = async (dataToSave: any) => {
    setSavingStep(true);
    setStepError(null);
    try {
      const res = await fetch('/api/portal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dataToSave,
          yearsOfExperience: Number(dataToSave.yearsOfExperience) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save profile changes');
      }
      return true;
    } catch (err: any) {
      setStepError(err.message || 'Error saving profile step');
      return false;
    } finally {
      setSavingStep(false);
    }
  };

  // Step 1 Validation & Next
  const handleNextStep1 = async () => {
    if (!profileForm.fullName.trim()) {
      setStepError(t('অনুগ্রহ করে প্রার্থীর পূর্ণ নাম প্রদান করুন।', 'Please provide candidate full name.'));
      return;
    }
    if (!profileForm.phone.trim()) {
      setStepError(t('মোবাইল নম্বর প্রদান করা বাধ্যতামূলক।', 'Phone number is mandatory.'));
      return;
    }
    if (!profileForm.district.trim()) {
      setStepError(t('অনুগ্রহ করে আপনার জেলা নির্বাচন বা লিখুন।', 'Please specify your district.'));
      return;
    }
    if (!profileForm.address.trim()) {
      setStepError(t('বর্তমান ঠিকানা প্রদান করা আবশ্যক।', 'Present address is required.'));
      return;
    }
    if (!profileForm.emergencyContact.trim()) {
      setStepError(t('জরুরি যোগাযোগ নম্বর বা অভিভাবকের তথ্য প্রদান করুন।', 'Emergency contact phone is required.'));
      return;
    }

    const saved = await saveProfileData({
      fullName: profileForm.fullName,
      phone: profileForm.phone,
      dateOfBirth: profileForm.dateOfBirth || null,
      gender: profileForm.gender,
      district: profileForm.district,
      upazila: profileForm.upazila || null,
      address: profileForm.address,
      emergencyContact: profileForm.emergencyContact,
    });

    if (saved) {
      setStep(2);
    }
  };

  // Step 2 Validation & Next
  const handleNextStep2 = async () => {
    if (!profileForm.passportAvailable) {
      setStepError(
        t(
          'আন্তর্জাতিক বৈদেশিক কর্মসংস্থানের জন্য পাসপোর্ট বাধ্যতামূলক। আপনার পাসপোর্ট থাকলে নির্বাচন করুন।',
          'A valid passport is required for overseas migration. Please check Yes and provide passport details.'
        )
      );
      return;
    }
    if (!profileForm.passportNumber.trim()) {
      setStepError(t('বৈধ পাসপোর্ট নম্বর প্রদান করুন।', 'Please enter your valid passport number.'));
      return;
    }

    const saved = await saveProfileData({
      passportAvailable: true,
      passportNumber: profileForm.passportNumber.toUpperCase().trim(),
      passportExpiry: profileForm.passportExpiry || null,
    });

    if (saved) {
      setStep(3);
    }
  };

  // Step 3 Validation & Next
  const handleNextStep3 = async () => {
    if (!profileForm.education.trim()) {
      setStepError(t('শিক্ষাগত যোগ্যতা উল্লেখ করুন।', 'Please enter educational qualification.'));
      return;
    }
    if (!profileForm.profession.trim() && !profileForm.skills.trim()) {
      setStepError(t('আপনার মূল ট্রেড / পেশা বা দক্ষতা উল্লেখ করুন।', 'Please specify your trade or skills.'));
      return;
    }

    const saved = await saveProfileData({
      education: profileForm.education,
      profession: profileForm.profession,
      yearsOfExperience: Number(profileForm.yearsOfExperience) || 0,
      skills: profileForm.skills || profileForm.profession,
      languages: profileForm.languages || 'Bengali',
    });

    if (saved) {
      setStep(4);
    }
  };

  // Step 4 Photo Upload & Next
  const handlePhotoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStepError(null);
    setUploadingPhoto(true);

    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.85,
      });

      const form = new FormData();
      form.append('file', compressed);

      const res = await fetch('/api/portal/profile/upload-photo', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      setProfileForm((prev) => ({ ...prev, profilePhoto: data.photoUrl }));
      success(t('প্রোফাইল ছবি সফলভাবে যুক্ত হয়েছে!', 'Profile photo saved successfully!'));
    } catch (err: any) {
      setStepError(err.message || 'Photo upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleNextStep4 = () => {
    if (!profileForm.profilePhoto) {
      setStepError(t('চাকরির আবেদনের জন্য পাসপোর্ট সাইজের ছবি বাধ্যতামূলক।', 'Passport photo is required.'));
      return;
    }
    setStep(5);
  };

  // Final Step 5 Submit Application
  const handleFinalSubmitApply = async () => {
    if (!is100Percent) {
      setStepError(
        t(
          'আবেদন নিশ্চিত করার জন্য প্রোফাইল ১০০% সম্পন্ন হওয়া আবশ্যক। পূর্ববর্তী ধাপগুলো পূরণ করুন।',
          'Profile must be 100% complete before applying. Please complete all steps.'
        )
      );
      return;
    }

    setSubmittingApply(true);
    setStepError(null);

    try {
      const res = await fetch(`/api/portal/jobs/${job.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: applyNotes.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit application');
      }

      success(
        t(
          `অভিনন্দন! আপনার আবেদন সফলভাবে সম্পন্ন হয়েছে। (ট্র্যাকিং কোড: ${data.data.applicationCode})`,
          `Congratulations! Application submitted successfully. (Code: ${data.data.applicationCode})`
        )
      );

      onApplicationSuccess(data.data);
      onClose();
    } catch (err: any) {
      setStepError(err.message || 'Error submitting application');
    } finally {
      setSubmittingApply(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <Briefcase className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-white line-clamp-1">
                  {job.title}
                </h2>
                {job.country?.flag && <span className="text-base">{job.country.flag}</span>}
              </div>
              <p className="text-xs text-slate-300">
                {job.employer?.companyName || job.country?.name || 'Overseas Placement'} • {t('ধাপে ধাপে প্রোফাইল ও আবেদন', 'Step-by-Step Profile & Application')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Completion & Step Indicators */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span>{t('প্রোফাইল পূর্ণতা:', 'Profile Strength:')}</span>
              <span className={`font-bold ${is100Percent ? 'text-emerald-600' : 'text-amber-600'}`}>
                {completionScore}% {is100Percent && '★ (100% Complete)'}
              </span>
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              {t(`ধাপ ${step} এর ৫`, `Step ${step} of 5`)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-300 ${
                is100Percent ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-emerald-500'
              }`}
              style={{ width: `${Math.max(completionScore, step * 20)}%` }}
            />
          </div>

          {/* Step Pill Tabs */}
          <div className="grid grid-cols-5 gap-1.5 text-[10px] font-semibold text-center">
            {[
              { num: 1, labelBn: '১. পরিচয়', labelEn: '1. Identity', icon: User },
              { num: 2, labelBn: '২. পাসপোর্ট', labelEn: '2. Passport', icon: Plane },
              { num: 3, labelBn: '৩. দক্ষতা', labelEn: '3. Skills', icon: Briefcase },
              { num: 4, labelBn: '৪. ছবি', labelEn: '4. Photo', icon: Camera },
              { num: 5, labelBn: '৫. আবেদন', labelEn: '5. Submit', icon: CheckCircle2 },
            ].map((tab) => {
              const IconComponent = tab.icon;
              const isActive = step === tab.num;
              const isPast = step > tab.num;

              return (
                <button
                  key={tab.num}
                  type="button"
                  onClick={() => setStep(tab.num)}
                  className={`py-1.5 px-1 rounded-md border flex flex-col items-center justify-center transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5 mb-0.5" />
                  <span className="truncate max-w-full">
                    {language === 'bn' ? tab.labelBn : tab.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {stepError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{stepError}</span>
            </div>
          )}

          {loadingInitial ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-700" />
              <p className="text-xs">{t('প্রার্থীর তথ্য লোড হচ্ছে...', 'Loading candidate details...')}</p>
            </div>
          ) : (
            <>
              {/* STEP 1: PERSONAL & CONTACT */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-600" />
                      {t('ব্যক্তিগত ও যোগাযোগের তথ্য', 'Personal & Contact Information')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('পাসপোর্ট বা জাতীয় পরিচয়পত্র অনুযায়ী সঠিক তথ্য প্রদান করুন।', 'Please provide exact legal name and active contact details.')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="font-semibold text-slate-700 block mb-1">
                        {t('পূর্ণ নাম (পাসপোর্ট অনুযায়ী) *', 'Full Name (As in Passport) *')}
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        placeholder="e.g. Md Shakil Ahmed"
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        {t('মোবাইল নম্বর *', 'Phone Number *')}
                      </label>
                      <input
                        type="tel"
                        required
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="01XXXXXXXXX"
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        {t('জন্ম তারিখ', 'Date of Birth')}
                      </label>
                      <input
                        type="date"
                        value={profileForm.dateOfBirth}
                        onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        {t('লিঙ্গ', 'Gender')}
                      </label>
                      <select
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      >
                        <option value="MALE">{t('পুরুষ', 'Male')}</option>
                        <option value="FEMALE">{t('মহিলা', 'Female')}</option>
                        <option value="OTHER">{t('অন্যান্য', 'Other')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        {t('নিজ জেলা *', 'Home District *')}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Netrokona, Dhaka, Comilla"
                        value={profileForm.district}
                        onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        {t('উপজেলা / থানা', 'Upazila / Thana')}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kendua, Mirpur"
                        value={profileForm.upazila}
                        onChange={(e) => setProfileForm({ ...profileForm, upazila: e.target.value })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        {t('জরুরি যোগাযোগ / অভিভাবকের ফোন *', 'Emergency Contact Phone *')}
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="01XXXXXXXXX"
                        value={profileForm.emergencyContact}
                        onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-semibold text-slate-700 block mb-1">
                        {t('বর্তমান সম্পূর্ণ ঠিকানা *', 'Present Full Address *')}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Village/Road, Post Office, District"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PASSPORT DETAILS */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Plane className="w-4 h-4 text-emerald-600" />
                      {t('পাসপোর্ট ও ভ্রমণ প্রস্তুতি', 'Passport & Travel Readiness')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('বৈদেশিক ভিসা আবেদন ও প্রসেসিং এর জন্য পাসপোর্ট থাকা আবশ্যক।', 'A valid MRP or E-Passport is mandatory for international hiring.')}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 text-xs">
                    <div>
                      <label className="font-semibold text-slate-800 block mb-1.5">
                        {t('আপনার কি পাসপোর্ট আছে? *', 'Do you have a valid passport? *')}
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                          <input
                            type="radio"
                            name="passportRadio"
                            checked={profileForm.passportAvailable === true}
                            onChange={() => setProfileForm({ ...profileForm, passportAvailable: true })}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{t('হ্যাঁ, পাসপোর্ট আছে (Yes)', 'Yes, I have a passport')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                          <input
                            type="radio"
                            name="passportRadio"
                            checked={profileForm.passportAvailable === false}
                            onChange={() => setProfileForm({ ...profileForm, passportAvailable: false })}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{t('না, এখনও নেই (No)', 'No passport yet')}</span>
                        </label>
                      </div>
                    </div>

                    {profileForm.passportAvailable ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            {t('পাসপোর্ট নম্বর *', 'Passport Number *')}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. A01234567 / EE0123456"
                            value={profileForm.passportNumber}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                passportNumber: e.target.value.toUpperCase().trim(),
                              })
                            }
                            className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            {t('পাসপোর্টের মেয়াদ উত্তীর্ণের তারিখ', 'Passport Expiry Date')}
                          </label>
                          <input
                            type="date"
                            value={profileForm.passportExpiry}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, passportExpiry: e.target.value })
                            }
                            className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          {t(
                            'সতর্কবার্তা: বিদেশে নিয়োগের জন্য পাসপোর্ট নম্বর প্রদান বাধ্যতামূলক। আবেদন সম্পন্ন করতে পাসপোর্ট অপশনে হ্যাঁ নির্বাচন করে আপনার পাসপোর্ট নম্বর লিখুন।',
                            'Notice: An active passport is legally required for overseas visa issuance. Please check Yes and enter your passport number to reach 100% completion.'
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: TRADE, SKILLS & EDUCATION */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      {t('পেশা, ট্রেড ও শিক্ষাগত যোগ্যতা', 'Profession, Trade & Education')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('আপনার কাজের অভিজ্ঞতা ও ট্রেড অনুযায়ী চাকরির সাথে ম্যাচিং করা হবে।', 'Your skills are matched with employer recruitment criteria.')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        {t('সর্বোচ্চ শিক্ষাগত যোগ্যতা *', 'Highest Education *')}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. SSC, HSC, Diploma, Primary"
                        value={profileForm.education}
                        onChange={(e) => setProfileForm({ ...profileForm, education: e.target.value })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        {t('মূল পেশা / ট্রেড *', 'Primary Trade / Profession *')}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Electrician, Pipe Fitter, Driver, Mason"
                        value={profileForm.profession}
                        onChange={(e) => setProfileForm({ ...profileForm, profession: e.target.value })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        {t('কাজের অভিজ্ঞতার বছর', 'Years of Experience')}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={profileForm.yearsOfExperience}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            yearsOfExperience: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        {t('ভাষাজ্ঞান (যেমন: বাংলা, ইংরেজি, আরবি)', 'Languages Known')}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bengali, English, Arabic"
                        value={profileForm.languages}
                        onChange={(e) => setProfileForm({ ...profileForm, languages: e.target.value })}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-semibold text-slate-700 block mb-1">
                        {t('বিশেষ ট্রেড দক্ষতাসমূহ *', 'Specific Trade Skills *')}
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="e.g. Residential wiring, DB board fitting, motor repair"
                        value={profileForm.skills}
                        onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PROFILE PHOTO */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      {t('পাসপোর্ট সাইজের ছবি আপলোড', 'Passport-Style Profile Photo')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('পরিষ্কার মুখের ছবি বৈদেশিক চাকরির বায়োডাটার জন্য আবশ্যক।', 'A clear, front-facing passport photograph is mandatory for candidate shortlisting.')}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
                    <div className="relative group">
                      <ProfileAvatar
                        name={profileForm.fullName || 'Applicant'}
                        photoUrl={profileForm.profilePhoto}
                        size="2xl"
                        className="w-28 h-28 sm:w-32 sm:h-32 ring-4 ring-emerald-500/20 shadow-md"
                      />

                      {profileForm.profilePhoto && (
                        <div className="absolute -top-1 -right-1 bg-emerald-600 text-white rounded-full p-1 shadow-sm">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-800">
                        {profileForm.profilePhoto
                          ? t('ছবি সংরক্ষিত আছে', 'Photo is attached')
                          : t('কোনো ছবি যুক্ত করা হয়নি', 'No photo attached yet')}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        JPEG, PNG, WebP (Max 5MB)
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoFileSelect}
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {uploadingPhoto ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{t('ছবি আপলোড হচ্ছে...', 'Compressing & Uploading...')}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            {profileForm.profilePhoto
                              ? t('ছবি পরিবর্তন করুন', 'Change Photo')
                              : t('ফাইল নির্বাচন করুন', 'Select Photograph')}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW & CONFIRM APPLICATION */}
              {step === 5 && (
                <div className="space-y-4">
                  {/* Celebration / Status Alert */}
                  {is100Percent ? (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold text-emerald-950">
                            {t('অভিনন্দন! আপনার প্রোফাইল ১০০% সম্পন্ন হয়েছে।', 'Congratulations! Your profile is 100% complete.')}
                          </p>
                          <p className="text-[11px] text-emerald-800">
                            {t('এখন আপনি সফলভাবে চাকরির আবেদন জমা দিতে পারেন।', 'You are fully qualified to confirm and submit this application.')}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[11px]">
                        100% Verified
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-amber-950">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>
                          {t('আপনার প্রোফাইল এখনও ১০০% সম্পন্ন হয়নি।', 'Your profile is not 100% complete yet.')}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        {t('অনুগ্রহ করে পূর্বের ধাপগুলো (১ থেকে ৪) সঠিকভাবে পূরণ করুন। বর্তমান স্কোর:', 'Please fill in all required fields from steps 1-4. Current score:')}{' '}
                        <strong>{completionScore}%</strong>
                      </p>
                    </div>
                  )}

                  {/* Candidate Summary Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block border-b border-slate-200 pb-1">
                      {t('প্রার্থীর সারসংক্ষেপ', 'Candidate Summary')}
                    </span>
                    <div className="flex items-start gap-3">
                      <ProfileAvatar
                        name={profileForm.fullName}
                        photoUrl={profileForm.profilePhoto}
                        size="md"
                        className="w-12 h-12 rounded-lg shrink-0 border border-slate-200"
                      />
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 flex-1">
                        <div>
                          <span className="text-slate-400 block text-[10px]">{t('নাম', 'Name')}</span>
                          <span className="font-semibold text-slate-900">{profileForm.fullName || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">{t('পাসপোর্ট নম্বর', 'Passport')}</span>
                          <span className="font-mono font-semibold text-slate-900">{profileForm.passportNumber || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">{t('ট্রেড / পেশা', 'Trade')}</span>
                          <span className="font-semibold text-slate-900">{profileForm.profession || '—'} ({profileForm.yearsOfExperience} yrs)</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">{t('মোবাইল', 'Phone')}</span>
                          <span className="font-semibold text-slate-900">{profileForm.phone || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Target Job Summary */}
                  <div className="bg-navy-950 text-white rounded-xl p-3.5 text-xs space-y-2">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block border-b border-slate-800 pb-1">
                      {t('নিয়োগ বিজ্ঞপ্তির বিবরণ', 'Target Job Details')}
                    </span>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-white">{job.title}</h4>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {job.country?.name} {job.country?.flag} • {job.employer?.companyName || 'Verified Employer'}
                        </p>
                      </div>
                      {job.salaryMin && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">{t('মাসিক বেতন', 'Salary')}</span>
                          <span className="font-bold text-emerald-400">
                            {job.salaryMin} {job.salaryCurrency}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cover Note Textarea */}
                  <div>
                    <label className="font-semibold text-xs text-slate-700 block mb-1">
                      {t('সংক্ষিপ্ত বার্তা বা কভার নোট (ঐচ্ছিক)', 'Cover Note / Message to Employer (Optional)')}
                    </label>
                    <textarea
                      rows={2}
                      value={applyNotes}
                      onChange={(e) => setApplyNotes(e.target.value)}
                      placeholder={t('আপনার বিশেষ অভিজ্ঞতা বা কোনো মন্তব্য থাকলে এখানে লিখুন...', 'Add any remarks or special notes for your application...')}
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Bottom Footer Navigation */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setStepError(null);
                  setStep(step - 1);
                }}
                disabled={savingStep || submittingApply}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('পূর্ববর্তী ধাপ', 'Previous')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                {t('বাতিল', 'Cancel')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                type="button"
                onClick={handleNextStep1}
                disabled={savingStep}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {savingStep ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>{t('পরবর্তী: পাসপোর্ট তথ্য', 'Next: Passport')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleNextStep2}
                disabled={savingStep}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {savingStep ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>{t('পরবর্তী: দক্ষতা ও শিক্ষা', 'Next: Skills & Trade')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleNextStep3}
                disabled={savingStep}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {savingStep ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>{t('পরবর্তী: ছবি আপলোড', 'Next: Photo Upload')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                onClick={handleNextStep4}
                disabled={savingStep}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <span>{t('পরবর্তী: চূড়ান্ত পর্যালোচনা', 'Next: Final Review')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 5 && (
              <button
                type="button"
                onClick={handleFinalSubmitApply}
                disabled={!is100Percent || submittingApply || applicationQuota.isLimitReached}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-md transition-all ${
                  is100Percent && !applicationQuota.isLimitReached
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer hover:shadow-lg'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {submittingApply ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('আবেদন জমা হচ্ছে...', 'Submitting Application...')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {is100Percent
                        ? t('আবেদন সফলভাবে সম্পন্ন করুন', 'Confirm & Submit Application')
                        : t('১০০% সম্পন্ন হলে আবেদন আনলক হবে', 'Complete 100% to Unlock Apply')}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
