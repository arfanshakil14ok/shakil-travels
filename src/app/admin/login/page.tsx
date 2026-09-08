'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, LockKeyhole, Mail, Eye, EyeOff, CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

function LoginForm() {
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
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid credentials or access denied.');
        setIsLoading(false);
        return;
      }

      // Successful login
      router.push(from);
      router.refresh();
    } catch (err: any) {
      setError('A network error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Brand Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-navy-900 to-navy-800 border border-navy-700 shadow-xl mb-3 text-gold-400">
          <ShieldCheck className="w-8 h-8 text-emerald-400" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white uppercase">
          Shakil Global Recruitment
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Administrative Management & ERP Portal
        </p>
      </div>

      {/* Login Card */}
      <Card className="bg-white/95 backdrop-blur-md shadow-2xl border-slate-800/20">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your authorized credentials to access the recruitment console.
            </p>
          </div>

          {error && (
            <div className="mb-5">
              <Alert variant="error" title="Authentication Failed">
                {error}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="staff@shakilglobal.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" aria-hidden="true" />}
              autoComplete="email"
              autoFocus
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<LockKeyhole className="w-4 h-4" aria-hidden="true" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                }
                autoComplete="current-password"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 bg-navy-950 hover:bg-navy-900 text-white shadow-md font-semibold text-sm"
                isLoading={isLoading}
              >
                Authorize & Sign In
              </Button>
            </div>
          </form>

          {/* Test Credentials Helper for Phase 1 Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 space-y-2">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <CircleAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>Phase 1 Demonstration Accounts:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div
                className="p-1.5 bg-slate-50 rounded border border-slate-200 cursor-pointer hover:bg-slate-100"
                onClick={() => {
                  setEmail('admin@shakilglobal.com');
                  setPassword('Admin@SGR2026!');
                }}
              >
                <span className="font-bold block text-navy-900">Super Admin</span>
                admin@shakilglobal.com
              </div>
              <div
                className="p-1.5 bg-slate-50 rounded border border-slate-200 cursor-pointer hover:bg-slate-100"
                onClick={() => {
                  setEmail('recruiter@shakilglobal.com');
                  setPassword('Staff@SGR2026!');
                }}
              >
                <span className="font-bold block text-navy-900">Recruiter</span>
                recruiter@shakilglobal.com
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <p className="text-center text-[11px] text-slate-500 mt-6">
        Protected by role-based authorization, rate-limiting & automated audit tracking.
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle geometric background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-navy-800/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-950/40 blur-3xl pointer-events-none" />

      <React.Suspense
        fallback={
          <div className="text-white text-xs font-mono">Loading authentication portal...</div>
        }
      >
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
