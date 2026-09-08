'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, User, Phone, Mail, Lock, MapPin, Globe, Briefcase, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillPhone = searchParams.get('phone') || '';

  const [formData, setFormData] = useState({
    fullName: '',
    phone: prefillPhone,
    email: '',
    password: '',
    confirmPassword: '',
    district: '',
    preferredCountryId: '',
    preferredJobCategoryId: '',
  });

  const [countries, setCountries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadMeta() {
      try {
        const [cRes, catRes] = await Promise.all([
          fetch('/api/countries'),
          fetch('/api/job-categories'),
        ]);
        const cData = await cRes.json();
        const catData = await catRes.json();
        if (cData.success) setCountries(cData.data);
        if (catData.success) setCategories(catData.data);
      } catch {
        // silent fail
      }
    }
    loadMeta();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/portal/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email || undefined,
          password: formData.password,
          district: formData.district || undefined,
          preferredCountryId: formData.preferredCountryId || undefined,
          preferredJobCategoryId: formData.preferredJobCategoryId || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/portal');
      } else {
        setErrorMessage(data.error || 'Registration failed');
      }
    } catch {
      setErrorMessage('Communication error with server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mx-auto shadow-md">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Candidate Account</h1>
          <p className="text-xs text-muted-foreground">
            Register to apply for government-approved overseas jobs and track your immigration lifecycle.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Full Legal Name (as on Passport) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                required
                placeholder="e.g. Mohammad Rahim Uddin"
                className="pl-9 text-sm"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Mobile Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="tel"
                  required
                  placeholder="+8801700000000"
                  className="pl-9 text-sm"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="candidate@example.com"
                  className="pl-9 text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Create Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  className="pl-9 text-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  placeholder="Repeat password"
                  className="pl-9 text-sm"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Home District</label>
              <Input
                placeholder="e.g. Dhaka, Cumilla"
                className="text-sm"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Preferred Country</label>
              <select
                className="w-full text-xs bg-background border border-border rounded-lg p-2.5"
                value={formData.preferredCountryId}
                onChange={(e) =>
                  setFormData({ ...formData, preferredCountryId: e.target.value })
                }
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Skill / Trade</label>
              <select
                className="w-full text-xs bg-background border border-border rounded-lg p-2.5"
                value={formData.preferredJobCategoryId}
                onChange={(e) =>
                  setFormData({ ...formData, preferredJobCategoryId: e.target.value })
                }
              >
                <option value="">Select Trade</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full py-2.5 text-sm font-semibold mt-2"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        {/* Existing account link */}
        <div className="pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/portal/login"
              className="font-semibold text-primary hover:underline"
            >
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PortalRegisterPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4">Loading...</div>}>
      <RegisterForm />
    </React.Suspense>
  );
}
