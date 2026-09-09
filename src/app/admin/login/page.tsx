'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { BRAND } from '@/config/brand';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/admin/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid email or password.');
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 sm:px-6 font-sans">
      {/* Centered Login Card */}
      <div className="w-full max-w-[420px] bg-white border border-slate-200/90 rounded-xl shadow-xs p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col gap-1">
          <BrandLogo href="/" size="sm" variant="horizontal" showTagline={false} />
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pl-10">
            Admin Panel • অ্যাডমিন প্যানেল
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-[22px] font-bold tracking-tight text-slate-900">
            Sign in to your account
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed">
            Access your administrative console and ERP management.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800 leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" aria-hidden="true" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@shakilglobal.com"
              autoComplete="email"
              autoFocus
              className="w-full h-11 sm:h-12 px-3.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-800 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="admin-password"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 focus:outline-none"
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

          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
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
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>
        </form>

        {/* Quick Testing Credentials helper */}
        <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
          <span className="font-semibold text-slate-700 block mb-1.5 text-[11px] uppercase tracking-wider">
            Demo Staff Accounts:
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <button
              type="button"
              className="p-2 bg-slate-50 rounded border border-slate-200 text-left hover:bg-slate-100 transition-colors"
              onClick={() => {
                setEmail('admin@shakilglobal.com');
                setPassword('Admin@SGR2026!');
              }}
            >
              <span className="font-bold block text-slate-800">Super Admin</span>
              <span className="text-[10px] text-slate-500">admin@shakilglobal...</span>
            </button>
            <button
              type="button"
              className="p-2 bg-slate-50 rounded border border-slate-200 text-left hover:bg-slate-100 transition-colors"
              onClick={() => {
                setEmail('recruiter@shakilglobal.com');
                setPassword('Staff@SGR2026!');
              }}
            >
              <span className="font-bold block text-slate-800">Recruiter</span>
              <span className="text-[10px] text-slate-500">recruiter@shakil...</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trust & License Subtitle */}
      <p className="text-center text-[11px] text-slate-400 mt-6 max-w-sm leading-relaxed">
        Government Approved Recruiting Agency • License No: RL-1892
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
