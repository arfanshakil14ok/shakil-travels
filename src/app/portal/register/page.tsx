'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff, AlertCircle, Briefcase, GraduationCap, CheckCircle2, Camera, Upload } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';

function RegisterForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [candidateType, setCandidateType] = useState<'SKILLED' | 'UNSKILLED'>('SKILLED');
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Persist language preference
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('sgr_lang');
      if (savedLang === 'en' || savedLang === 'bn') {
        setLanguage(savedLang);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLanguageToggle = () => {
    const nextLang = language === 'bn' ? 'en' : 'bn';
    setLanguage(nextLang);
    try {
      localStorage.setItem('sgr_lang', nextLang);
    } catch {
      // ignore
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        language === 'bn'
          ? 'ছবির সাইজ ৫ মেগাবাইট (5MB) এর কম হতে হবে।'
          : 'Photo size must be less than 5MB.'
      );
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage(
        language === 'bn'
          ? 'শুধুমাত্র JPG, PNG বা WebP ফরম্যাটের ছবি গ্রহণযোগ্য।'
          : 'Only JPG, PNG, or WebP format is allowed.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const { fullName, email, phone, password, confirmPassword, agreeTerms } = formData;

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage(
        language === 'bn'
          ? 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন (কমপক্ষে ২ অক্ষর)।'
          : 'Please enter your full legal name (at least 2 characters).'
      );
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage(
        language === 'bn'
          ? 'একটি সঠিক ও কার্যকর ইমেইল এড্রেস প্রদান করুন।'
          : 'Please enter a valid email address.'
      );
      return false;
    }

    const phoneClean = phone.trim().replace(/[\s-]/g, '');
    if (!phoneClean || phoneClean.length < 8) {
      setErrorMessage(
        language === 'bn'
          ? 'একটি সঠিক ও কার্যকর মোবাইল নম্বর প্রদান করুন।'
          : 'Please enter a valid phone number (at least 8 digits).'
      );
      return false;
    }

    if (!password || password.length < 6) {
      setErrorMessage(
        language === 'bn'
          ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
          : 'Password must be at least 6 characters long.'
      );
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        language === 'bn'
          ? 'পাসওয়ার্ড দুটি মিলছে না। পুনরায় যাচাই করুন।'
          : 'Passwords do not match. Please verify.'
      );
      return false;
    }

    if (!profilePhoto) {
      setErrorMessage(
        language === 'bn'
          ? 'অনুগ্রহ করে একটি পাসপোর্ট সাইজের প্রোফাইল ছবি যুক্ত করুন।'
          : 'Profile Photo is required. Please upload your passport-size photo.'
      );
      return false;
    }

    if (!agreeTerms) {
      setErrorMessage(
        language === 'bn'
          ? 'এগিয়ে যেতে শর্তাবলি ও গোপনীয়তা নীতি গ্রহণ করুন।'
          : 'Please accept the Terms & Conditions and Privacy Policy.'
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/portal/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          candidateType,
          profilePhoto,
          agreeTerms: formData.agreeTerms,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Automatically logged in via cookie; redirect based on candidate type
        if (candidateType === 'UNSKILLED') {
          router.push('/portal/training');
        } else {
          router.push('/portal');
        }
      } else {
        if (data.errorBn && language === 'bn') {
          setErrorMessage(data.errorBn);
        } else {
          setErrorMessage(
            data.error ||
              (language === 'bn'
                ? 'অ্যাকাউন্ট তৈরি ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।'
                : 'Registration failed. Please try again.')
          );
        }
      }
    } catch {
      setErrorMessage(
        language === 'bn'
          ? 'নেটওয়ার্ক সংযোগ ত্রুটি। পুনরায় চেষ্টা করুন।'
          : 'Network connection error. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 sm:px-6 font-sans">
      {/* Centered Register Card */}
      <div className="w-full max-w-[420px] bg-white border border-slate-200/90 rounded-xl shadow-xs p-6 sm:p-8 space-y-6">
        {/* Brand & Language Header */}
        <div className="flex items-center justify-between">
          <BrandLogo href="/" size="sm" variant="horizontal" showTagline={false} />

          <button
            type="button"
            onClick={handleLanguageToggle}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-900 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Toggle language"
          >
            {language === 'bn' ? 'English' : 'বাংলা'}
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h1
            className={`text-xl sm:text-[22px] font-bold tracking-tight text-slate-900 ${
              language === 'bn' ? 'font-bengali' : ''
            }`}
          >
            {language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create your account'}
          </h1>
          <p
            className={`text-xs sm:text-[13px] text-slate-500 leading-relaxed ${
              language === 'bn' ? 'font-bengali' : ''
            }`}
          >
            {language === 'bn'
              ? 'আপনার প্রবাসী চাকরি ও আবেদন ব্যবস্থাপনার জন্য একটি অ্যাকাউন্ট তৈরি করুন।'
              : 'Create an account to manage your overseas job applications and recruitment process.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800 leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Smart Candidate Classification Question */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className={`block text-xs sm:text-[13px] font-bold text-slate-900 ${language === 'bn' ? 'font-bengali' : ''}`}>
                {language === 'bn' ? 'আপনি কি দক্ষ?' : 'Are you skilled?'}
              </label>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {language === 'bn' ? 'বাছাইকরণ' : 'Required'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: Skilled */}
              <button
                type="button"
                onClick={() => setCandidateType('SKILLED')}
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  candidateType === 'SKILLED'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Briefcase className={`w-4 h-4 ${candidateType === 'SKILLED' ? 'text-emerald-700' : 'text-slate-400'}`} />
                  {candidateType === 'SKILLED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                </div>
                <span className={`text-xs font-bold leading-tight ${language === 'bn' ? 'font-bengali' : ''}`}>
                  {language === 'bn' ? 'হ্যাঁ, আমি দক্ষ' : 'Yes, I am skilled'}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                  {language === 'bn' ? 'কাজের অভিজ্ঞতা আছে' : 'Ready to apply for jobs'}
                </span>
              </button>

              {/* Option 2: Unskilled */}
              <button
                type="button"
                onClick={() => setCandidateType('UNSKILLED')}
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  candidateType === 'UNSKILLED'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <GraduationCap className={`w-4 h-4 ${candidateType === 'UNSKILLED' ? 'text-indigo-700' : 'text-slate-400'}`} />
                  {candidateType === 'UNSKILLED' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700" />}
                </div>
                <span className={`text-xs font-bold leading-tight ${language === 'bn' ? 'font-bengali' : ''}`}>
                  {language === 'bn' ? 'না, আমি অদক্ষ' : 'No, I am unskilled'}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                  {language === 'bn' ? 'কাজ শিখতে চাই' : 'Skill training portal'}
                </span>
              </button>
            </div>
            <p className={`text-[11px] text-slate-500 leading-snug ${language === 'bn' ? 'font-bengali' : ''}`}>
              {candidateType === 'UNSKILLED'
                ? (language === 'bn' ? '💡 আপনি অদক্ষ নির্বাচন করেছেন। নিবন্ধনের পর সরাসরি স্কিল ট্রেনিং পোর্টালে যুক্ত হতে পারবেন।' : '💡 You selected Unskilled. After registration, you will enter the Skill Training Portal.')
                : (language === 'bn' ? '✅ আপনি দক্ষ নির্বাচন করেছেন। সরাসরি বৈদেশিক চাকরির বিজ্ঞপ্তিতে আবেদন করতে পারবেন।' : '✅ You selected Skilled. You can apply directly to overseas job vacancies.')}
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className={`block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5 ${
                language === 'bn' ? 'font-bengali' : ''
              }`}
            >
              {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder={
                language === 'bn'
                  ? 'যেমন: মোহাম্মদ রহিম উদ্দিন'
                  : 'e.g. Mohammad Rahim Uddin'
              }
              autoComplete="name"
              className="w-full h-11 sm:h-12 px-3.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-800 transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className={`block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5 ${
                language === 'bn' ? 'font-bengali' : ''
              }`}
            >
              {language === 'bn' ? 'ইমেইল' : 'Email'}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={
                language === 'bn'
                  ? 'যেমন: candidate@email.com'
                  : 'name@example.com'
              }
              autoComplete="email"
              className="w-full h-11 sm:h-12 px-3.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-800 transition-colors"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="phone"
              className={`block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5 ${
                language === 'bn' ? 'font-bengali' : ''
              }`}
            >
              {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={
                language === 'bn'
                  ? 'যেমন: +8801700000000'
                  : '+8801700000000'
              }
              autoComplete="tel"
              className="w-full h-11 sm:h-12 px-3.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-800 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className={`block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5 ${
                language === 'bn' ? 'font-bengali' : ''
              }`}
            >
              {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full h-11 sm:h-12 pl-3.5 pr-11 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-800 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 focus:outline-none focus:text-slate-900 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className={`block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5 ${
                language === 'bn' ? 'font-bengali' : ''
              }`}
            >
              {language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full h-11 sm:h-12 pl-3.5 pr-11 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-800 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 focus:outline-none focus:text-slate-900 transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Mandatory Profile Photo Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                className={`block text-xs sm:text-[13px] font-bold text-slate-900 ${
                  language === 'bn' ? 'font-bengali' : ''
                }`}
              >
                {language === 'bn' ? 'প্রোফাইল ছবি (পাসপোর্ট সাইজ) *' : 'Profile Photo (Passport Size) *'}
              </label>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {language === 'bn' ? 'বাধ্যতামূলক' : 'Required'}
              </span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center gap-3.5 ${
                profilePhoto
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-400'
              }`}
            >
              {profilePhoto ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-emerald-400 flex-shrink-0 shadow-2xs">
                  <img src={profilePhoto} alt="Profile Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-6 h-6" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold text-slate-800 truncate ${language === 'bn' ? 'font-bengali' : ''}`}>
                  {profilePhoto
                    ? (language === 'bn' ? '✓ ছবি যুক্ত হয়েছে (পরিবর্তন করতে ক্লিক করুন)' : '✓ Photo Selected (Click to change)')
                    : (language === 'bn' ? 'পাসপোর্ট সাইজ ছবি আপলোড করুন' : 'Click to upload passport photo')}
                </p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5 font-sans">
                  JPG, PNG, WebP (Max 5MB)
                </p>
              </div>

              <Upload className="w-4 h-4 text-slate-400 flex-shrink-0 mr-1" />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Terms Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20 cursor-pointer"
              />
              <span
                className={`text-xs text-slate-600 leading-relaxed select-none ${
                  language === 'bn' ? 'font-bengali' : ''
                }`}
              >
                {language === 'bn'
                  ? 'আমি শর্তাবলি ও গোপনীয়তা নীতি গ্রহণ করছি।'
                  : 'I agree to the Terms & Conditions and Privacy Policy.'}
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
                language === 'bn' ? 'font-bengali' : ''
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>
                    {language === 'bn' ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating account...'}
                  </span>
                </>
              ) : (
                <span>{language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}</span>
              )}
            </button>
          </div>
        </form>

        {/* Sign In Link */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p
            className={`text-xs text-slate-500 ${
              language === 'bn' ? 'font-bengali' : ''
            }`}
          >
            {language === 'bn' ? 'আগেই অ্যাকাউন্ট আছে?' : 'Already have an account?'}{' '}
            <Link
              href="/portal/login"
              className={`font-semibold text-slate-900 hover:underline transition-colors ml-0.5 ${
                language === 'bn' ? 'font-bengali' : ''
              }`}
            >
              {language === 'bn' ? 'সাইন ইন করুন' : 'Sign In'}
            </Link>
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center pt-1">
          <Link
            href="/jobs"
            className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            Browse Overseas Vacancies
          </Link>
        </div>
      </div>

      {/* Trust & License Subtitle */}
      <p className="text-center text-[11px] text-slate-400 mt-6 max-w-sm leading-relaxed">
        Government Approved Recruiting Agency • License No: RL-1892
      </p>
    </div>
  );
}

export default function PortalRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

