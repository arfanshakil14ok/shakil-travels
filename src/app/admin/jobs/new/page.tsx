'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  Building2,
  Globe2,
  ListChecks,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

export default function NewJobDemandPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [countries, setCountries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [employers, setEmployers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: '',
    countryId: '',
    jobCategoryId: '',
    employerId: '',
    description: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'SAR',
    experienceRequired: 0,
    educationRequired: 'SECONDARY',
    ageMin: 21,
    ageMax: 45,
    languageRequirements: 'Basic English or Arabic',
    skillsRequired: '',
    vacancyCount: 10,
    accommodation: true,
    food: true,
    transportation: true,
    medical: true,
    airTicket: true,
    workingHours: '8 hours / day (6 days / week)',
    contractDuration: '2 Years (Renewable)',
    applicationDeadline: '',
    status: 'PUBLISHED',
    featured: false,
  });

  useEffect(() => {
    async function loadOptions() {
      try {
        const [cRes, catRes, empRes] = await Promise.all([
          fetch('/api/countries?activeOnly=true'),
          fetch('/api/job-categories?activeOnly=true'),
          fetch('/api/employers'),
        ]);

        const [cData, catData, empData] = await Promise.all([
          cRes.json(),
          catRes.json(),
          empRes.json(),
        ]);

        if (cData.success) setCountries(cData.data);
        if (catData.success) setCategories(catData.data);
        if (empData.success) setEmployers(empData.data.items || []);
      } catch (err) {
        console.error('Failed to load lookup options', err);
      }
    }
    loadOptions();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const payload: any = {
        ...formData,
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : null,
        experienceRequired: Number(formData.experienceRequired) || 0,
        ageMin: formData.ageMin ? Number(formData.ageMin) : null,
        ageMax: formData.ageMax ? Number(formData.ageMax) : null,
        vacancyCount: Number(formData.vacancyCount) || 1,
        employerId: formData.employerId || null,
        applicationDeadline: formData.applicationDeadline || null,
      };

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.details?.fieldErrors) {
          const formattedErrors: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.details.fieldErrors)) {
            formattedErrors[k] = (v as string[])[0];
          }
          setFieldErrors(formattedErrors);
          throw new Error('Please correct highlighted validation errors');
        }
        throw new Error(data.error || 'Failed to create job demand');
      }

      success(`Job vacancy created successfully with Code: ${data.data.jobCode}`);
      router.push(`/admin/jobs/${data.data.id}`);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/jobs">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Post Overseas Job Demand
            </h1>
            <p className="text-xs text-slate-500">
              Register international recruitment demands, salary packages, and eligibility criteria.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/jobs">
            <Button variant="outline" size="sm" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Publish Vacancy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Job Role & Destination */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-navy-900">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <CardTitle>Role & Destination</CardTitle>
            </div>
            <CardDescription>Job title, trade category, and country assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Job Title / Designation"
              required
              placeholder="e.g. Senior Structural Welder (MIG/TIG)"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              error={fieldErrors.title}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Destination Country"
                required
                options={[
                  { value: '', label: 'Select Destination' },
                  ...countries.map((c) => ({ value: c.id, label: c.name })),
                ]}
                value={formData.countryId}
                onChange={(e) => handleChange('countryId', e.target.value)}
                error={fieldErrors.countryId}
              />

              <Select
                label="Job Category"
                required
                options={[
                  { value: '', label: 'Select Category' },
                  ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                ]}
                value={formData.jobCategoryId}
                onChange={(e) => handleChange('jobCategoryId', e.target.value)}
                error={fieldErrors.jobCategoryId}
              />
            </div>

            <Select
              label="Employing Company / Principal"
              options={[
                { value: '', label: 'Agency Confidential / Direct Principal' },
                ...employers.map((emp) => ({ value: emp.id, label: emp.companyName })),
              ]}
              value={formData.employerId}
              onChange={(e) => handleChange('employerId', e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Vacancies Available"
                type="number"
                min="1"
                required
                value={formData.vacancyCount}
                onChange={(e) => handleChange('vacancyCount', e.target.value)}
              />

              <Select
                label="Publication Status"
                options={[
                  { value: 'PUBLISHED', label: 'Published (Public & Matching)' },
                  { value: 'DRAFT', label: 'Draft (Internal Only)' },
                  { value: 'PAUSED', label: 'Paused' },
                ]}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800">Featured Placement</span>
                <p className="text-[11px] text-slate-500">Showcase prominently on public jobs portal</p>
              </div>
              <Switch
                checked={formData.featured}
                onCheckedChange={(v) => handleChange('featured', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Compensation & Benefits */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-navy-900">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <CardTitle>Remuneration & Allowances</CardTitle>
            </div>
            <CardDescription>Salary package and statutory expatriate benefits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Min Monthly Salary"
                type="number"
                placeholder="e.g. 2500"
                value={formData.salaryMin}
                onChange={(e) => handleChange('salaryMin', e.target.value)}
              />
              <Input
                label="Max Monthly Salary"
                type="number"
                placeholder="e.g. 3200"
                value={formData.salaryMax}
                onChange={(e) => handleChange('salaryMax', e.target.value)}
              />
              <Select
                label="Currency"
                options={[
                  { value: 'SAR', label: 'SAR (Saudi Riyal)' },
                  { value: 'AED', label: 'AED (UAE Dirham)' },
                  { value: 'QAR', label: 'QAR (Qatari Riyal)' },
                  { value: 'KWD', label: 'KWD (Kuwaiti Dinar)' },
                  { value: 'OMR', label: 'OMR (Omani Rial)' },
                  { value: 'MYR', label: 'MYR (Malaysian Ringgit)' },
                  { value: 'SGD', label: 'SGD (Singapore Dollar)' },
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'BDT', label: 'BDT (Taka)' },
                ]}
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Duty Hours"
                placeholder="e.g. 8 hours / 6 days"
                value={formData.workingHours}
                onChange={(e) => handleChange('workingHours', e.target.value)}
              />
              <Input
                label="Contract Term"
                placeholder="e.g. 2 Years Renewable"
                value={formData.contractDuration}
                onChange={(e) => handleChange('contractDuration', e.target.value)}
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Mandatory Company Allowances
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer">
                  <span>Free Accommodation</span>
                  <Switch
                    checked={formData.accommodation}
                    onCheckedChange={(v) => handleChange('accommodation', v)}
                  />
                </label>

                <label className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer">
                  <span>Free Food / Allowance</span>
                  <Switch checked={formData.food} onCheckedChange={(v) => handleChange('food', v)} />
                </label>

                <label className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer">
                  <span>Transportation</span>
                  <Switch
                    checked={formData.transportation}
                    onCheckedChange={(v) => handleChange('transportation', v)}
                  />
                </label>

                <label className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer">
                  <span>Medical Insurance</span>
                  <Switch
                    checked={formData.medical}
                    onCheckedChange={(v) => handleChange('medical', v)}
                  />
                </label>

                <label className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer col-span-2">
                  <span>Return Air Ticket</span>
                  <Switch
                    checked={formData.airTicket}
                    onCheckedChange={(v) => handleChange('airTicket', v)}
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Candidate Eligibility Requirements */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-navy-900">
              <ListChecks className="w-4 h-4 text-purple-600" />
              <CardTitle>Candidate Eligibility Criteria</CardTitle>
            </div>
            <CardDescription>Matching engine parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Min Experience (Years)"
                type="number"
                min="0"
                value={formData.experienceRequired}
                onChange={(e) => handleChange('experienceRequired', e.target.value)}
              />

              <Select
                label="Min Education Level"
                options={[
                  { value: 'NONE', label: 'No Formal Requirement' },
                  { value: 'PRIMARY', label: 'Primary' },
                  { value: 'SECONDARY', label: 'Secondary / SSC' },
                  { value: 'HIGHER_SECONDARY', label: 'Higher Secondary / HSC' },
                  { value: 'DIPLOMA', label: 'Diploma' },
                  { value: 'BACHELORS', label: 'Bachelors' },
                ]}
                value={formData.educationRequired}
                onChange={(e) => handleChange('educationRequired', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Min Age"
                type="number"
                min="18"
                max="65"
                value={formData.ageMin}
                onChange={(e) => handleChange('ageMin', e.target.value)}
              />
              <Input
                label="Max Age"
                type="number"
                min="18"
                max="65"
                value={formData.ageMax}
                onChange={(e) => handleChange('ageMax', e.target.value)}
              />
            </div>

            <Input
              label="Required Skills (comma separated)"
              placeholder="e.g. 6G Welding, Blueprint Reading, Pipe Fitting"
              value={formData.skillsRequired}
              onChange={(e) => handleChange('skillsRequired', e.target.value)}
            />

            <Input
              label="Language Requirements"
              placeholder="e.g. Basic English, Conversational Arabic"
              value={formData.languageRequirements}
              onChange={(e) => handleChange('languageRequirements', e.target.value)}
            />

            <Input
              label="Application Deadline"
              type="date"
              value={formData.applicationDeadline}
              onChange={(e) => handleChange('applicationDeadline', e.target.value)}
            />
          </CardContent>
        </Card>

        {/* 4. Full Job Description */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-navy-900">
              <Building2 className="w-4 h-4 text-blue-600" />
              <CardTitle>Official Job Description</CardTitle>
            </div>
            <CardDescription>Detailed job profile displayed on public portal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              label="Detailed Job Description & Requirements"
              required
              rows={11}
              placeholder="Provide complete breakdown of job duties, daily workflow, site conditions, and employer specifications..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              error={fieldErrors.description}
            />
          </CardContent>
        </Card>
      </div>

      {/* Footer bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Link href="/admin/jobs">
          <Button variant="outline" size="sm" type="button">
            Cancel
          </Button>
        </Link>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          isLoading={isSubmitting}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Publish Vacancy
        </Button>
      </div>
    </form>
  );
}
