'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/components/ui/toast';

export default function PortalProfilePage() {
  const { success, error } = useToast();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    gender: 'MALE',
    nationality: 'Bangladeshi',
    district: '',
    upazila: '',
    address: '',
    education: '',
    profession: '',
    yearsOfExperience: 0,
    skills: '',
    languages: '',
    passportAvailable: false,
    passportNumber: '',
    passportExpiry: '',
    preferredCountryId: '',
    preferredJobCategoryId: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [pRes, cRes, catRes] = await Promise.all([
          fetch('/api/portal/profile'),
          fetch('/api/countries'),
          fetch('/api/job-categories'),
        ]);

        const [pData, cData, catData] = await Promise.all([
          pRes.json(),
          cRes.json(),
          catRes.json(),
        ]);

        if (pData.success) {
          setProfile(pData.data);
          const p = pData.data;
          setFormData({
            fullName: p.fullName || '',
            fatherName: p.fatherName || '',
            motherName: p.motherName || '',
            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
            gender: p.gender || 'MALE',
            nationality: p.nationality || 'Bangladeshi',
            district: p.district || '',
            upazila: p.upazila || '',
            address: p.address || '',
            education: p.education || '',
            profession: p.profession || '',
            yearsOfExperience: p.yearsOfExperience || 0,
            skills: p.skills || '',
            languages: p.languages || '',
            passportAvailable: !!p.passportAvailable,
            passportNumber: p.passportNumber || '',
            passportExpiry: p.passportExpiry ? p.passportExpiry.slice(0, 10) : '',
            preferredCountryId: p.preferredCountryId || '',
            preferredJobCategoryId: p.preferredJobCategoryId || '',
          });
        }
        if (cData.success) setCountries(cData.data);
        if (catData.success) setCategories(catData.data);
      } catch {
        error(t('প্রোফাইল তথ্য লোড করতে ব্যর্থ হয়েছে।', 'Failed to load profile details'));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [error, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/portal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          yearsOfExperience: Number(formData.yearsOfExperience) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        success(t('প্রোফাইল সফলভাবে আপডেট করা হয়েছে।', 'Profile updated successfully'));
        setProfile(data.data);
      } else {
        error(data.error || 'Failed to update profile');
      }
    } catch {
      error('Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <LoadingState text={t('প্রোফাইল তথ্য লোড হচ্ছে...', 'Loading candidate profile...')} />
      </div>
    );
  }

  const completion = profile?.completion?.percentage || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Strength Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {t('প্রার্থী বিবরণ', 'Candidate Bio')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {t('ব্যক্তিগত প্রোফাইল ও বায়োডাটা', 'Candidate Profile & CV')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('প্রার্থী আইডি:', 'Candidate ID:')}{' '}
            <span className="font-mono font-bold text-slate-800">{profile?.applicantNumber}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80">
          <div>
            <div className="text-xs text-slate-500 font-medium">
              {t('প্রোফাইল পূর্ণতা', 'Profile Strength')}
            </div>
            <div className="text-base font-bold text-slate-900">{completion}%</div>
          </div>
          <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${completion >= 80 ? 'bg-emerald-600' : 'bg-amber-500'}`}
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal Info */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-2">
            1. {t('ব্যক্তিগত ও পরিচয় তথ্য', 'Personal & Identity Details')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('পূর্ণ নাম (পাসপোর্ট অনুযায়ী) *', 'Full Legal Name *')}
              </label>
              <input
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('পিতার নাম', "Father's Name")}
              </label>
              <input
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('মাতার নাম', "Mother's Name")}
              </label>
              <input
                value={formData.motherName}
                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('জন্ম তারিখ', 'Date of Birth')}
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('লিঙ্গ', 'Gender')}
              </label>
              <select
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="MALE">{t('পুরুষ', 'Male')}</option>
                <option value="FEMALE">{t('মহিলা', 'Female')}</option>
                <option value="OTHER">{t('অন্যান্য', 'Other')}</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('জাতীয়তা', 'Nationality')}
              </label>
              <input
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Passport */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-2">
            2. {t('পাসপোর্ট ও ভ্রমণ প্রস্তুতি', 'Passport & Travel Information')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('বৈধ পাসপোর্ট আছে কি?', 'Valid Passport Available?')}
              </label>
              <select
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                value={formData.passportAvailable ? 'YES' : 'NO'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    passportAvailable: e.target.value === 'YES',
                  })
                }
              >
                <option value="NO">{t('না, এখনও নেই', 'No, not yet')}</option>
                <option value="YES">{t('হ্যাঁ, বৈধ পাসপোর্ট আছে', 'Yes, valid passport')}</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('পাসপোর্ট নম্বর', 'Passport Number')}
              </label>
              <input
                placeholder="e.g. A01234567"
                value={formData.passportNumber}
                onChange={(e) =>
                  setFormData({ ...formData, passportNumber: e.target.value.toUpperCase() })
                }
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('পাসপোর্টের মেয়াদ উত্তীর্ণের তারিখ', 'Passport Expiry Date')}
              </label>
              <input
                type="date"
                value={formData.passportExpiry}
                onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Trade & Experience */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-2">
            3. {t('পেশা, কাজের অভিজ্ঞতা ও পছন্দ', 'Profession, Experience & Preferences')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('মূল ট্রেড / পেশা', 'Primary Trade / Profession')}
              </label>
              <input
                placeholder={t('যেমন: পাইপ ফিটার, ইলেকট্রিশিয়ান, ড্রাইভার', 'e.g. Electrician, Heavy Driver')}
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('অভিজ্ঞতার বছর', 'Years of Work Experience')}
              </label>
              <input
                type="number"
                min={0}
                value={formData.yearsOfExperience}
                onChange={(e) =>
                  setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })
                }
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('পছন্দের গন্তব্য দেশ', 'Preferred Destination Country')}
              </label>
              <select
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                value={formData.preferredCountryId}
                onChange={(e) =>
                  setFormData({ ...formData, preferredCountryId: e.target.value })
                }
              >
                <option value="">{t('নির্দিষ্ট পছন্দ নেই / যেকোনো দেশ', 'Open to all countries')}</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('পছন্দের কাজের ক্যাটাগরি', 'Preferred Job Category')}
              </label>
              <select
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                value={formData.preferredJobCategoryId}
                onChange={(e) =>
                  setFormData({ ...formData, preferredJobCategoryId: e.target.value })
                }
              >
                <option value="">{t('ক্যাটাগরি নির্বাচন করুন', 'Select Category')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-full">
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('কারিগরি দক্ষতা ও সনদ', 'Technical Skills & Certifications')}
              </label>
              <textarea
                rows={2}
                placeholder={t('যেমন: 6G ওয়েল্ডিং সনদ, হেভি ড্রাইভিং লাইসেন্স...', 'e.g. 6G Welding Certificate...')}
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div className="col-span-full">
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('ভাষাগত দক্ষতা', 'Languages Spoken')}
              </label>
              <input
                placeholder={t('যেমন: বাংলা (মাতৃভাষা), ইংরেজি (প্রাথমিক), আরবি (ক্যাথোপকথন)', 'e.g. Bengali, English, Arabic')}
                value={formData.languages}
                onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Address */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-2">
            4. {t('স্থায়ী ঠিকানা ও যোগাযোগ', 'Address & Permanent Residence')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('জেলা', 'Home District')}
              </label>
              <input
                placeholder={t('যেমন: কুমিল্লা, চট্টগ্রাম, সিলেট', 'e.g. Chattogram, Sylhet')}
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('উপজেলা / থানা', 'Upazila / Thana')}
              </label>
              <input
                placeholder={t('যেমন: কোতোয়ালী, মিরসরাই', 'e.g. Kotwali, Mirsharai')}
                value={formData.upazila}
                onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div className="col-span-full">
              <label className="font-semibold text-slate-700 block mb-1.5">
                {t('গ্রাম / রাস্তার ঠিকানা', 'Village / Full Street Address')}
              </label>
              <textarea
                rows={2}
                placeholder={t('সম্পূর্ণ ডাক ঠিকানা লিখুন...', 'Complete postal address...')}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('সংরক্ষণ হচ্ছে...', 'Saving...') : t('প্রোফাইল সংরক্ষণ করুন', 'Save Profile Changes')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
