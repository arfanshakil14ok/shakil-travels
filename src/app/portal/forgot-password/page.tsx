'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useLanguage } from '@/context/language-context';
import { CheckCircle2, Phone, Mail, ArrowRight } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { language, t } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = identifier.trim();
    if (!clean) {
      setErrorMessage(
        t('অনুগ্রহ করে আপনার নিবন্ধিত মোবাইল নম্বর বা ইমেইল দিন।', 'Please enter your registered mobile phone or email.')
      );
      return;
    }

    setLoading(true);
    setErrorMessage('');

    // Simulate safe API submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  if (submitted) {
    return (
      <AuthLayout
        title="অনুরোধ জমা হয়েছে"
        titleBn="অনুরোধ জমা হয়েছে"
        description="পাসওয়ার্ড রিসেট নির্দেশনা পাঠানো হয়েছে।"
        descriptionBn="পাসওয়ার্ড রিসেট নির্দেশনা পাঠানো হয়েছে।"
        backLink={{
          href: '/portal/login',
          label: 'Back to Sign In',
          labelBn: 'সাইন ইন পেজে ফিরে যান',
        }}
      >
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl space-y-2 text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {t(
                  'রিকভারি অনুরোধ সফলভাবে গৃহীত হয়েছে',
                  'Recovery Request Accepted'
                )}
              </span>
            </div>
            <p className="leading-relaxed text-slate-700">
              {t(
                `যদি "${identifier}" তথ্যের সাথে কোনো অ্যাকাউন্ট বিদ্যমান থাকে, তবে এসএমএস বা ইমেইলের মাধ্যমে পরবর্তী নির্দেশনা পাঠানো হবে।`,
                `If an active candidate account exists for "${identifier}", instructions will be sent via SMS or email.`
              )}
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">
              {t('জরুরি প্রয়োজনে হেল্পডেস্কে যোগাযোগ করুন:', 'Urgent Assistance:')}
            </p>
            <p>হটলাইন: +880 1700 000000 • ইমেইল: support@shakilglobal.com</p>
          </div>

          <Link
            href="/portal/login"
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>{t('সাইন ইন করুন', 'Return to Sign In')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      titleBn="পাসওয়ার্ড পুনরুদ্ধার"
      description="Enter your registered email or phone to recover your account."
      descriptionBn="আপনার অ্যাকাউন্টের সাথে যুক্ত মোবাইল নম্বর বা ইমেইল প্রদান করুন।"
      errorMessage={errorMessage}
      footerContent={
        <p className="text-xs text-slate-500">
          {t('পাসওয়ার্ড মনে আছে?', 'Remember your password?')}{' '}
          <Link
            href="/portal/login"
            className="font-semibold text-slate-900 hover:underline ml-0.5"
          >
            {t('সাইন ইন করুন', 'Sign In')}
          </Link>
        </p>
      }
      backLink={{
        href: '/jobs',
        label: 'Browse Overseas Vacancies',
        labelBn: 'বিদেশি চাকরির বিজ্ঞপ্তি দেখুন',
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="identifier"
            className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5"
          >
            {t('নিবন্ধিত মোবাইল নম্বর বা ইমেইল', 'Registered Mobile or Email')}
          </label>
          <div className="relative">
            <input
              id="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t('যেমন: +8801700000000 বা user@email.com', 'e.g. +8801700000000 or user@email.com')}
              className="w-full h-11 sm:h-12 px-3.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-800 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>{t('রিসেট কোড পাঠান', 'Send Reset Code')}</span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
