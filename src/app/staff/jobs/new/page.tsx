'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Briefcase,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function NewJobWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedEmployerId = searchParams.get('employerId') || '';
  const { success, error } = useToast();

  const [step, setStep] = useState(1);
  const [countries, setCountries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [employers, setEmployers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    // Step 1
    employerId: preselectedEmployerId,
    countryId: '',
    city: '',
    title: '',
    titleLocal: '',

    // Step 2
    jobCategoryId: '',
    description: '',
    descriptionLocal: '',
    experienceRequired: 0,
    educationRequired: 'SECONDARY',
    ageMin: 21,
    ageMax: 45,
    skillsRequired: '',
    languageRequirements: 'Basic English, Bangla',

    // Step 3
    salaryMin: '',
    salaryMax: '',
    currency: 'SAR',
    salaryPeriod: 'MONTHLY',
    vacancyCount: 5,
    accommodation: true,
    food: true,
    transportation: true,
    medical: true,
    airTicket: true,
    workingHours: '8 Hours/Day, 6 Days/Week',
    contractDuration: '2 Years (Renewable)',
    applicationDeadline: '',

    // Step 4
    status: 'PENDING_APPROVAL',
    featured: false,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, catRes, empRes] = await Promise.all([
          fetch('/api/countries?activeOnly=true'),
          fetch('/api/categories?activeOnly=true'),
          fetch('/api/employers?limit=100'),
        ]);

        const [cData, catData, empData] = await Promise.all([
          cRes.json(),
          catRes.json(),
          empRes.json(),
        ]);

        if (cData.success) {
          setCountries(cData.data);
          if (!form.countryId && cData.data.length > 0) {
            setForm((f) => ({ ...f, countryId: cData.data[0].id }));
          }
        }
        if (catData.success) {
          setCategories(catData.data);
          if (!form.jobCategoryId && catData.data.length > 0) {
            setForm((f) => ({ ...f, jobCategoryId: catData.data[0].id }));
          }
        }
        if (empData.success) {
          setEmployers(empData.data.items || []);
        }
      } catch (err) {
        console.error('Failed to load wizard metadata', err);
      }
    }
    loadData();
  }, []);

  const selectedEmployer = employers.find((e) => e.id === form.employerId);
  const isEmployerVerified = selectedEmployer?.verificationStatus === 'VERIFIED';

  const handleNext = () => {
    if (step === 1) {
      if (!form.title.trim()) {
        error('Job title is required');
        return;
      }
      if (!form.countryId) {
        error('Please select destination country');
        return;
      }
    }
    if (step === 2) {
      if (!form.description.trim()) {
        error('Job description is required');
        return;
      }
      if (!form.jobCategoryId) {
        error('Please select trade category');
        return;
      }
    }
    if (step === 3) {
      if (!form.vacancyCount || form.vacancyCount < 1) {
        error('Vacancy quota must be at least 1');
        return;
      }
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const payload = {
        ...form,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        vacancyCount: Number(form.vacancyCount),
        experienceRequired: Number(form.experienceRequired),
        ageMin: form.ageMin ? Number(form.ageMin) : null,
        ageMax: form.ageMax ? Number(form.ageMax) : null,
        applicationDeadline: form.applicationDeadline || null,
      };

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create job');
      }

      success(`Job vacancy created successfully (${data.data.jobCode})`);
      router.push(`/staff/jobs/${data.data.id}/review`);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-slate-600">
          <Link href="/staff/jobs">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Jobs
          </Link>
        </Button>
        <span className="text-xs font-mono text-slate-400">Step {step} of 4</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-indigo-600" />
          Create Overseas Job Demand (চাকরি ও ভিসা চাহিদা সৃষ্টি)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Structured recruitment demand creation connected to the verified employer ecosystem and trade taxonomy.
        </p>
      </div>

      {/* Stepper Wizard Bar */}
      <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
        <div
          className={`p-2.5 rounded-lg border text-center transition-colors ${
            step === 1
              ? 'bg-indigo-600 text-white border-indigo-600'
              : step > 1
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          1. Employer & Title
        </div>
        <div
          className={`p-2.5 rounded-lg border text-center transition-colors ${
            step === 2
              ? 'bg-indigo-600 text-white border-indigo-600'
              : step > 2
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          2. Trade & Requirements
        </div>
        <div
          className={`p-2.5 rounded-lg border text-center transition-colors ${
            step === 3
              ? 'bg-indigo-600 text-white border-indigo-600'
              : step > 3
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          3. Compensation & Terms
        </div>
        <div
          className={`p-2.5 rounded-lg border text-center transition-colors ${
            step === 4
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          4. Review & Launch
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Step 1: Assign Employer & Basic Identity
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Overseas Employer / Company *
              </label>
              <Select
                value={form.employerId}
                onChange={(e) => setForm({ ...form, employerId: e.target.value })}
                options={[
                  { value: '', label: '-- Select Employer / Company --' },
                  ...employers.map((emp) => ({
                    value: emp.id,
                    label: `${emp.companyName} (${emp.country?.name || 'Overseas'}) - ${emp.verificationStatus}`,
                  })),
                ]}
              />

              {selectedEmployer && (
                <div className="mt-2 text-xs flex items-center gap-2">
                  <span className="font-mono text-slate-500">{selectedEmployer.employerCode}</span>
                  {isEmployerVerified ? (
                    <Badge variant="success" className="gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Employer
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="gap-1">
                      <Clock className="w-3.5 h-3.5" /> Unverified Employer
                    </Badge>
                  )}
                  {!isEmployerVerified && (
                    <span className="text-amber-600 text-[11px]">
                      Job can be created as DRAFT, but employer must be verified before publishing.
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Country *
                </label>
                <Select
                  value={form.countryId}
                  onChange={(e) => setForm({ ...form, countryId: e.target.value })}
                  options={[
                    { value: '', label: 'Select Country' },
                    ...countries.map((c) => ({ value: c.id, label: `${c.flag || ''} ${c.name}` })),
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Location / City
                </label>
                <Input
                  placeholder="e.g. Riyadh Industrial City / Dubai South"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Demand Title (English) *
                </label>
                <Input
                  placeholder="e.g. Senior Electrician & Control Panel Technician"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Demand Title (Bangla)
                </label>
                <Input
                  placeholder="e.g. অভিজ্ঞ ইলেকট্রিশিয়ান ও কন্ট্রোল প্যানেল মিস্ত্রি"
                  value={form.titleLocal}
                  onChange={(e) => setForm({ ...form, titleLocal: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Step 2: Trade Category & Applicant Requirements
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trade Category (পেশা ক্যাটাগরি) *
              </label>
              <Select
                value={form.jobCategoryId}
                onChange={(e) => setForm({ ...form, jobCategoryId: e.target.value })}
                options={[
                  { value: '', label: 'Select Trade Category' },
                  ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Description (English) *
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-md border border-slate-300 p-2.5 text-xs"
                  placeholder="Detail primary duties, tools, safety compliance..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Description (Bangla)
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-md border border-slate-300 p-2.5 text-xs"
                  placeholder="কাজের বিস্তারিত বিবরণ ও কাজের পরিবেশ..."
                  value={form.descriptionLocal}
                  onChange={(e) => setForm({ ...form, descriptionLocal: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Experience (Years)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.experienceRequired}
                  onChange={(e) => setForm({ ...form, experienceRequired: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Minimum Education
                </label>
                <Select
                  value={form.educationRequired}
                  onChange={(e) => setForm({ ...form, educationRequired: e.target.value })}
                  options={[
                    { value: 'NONE', label: 'No Formal Education' },
                    { value: 'PRIMARY', label: 'Primary (Class 5)' },
                    { value: 'SECONDARY', label: 'Secondary / SSC' },
                    { value: 'HIGHER_SECONDARY', label: 'HSC / Intermediate' },
                    { value: 'DIPLOMA', label: 'Technical Diploma / Vocational' },
                    { value: 'GRADUATE', label: 'Bachelors Degree' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age Min</label>
                  <Input
                    type="number"
                    value={form.ageMin}
                    onChange={(e) => setForm({ ...form, ageMin: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age Max</label>
                  <Input
                    type="number"
                    value={form.ageMax}
                    onChange={(e) => setForm({ ...form, ageMax: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Trade Skills (Comma-separated)
                </label>
                <Input
                  placeholder="e.g. Conduit bending, 3-Phase wiring, Blueprint reading"
                  value={form.skillsRequired}
                  onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Language Requirements
                </label>
                <Input
                  placeholder="e.g. Basic English, Arabic verbal"
                  value={form.languageRequirements}
                  onChange={(e) => setForm({ ...form, languageRequirements: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Step 3: Compensation, Quota & Contractual Terms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Salary
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 1800"
                  value={form.salaryMin}
                  onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Salary
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 2400"
                  value={form.salaryMax}
                  onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                <Select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  options={[
                    { value: 'SAR', label: 'SAR - Saudi Riyal' },
                    { value: 'AED', label: 'AED - UAE Dirham' },
                    { value: 'QAR', label: 'QAR - Qatari Riyal' },
                    { value: 'KWD', label: 'KWD - Kuwaiti Dinar' },
                    { value: 'OMR', label: 'OMR - Omani Rial' },
                    { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
                    { value: 'BDT', label: 'BDT - Bangladeshi Taka' },
                    { value: 'USD', label: 'USD - US Dollar' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Period</label>
                <Select
                  value={form.salaryPeriod}
                  onChange={(e) => setForm({ ...form, salaryPeriod: e.target.value })}
                  options={[
                    { value: 'MONTHLY', label: 'Monthly' },
                    { value: 'HOURLY', label: 'Hourly' },
                    { value: 'DAILY', label: 'Daily' },
                    { value: 'WEEKLY', label: 'Weekly' },
                    { value: 'CONTRACT', label: 'Contract Based' },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Vacancy Quota (লোকবল সংখ্যা) *
                </label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={form.vacancyCount}
                  onChange={(e) => setForm({ ...form, vacancyCount: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Working Hours
                </label>
                <Input
                  placeholder="e.g. 8 Hours/Day, 6 Days/Week"
                  value={form.workingHours}
                  onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Application Deadline
                </label>
                <Input
                  type="date"
                  value={form.applicationDeadline}
                  onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })}
                />
              </div>
            </div>

            {/* Benefits Checkboxes */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Mandatory & Contractual Benefits Provided by Employer
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.accommodation}
                    onChange={(e) => setForm({ ...form, accommodation: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Free Accommodation</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.food}
                    onChange={(e) => setForm({ ...form, food: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Free Food / Allowance</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.transportation}
                    onChange={(e) => setForm({ ...form, transportation: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Free Transportation</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.medical}
                    onChange={(e) => setForm({ ...form, medical: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Free Medical Insurance</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.airTicket}
                    onChange={(e) => setForm({ ...form, airTicket: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Joining Air Ticket</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Step 4: Final Review & Submission Workflow
            </h3>

            {/* Summary Box */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Job Title:</span>
                <span className="font-semibold text-slate-900">{form.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Employer:</span>
                <span className="font-semibold text-slate-900">
                  {selectedEmployer?.companyName || 'Unassigned'}
                  {isEmployerVerified ? ' (✓ Verified)' : ' (⚠ Unverified)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination:</span>
                <span className="font-semibold text-slate-900">
                  {countries.find((c) => c.id === form.countryId)?.name}
                  {form.city ? ` (${form.city})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trade Category:</span>
                <span className="font-semibold text-slate-900">
                  {categories.find((c) => c.id === form.jobCategoryId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vacancy Quota:</span>
                <span className="font-bold text-indigo-600">{form.vacancyCount} Persons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Compensation:</span>
                <span className="font-semibold text-slate-900">
                  {form.salaryMin ? `${form.salaryMin} - ${form.salaryMax} ${form.currency}` : 'Negotiable'}
                  {' '}({form.salaryPeriod})
                </span>
              </div>
            </div>

            {/* Initial Status Selector */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Initial Status for this Job Demand *
              </label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                options={[
                  { value: 'PENDING_APPROVAL', label: 'Submit for Manager Review (PENDING_APPROVAL)' },
                  { value: 'DRAFT', label: 'Save as DRAFT (Staff work in progress)' },
                  {
                    value: 'PUBLISHED',
                    label: isEmployerVerified
                      ? 'Publish Immediately to Marketplace (PUBLISHED)'
                      : 'Publish Immediately (Blocked - Employer is Unverified)',
                  },
                ]}
              />
              {form.status === 'PUBLISHED' && !isEmployerVerified && (
                <div className="mt-2 text-rose-600 text-xs flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  Cannot publish: Employer must be verified first. Please select DRAFT or PENDING_APPROVAL.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-6">
          {step > 1 ? (
            <Button type="button" variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Previous Step
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Continue to Step {step + 1}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || (form.status === 'PUBLISHED' && !isEmployerVerified)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? 'Creating...' : 'Create & Register Job Demand'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
