'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Lock, Phone, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/portal';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [needsActivation, setNeedsActivation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setNeedsActivation(false);

    try {
      const res = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(redirectUrl);
      } else {
        setErrorMessage(data.error || 'Invalid credentials');
        if (data.needsActivation) {
          setNeedsActivation(true);
        }
      }
    } catch {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Candidate Portal Login</h1>
          <p className="text-xs text-muted-foreground">
            Sign in to track your overseas job applications, visa progress, and interview appointments.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2 text-xs text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">{errorMessage}</p>
              {needsActivation && (
                <p>
                  Your profile exists in our ERP. Please{' '}
                  <Link href="/portal/register" className="underline font-bold">
                    create password
                  </Link>{' '}
                  to activate your web access.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              Phone Number or Email
            </label>
            <Input
              type="text"
              placeholder="e.g. +8801700000000 or candidate@email.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="text-sm"
              autoComplete="username"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                Password
              </label>
              <Link
                href="/portal/forgot-password"
                className="text-[11px] text-primary hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="text-sm"
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full py-2.5 text-sm font-semibold mt-2"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        {/* Register link */}
        <div className="pt-4 border-t border-border text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Don&apos;t have an account or applying for the first time?
          </p>
          <Link
            href="/portal/register"
            className="inline-block text-xs font-semibold text-primary hover:underline"
          >
            Create Candidate Account
          </Link>
        </div>

        {/* Back to public site */}
        <div className="text-center pt-2">
          <Link
            href="/jobs"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            Browse Overseas Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PortalLoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4">Loading...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
