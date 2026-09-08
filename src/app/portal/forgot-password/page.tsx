'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, Phone, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
        <div>
          <Link
            href="/portal/login"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Enter your registered mobile phone number to receive account recovery instructions.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Reset Request Submitted
            </div>
            <p>
              If an account is associated with <strong>{phone}</strong>, an SMS verification code will be sent to your number shortly. You may also contact Shakil Global Helpdesk directly at +8801700000000.
            </p>
            <div className="pt-2">
              <Link href="/portal/login">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Registered Mobile Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="tel"
                  required
                  placeholder="+8801700000000"
                  className="pl-9 text-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full text-sm font-semibold">
              Send Password Reset Code
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
