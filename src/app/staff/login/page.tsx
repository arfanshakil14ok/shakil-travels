'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Eye, EyeOff, AlertCircle, Briefcase } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { sanitizeRedirectUrl } from '@/lib/security';

function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = sanitizeRedirectUrl(searchParams.get('from'), '/staff/dashboard');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter your staff email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, portalType: 'STAFF' }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid staff credentials. Please check your details.');
        setIsLoading(false);
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError('Network connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:px-6 font-sans">
      {/* Centered Staff Login Card */}
      <div className="w-full max-w-[420px] bg-white border border-slate-200/90 rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col gap-1">
          <BrandLogo href="/" size="sm" variant="horizontal" showTagline={false} />
          <div className="flex items-center gap-1.5 pt-1 pl-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
              <Briefcase className="w-3 h-3" />
              Staff ERP Portal • কর্মকর্তা পোর্টাল
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-[22px] font-bold tracking-tight text-slate-900">
            Staff Portal Sign In
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed">
            Enter your agency credentials to access recruitment operations and departmental modules.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800 leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" aria-hidden="true" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="staff-email"
              className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5"
            >
              Staff Email Address
            </label>
            <input
              id="staff-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@shakilglobal.com"
              autoComplete="username"
              className="w-full h-11 sm:h-12 px-3.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="staff-password"
              className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="staff-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full h-11 sm:h-12 pl-3.5 pr-11 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 sm:h-12 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Access Staff ERP</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-center">
          <p className="text-[11px] text-slate-500 leading-normal">
            <strong>Restricted Internal Access:</strong> Staff accounts are provisioned exclusively by the Super Admin. Public registration is prohibited.
          </p>
        </div>

        {/* Public Candidate Link */}
        <div className="text-center pt-1 border-t border-slate-100">
          <Link
            href="/login"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
          >
            Are you a candidate? Go to Candidate Login
          </Link>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-6 max-w-sm leading-relaxed">
        SHAKIL GLOBAL MANPOWER • Internal ERP Security Layer • RL-1892
      </p>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <StaffLoginForm />
    </Suspense>
  );
}
