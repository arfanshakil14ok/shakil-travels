'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useLanguage } from '@/context/language-context';
import { Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { t } = useLanguage();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setErrorMessage(
        t('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।', 'Password must be at least 6 characters long.')
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        t('পাসওয়ার্ড দুটি মিলছে না। পুনরায় যাচাই করুন।', 'Passwords do not match.')
      );
      return;
    }

    setLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      setLoading(false);
      setIsSuccess(true);
      setSuccessMessage(
        t('আপনার নতুন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে।', 'Your password has been reset successfully.')
      );
    }, 600);
  };

  if (isSuccess) {
    return (
      <AuthLayout
        title="পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে"
        titleBn="পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে"
        description="এখন আপনার নতুন পাসওয়ার্ড দিয়ে সাইন ইন করুন।"
        descriptionBn="এখন আপনার নতুন পাসওয়ার্ড দিয়ে সাইন ইন করুন।"
        successMessage={successMessage}
        backLink={{
          href: '/portal/login',
          label: 'Back to Sign In',
          labelBn: 'সাইন ইন পেজে ফিরে যান',
        }}
      >
        <div className="pt-2">
          <Link
            href="/portal/login"
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>{t('সাইন ইন করুন', 'Go to Sign In')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create new password"
      titleBn="নতুন পাসওয়ার্ড সেট করুন"
      description="Enter and confirm your new secure account password."
      descriptionBn="আপনার অ্যাকাউন্টের জন্য নতুন ও শক্তিশালী পাসওয়ার্ড নির্ধারণ করুন।"
      errorMessage={errorMessage}
      footerContent={
        <p className="text-xs text-slate-500">
          {t('পূর্বে ফিরে যেতে চান?', 'Want to return?')}{' '}
          <Link
            href="/portal/login"
            className="font-semibold text-slate-900 hover:underline ml-0.5"
          >
            {t('সাইন ইন করুন', 'Sign In')}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* New Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5"
          >
            {t('নতুন পাসওয়ার্ড', 'New Password')}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full h-11 sm:h-12 pl-3.5 pr-11 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-800 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5"
          >
            {t('পাসওয়ার্ড নিশ্চিত করুন', 'Confirm New Password')}
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full h-11 sm:h-12 pl-3.5 pr-11 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-800 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
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
            <span>{t('পাসওয়ার্ড সংরক্ষণ করুন', 'Update Password')}</span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
