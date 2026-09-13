'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Briefcase,
  ArrowLeft,
  Save,
  RefreshCw,
  Building2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;
  const { success, error } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [employers, setEmployers] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '',
    titleLocal: '',
    countryId: '',
    city: '',
    jobCategoryId: '',
    employerId: '',
    description: '',
    descriptionLocal: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'SAR',
    salaryPeriod: 'MONTHLY',
    experienceRequired: 0,
    educationRequired: 'SECONDARY',
    ageMin: 18,
    ageMax: 45,
    skillsRequired: '',
    languageRequirements: '',
    vacancyCount: 1,
    accommodation: false,
    food: false,
    transportation: false,
    medical: false,
    airTicket: false,
    workingHours: '',
    contractDuration: '',
    applicationDeadline: '',
    status: 'DRAFT',
    featured: false,
  });

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [cRes, catRes, empRes, jobRes] = await Promise.all([
          fetch('/api/countries?activeOnly=true'),
          fetch('/api/categories?activeOnly=true'),
          fetch('/api/employers?limit=100'),
          fetch(`/api/jobs/${jobId}`),
        ]);

        const [cData, catData, empData, jobData] = await Promise.all([
          cRes.json(),
          catRes.json(),
          empRes.json(),
          jobRes.json(),
        ]);

        if (cData.success) setCountries(cData.data);
        if (catData.success) setCategories(catData.data);
        if (empData.success) setEmployers(empData.data.items || []);

        if (jobData.success) {
          const j = jobData.data;
          setForm({
            title: j.title || '',
            titleLocal: j.titleLocal || '',
            countryId: j.countryId || '',
            city: j.city || '',
            jobCategoryId: j.jobCategoryId || '',
            employerId: j.employerId || '',
            description: j.description || '',
            descriptionLocal: j.descriptionLocal || '',
            salaryMin: j.salaryMin !== null ? String(j.salaryMin) : '',
            salaryMax: j.salaryMax !== null ? String(j.salaryMax) : '',
            currency: j.currency || 'SAR',
            salaryPeriod: j.salaryPeriod || 'MONTHLY',
            experienceRequired: j.experienceRequired || 0,
            educationRequired: j.educationRequired || 'SECONDARY',
            ageMin: j.ageMin || 18,
            ageMax: j.ageMax || 45,
            skillsRequired: j.skillsRequired || '',
            languageRequirements: j.languageRequirements || '',
            vacancyCount: j.vacancyCount || 1,
            accommodation: Boolean(j.accommodation),
            food: Boolean(j.food),
            transportation: Boolean(j.transportation),
            medical: Boolean(j.medical),
            airTicket: Boolean(j.airTicket),
            workingHours: j.workingHours || '',
            contractDuration: j.contractDuration || '',
            applicationDeadline: j.applicationDeadline ? j.applicationDeadline.split('T')[0] : '',
            status: j.status || 'DRAFT',
            featured: Boolean(j.featured),
          });
        } else {
          throw new Error(jobData.error || 'Job not found');
        }
      } catch (err: any) {
        error(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [jobId, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
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

      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update job');

      success('Job posting updated successfully');
      router.push(`/staff/jobs/${jobId}/review`);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        Loading Job Details...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-slate-600">
          <Link href={`/staff/jobs/${jobId}/review`}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Cancel & Back to Review
          </Link>
        </Button>
        <span className="text-xs text-slate-400">Edit Mode</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            Edit Job Demand Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Overseas Employer
              </label>
              <Select
                value={form.employerId}
                onChange={(e) => setForm({ ...form, employerId: e.target.value })}
                options={[
                  { value: '', label: '-- Select Employer --' },
                  ...employers.map((emp) => ({
                    value: emp.id,
                    label: `${emp.companyName} (${emp.verificationStatus})`,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trade Category
              </label>
              <Select
                value={form.jobCategoryId}
                onChange={(e) => setForm({ ...form, jobCategoryId: e.target.value })}
                options={[
                  { value: '', label: 'Select Category' },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Title (English) *
              </label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Title (Bangla)
              </label>
              <Input
                value={form.titleLocal}
                onChange={(e) => setForm({ ...form, titleLocal: e.target.value })}
              />
            </div>

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
                City / Location
              </label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description (English)
              </label>
              <textarea
                rows={4}
                className="w-full rounded-md border border-slate-300 p-2.5 text-xs"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description (Bangla)
              </label>
              <textarea
                rows={4}
                className="w-full rounded-md border border-slate-300 p-2.5 text-xs"
                value={form.descriptionLocal}
                onChange={(e) => setForm({ ...form, descriptionLocal: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min Salary</label>
              <Input
                type="number"
                value={form.salaryMin}
                onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Salary</label>
              <Input
                type="number"
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
                  { value: 'SAR', label: 'SAR' },
                  { value: 'AED', label: 'AED' },
                  { value: 'QAR', label: 'QAR' },
                  { value: 'KWD', label: 'KWD' },
                  { value: 'OMR', label: 'OMR' },
                  { value: 'MYR', label: 'MYR' },
                  { value: 'BDT', label: 'BDT' },
                  { value: 'USD', label: 'USD' },
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
                  { value: 'CONTRACT', label: 'Contract' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vacancy Quota
              </label>
              <Input
                type="number"
                min="1"
                value={form.vacancyCount}
                onChange={(e) => setForm({ ...form, vacancyCount: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Working Hours
              </label>
              <Input
                value={form.workingHours}
                onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deadline
              </label>
              <Input
                type="date"
                value={form.applicationDeadline}
                onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })}
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Mandatory Benefits Provided
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

          <div className="flex justify-end gap-2 pt-6 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => router.push(`/staff/jobs/${jobId}/review`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Save className="w-4 h-4 mr-1.5" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
