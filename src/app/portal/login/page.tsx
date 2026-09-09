'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/portal';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [needsActivation, setNeedsActivation] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('bn');

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('sgr_lang');
      if (saved === 'en' || saved === 'bn') {
        setLanguage(saved);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      setErrorMessage(
        language === 'bn'
          ? 'অনুগ্রহ করে আপনার ইমেইল/মোবাইল এবং পাসওয়ার্ড দিন।'
          : 'Please enter your email/phone and password.'
      );
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setNeedsActivation(false);

    try {
      const res = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanIdentifier, password }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(redirectUrl);
      } else {
        setErrorMessage(
          data.error ||
            (language === 'bn' ? 'ভুল তথ্য প্রদান করা হয়েছে।' : 'Invalid email or password.')
        );
        if (data.needsActivation) {
          setNeedsActivation(true);
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
      {/* Centered Login Card */}
      <div className="w-full max-w-[420px] bg-white border border-slate-200/90 rounded-xl shadow-xs p-6 sm:p-8 space-y-6">
        {/* Brand & Language Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-slate-800 uppercase font-sans">
              Shakil Global
            </span>
          </div>

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
            {language === 'bn' ? 'আপনার অ্যাকাউন্টে সাইন ইন করুন' : 'Sign in to your account'}
          </h1>
          <p
            className={`text-xs sm:text-[13px] text-slate-500 leading-relaxed ${
              language === 'bn' ? 'font-bengali' : ''
            }`}
          >
            {language === 'bn'
              ? 'আপনার রিক্রুটমেন্ট ড্যাশবোর্ড ও অ্যাকাউন্টে প্রবেশ করুন।'
              : 'Access your recruitment dashboard and account.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800 leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold">{errorMessage}</p>
              {needsActivation && (
                <p>
                  {language === 'bn' ? (
                    <>
                      আপনার অ্যাকাউন্ট অ্যাক্টিভ করতে অনুগ্রহ করে{' '}
                      <Link href="/portal/register" className="underline font-bold text-rose-900">
                        পাসওয়ার্ড সেট করুন
                      </Link>
                      ।
                    </>
                  ) : (
                    <>
                      Please{' '}
                      <Link href="/portal/register" className="underline font-bold text-rose-900">
                        create your password
                      </Link>{' '}
                      to activate portal access.
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email / Phone Field */}
          <div>
            <label
              htmlFor="identifier"
              className={`block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5 ${
                language === 'bn' ? 'font-bengali' : ''
              }`}
            >
              {language === 'bn' ? 'ইমেইল অথবা মোবাইল নম্বর' : 'Email or Phone'}
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'যেমন: +8801700000000 বা candidate@email.com'
                  : 'name@example.com or +8801...'
              }
              autoComplete="username"
              className="w-full h-11 sm:h-12 px-3.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-800 transition-colors"
            />
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className={`text-xs sm:text-[13px] font-medium text-slate-700 ${
                  language === 'bn' ? 'font-bengali' : ''
                }`}
              >
                {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <Link
                href="/portal/forgot-password"
                className={`text-xs text-slate-500 hover:text-slate-800 hover:underline transition-colors ${
                  language === 'bn' ? 'font-bengali' : ''
                }`}
              >
                {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
              </Link>
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full h-11 sm:h-12 pl-3.5 pr-11 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-800 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 focus:outline-none focus:text-slate-900 transition-colors"
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

          {/* Submit Button */}
          <div className="pt-1">
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
                  <span>{language === 'bn' ? 'সাইন ইন হচ্ছে...' : 'Signing in...'}</span>
                </>
              ) : (
                <span>{language === 'bn' ? 'সাইন ইন' : 'Sign In'}</span>
              )}
            </button>
          </div>
        </form>

        {/* Sign Up Link */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p
            className={`text-xs text-slate-500 ${
              language === 'bn' ? 'font-bengali' : ''
            }`}
          >
            {language === 'bn' ? 'অ্যাকাউন্ট নেই?' : "Don't have an account?"}{' '}
            <Link
              href="/portal/register"
              className={`font-semibold text-slate-900 hover:underline transition-colors ml-0.5 ${
                language === 'bn' ? 'font-bengali' : ''
              }`}
            >
              {language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create an account'}
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

export default function PortalLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
