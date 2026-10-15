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
  Plus,
  Edit2,
  Sparkles,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { CountryFlag } from '@/components/ui/country-flag';
import { POPULAR_CURRENCIES } from '@/lib/currencies';

export default function NewJobDemandPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [countries, setCountries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [employers, setEmployers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Custom currency state
  const [isCustomCurrency, setIsCustomCurrency] = useState(false);
  const [customCurrencyCode, setCustomCurrencyCode] = useState('');

  // Inline Country Modal states
  const [isAddCountryOpen, setIsAddCountryOpen] = useState(false);
  const [isEditCountryOpen, setIsEditCountryOpen] = useState(false);
  const [isSavingCountry, setIsSavingCountry] = useState(false);
  const [countryFormData, setCountryFormData] = useState({
    name: '',
    code: '',
    continent: 'Middle East',
    currencyCode: 'SAR',
    currency: 'Saudi Riyal',
    flag: '',
  });

  // Inline Category Modal state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
  });

  const [formData, setFormData] = useState({
    title: '',
    countryId: '',
    jobCategoryId: '',
    employerId: '',
    description: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'SAR',
    experienceRequired: 1,
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

  const loadOptions = async () => {
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
  };

  useEffect(() => {
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

    // Auto-update currency when destination country changes
    if (field === 'countryId' && value) {
      const matched = countries.find((c) => c.id === value);
      if (matched?.currencyCode) {
        const found = POPULAR_CURRENCIES.some((pc) => pc.value === matched.currencyCode);
        if (found) {
          setIsCustomCurrency(false);
          setFormData((prev) => ({ ...prev, currency: matched.currencyCode }));
        } else {
          setIsCustomCurrency(true);
          setCustomCurrencyCode(matched.currencyCode);
          setFormData((prev) => ({ ...prev, currency: matched.currencyCode }));
        }
      }
    }
  };

  const handleCurrencySelect = (val: string) => {
    if (val === 'CUSTOM') {
      setIsCustomCurrency(true);
      setFormData((prev) => ({ ...prev, currency: customCurrencyCode || 'USD' }));
    } else {
      setIsCustomCurrency(false);
      setFormData((prev) => ({ ...prev, currency: val }));
    }
  };

  const handleCustomCurrencyChange = (val: string) => {
    const cleaned = val.toUpperCase().trim();
    setCustomCurrencyCode(cleaned);
    setFormData((prev) => ({ ...prev, currency: cleaned }));
  };

  // Generate Auto-Filled Job Description Template
  const handleAutoFillDescription = () => {
    const title = formData.title.trim() || 'Skilled Professional';
    const selectedCountry = countries.find((c) => c.id === formData.countryId);
    const countryName = selectedCountry?.name || 'Overseas Destination';
    const currency = formData.currency || 'SAR';
    const salaryText =
      formData.salaryMin && formData.salaryMax
        ? `${currency} ${Number(formData.salaryMin).toLocaleString()} - ${Number(formData.salaryMax).toLocaleString()} Monthly`
        : formData.salaryMin
        ? `${currency} ${Number(formData.salaryMin).toLocaleString()} Monthly`
        : 'Competitive Overseas Scale as per Trade Standards';

    const allowances = [
      formData.accommodation ? '• Accommodation: Free Company-Provided Camp / Accommodation' : null,
      formData.food ? '• Food: Provided by Company or Monthly Food Allowance' : null,
      formData.transportation ? '• Transportation: Provided to and from job site' : null,
      formData.medical ? '• Medical: Comprehensive Health Insurance coverage provided' : null,
      formData.airTicket ? '• Air Ticket: Return flight tickets provided as per contract' : null,
    ]
      .filter(Boolean)
      .join('\n');

    const template = `JOB DEMAND SUMMARY / নিয়োগ বিবরণী:
We are officially recruiting qualified and disciplined personnel for the position of "${title}" in ${countryName}. Selected candidates will be deployed under official employment contracts with complete visa and travel processing handled by SHAKIL TRAVELS (RL-2579).

KEY RESPONSIBILITIES / কাজের দায়িত্ব ও ভূমিকা:
1. Carry out trade-specific duties related to ${title} adhering to international project guidelines and safety protocols.
2. Coordinate with site supervisors, multinational workforce teams, and quality inspection officers.
3. Maintain tools, machinery, and equipment in clean, operational condition.
4. Uphold high professional conduct, punctual attendance, and workplace safety compliance.

COMPENSATION & EXPATRIATE BENEFITS / বেতন ও সুবিধাসমূহ:
• Basic Monthly Salary: ${salaryText}
• Duty Hours: ${formData.workingHours || '8 hours per day, 6 days per week (Overtime as per labor law)'}
• Contract Duration: ${formData.contractDuration || '2 Years (Renewable by mutual consent)'}
${allowances}

ELIGIBILITY & CANDIDATE REQUIREMENTS / প্রার্থীর যোগ্যতা:
• Minimum Trade Experience: ${formData.experienceRequired || 1} Year(s) in related trade or foreign return.
• Language Ability: ${formData.languageRequirements || 'Basic conversational English or Arabic'}.
• Age Range: ${formData.ageMin || 21} to ${formData.ageMax || 45} Years.
• Valid Passport: Machine Readable Passport (MRP) or E-Passport with minimum 1-year validity required.
${formData.skillsRequired ? `• Required Skills: ${formData.skillsRequired}` : ''}

RECRUITMENT PROCESS / নিয়োগ প্রক্রিয়া:
Direct screening by SHAKIL TRAVELS Technical Selection Team → Medical Fitness Test (GAMCA / Embassy Approved) → Visa Stamping & BMET Smart Card Clearance → Pre-Departure Briefing & Flight Departure.`;

    setFormData((prev) => ({ ...prev, description: template }));
    if (fieldErrors.description) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated.description;
        return updated;
      });
    }
    success('Job description template auto-generated!');
  };

  // Quick Add Country
  const handleOpenAddCountry = () => {
    setCountryFormData({
      name: '',
      code: '',
      continent: 'Middle East',
      currencyCode: 'SAR',
      currency: 'Saudi Riyal',
      flag: '',
    });
    setIsAddCountryOpen(true);
  };

  const handleSaveNewCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryFormData.name || !countryFormData.code) {
      error('Country name and 2-letter code are required');
      return;
    }

    try {
      setIsSavingCountry(true);
      const code = countryFormData.code.toUpperCase().trim();
      const flagUrl =
        countryFormData.flag.trim() || `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

      const res = await fetch('/api/countries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: countryFormData.name.trim(),
          code,
          continent: countryFormData.continent,
          currency: countryFormData.currency,
          currencyCode: countryFormData.currencyCode.toUpperCase(),
          flag: flagUrl,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save country');
      }

      success(`Country "${data.data.name}" added successfully!`);
      setIsAddCountryOpen(false);

      // Refresh countries and immediately select the new country
      await loadOptions();
      setFormData((prev) => ({
        ...prev,
        countryId: data.data.id,
        currency: data.data.currencyCode || prev.currency,
      }));
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSavingCountry(false);
    }
  };

  // Quick Edit Selected Country
  const handleOpenEditCountry = () => {
    const selected = countries.find((c) => c.id === formData.countryId);
    if (!selected) return;

    setCountryFormData({
      name: selected.name || '',
      code: selected.code || '',
      continent: selected.continent || 'Middle East',
      currencyCode: selected.currencyCode || 'SAR',
      currency: selected.currency || '',
      flag: selected.flag || '',
    });
    setIsEditCountryOpen(true);
  };

  const handleSaveEditCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.countryId) return;

    try {
      setIsSavingCountry(true);
      const code = countryFormData.code.toUpperCase().trim();
      const flagUrl =
        countryFormData.flag.trim() || `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

      const res = await fetch(`/api/countries/${formData.countryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: countryFormData.name.trim(),
          code,
          continent: countryFormData.continent,
          currency: countryFormData.currency,
          currencyCode: countryFormData.currencyCode.toUpperCase(),
          flag: flagUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update country');
      }

      success(`Country "${data.data.name}" updated successfully!`);
      setIsEditCountryOpen(false);

      // Refresh and update current form currency
      await loadOptions();
      if (data.data.currencyCode) {
        setFormData((prev) => ({ ...prev, currency: data.data.currencyCode }));
      }
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSavingCountry(false);
    }
  };

  // Quick Add Category
  const handleSaveNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name) {
      error('Category name is required');
      return;
    }

    try {
      setIsSavingCategory(true);
      const res = await fetch('/api/job-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryFormData.name.trim(),
          description: categoryFormData.description.trim() || null,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save category');
      }

      success(`Trade Category "${data.data.name}" created!`);
      setIsAddCategoryOpen(false);
      setCategoryFormData({ name: '', description: '' });

      // Refresh categories and select it
      await loadOptions();
      setFormData((prev) => ({ ...prev, jobCategoryId: data.data.id }));
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Submit Job Demand
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
          throw new Error('Please correct highlighted validation errors / ফর্মের ভুলগুলো সংশোধন করুন');
        }
        throw new Error(data.error || 'Failed to create job demand');
      }

      success(`Job vacancy published successfully with Demand Code: ${data.data.jobCode}`);
      router.push(`/admin/jobs/${data.data.id}`);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCountry = countries.find((c) => c.id === formData.countryId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/admin/jobs">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-navy-50 text-navy-800 border border-navy-200">
                RL-2579 Demand Desk
              </span>
              <span className="text-xs text-slate-400">• Step 1 of 1</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-navy-950 mt-0.5">
              Post Overseas Job Demand / নতুন চাকরির ডিমান্ড
            </h1>
            <p className="text-xs text-slate-500">
              Create an official international recruitment vacancy with smart auto-fill and direct country/currency controls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/jobs">
            <Button variant="outline" size="sm" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
            className="bg-navy-900 hover:bg-navy-800 text-white font-semibold"
          >
            Publish Vacancy
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Role & Destination */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="bg-slate-50/60 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-navy-950">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-base">Role, Trade & Destination</CardTitle>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Step 1</span>
              </div>
              <CardDescription>Select country, category, and recruitment positions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <Input
                label="Job Designation / পদের নাম"
                required
                placeholder="e.g. Pipe Welder (6G / TIG) or Mason or Civil Foreman"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                error={fieldErrors.title}
              />

              {/* Destination Country with inline Add / Edit */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Destination Country / গন্তব্য দেশ <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    {formData.countryId && (
                      <button
                        type="button"
                        onClick={handleOpenEditCountry}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                        title="Edit selected country details"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>Edit Country</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleOpenAddCountry}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                    >
                      <Plus className="w-3 h-3 text-emerald-600" />
                      <span>+ Add Country</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Select
                    options={[
                      { value: '', label: '— Select Destination Country —' },
                      ...countries.map((c) => ({
                        value: c.id,
                        label: `${c.name} (${c.code}) ${c.currencyCode ? `[${c.currencyCode}]` : ''}`,
                      })),
                    ]}
                    value={formData.countryId}
                    onChange={(e) => handleChange('countryId', e.target.value)}
                    error={fieldErrors.countryId}
                  />
                </div>

                {selectedCountry && (
                  <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CountryFlag flag={selectedCountry.flag} name={selectedCountry.name} size="md" />
                      <span className="font-semibold text-slate-800">{selectedCountry.name}</span>
                      <span className="text-slate-400">({selectedCountry.code})</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                        Currency: {selectedCountry.currencyCode || 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Trade Category with inline Add */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Trade Category / পেশার ক্যাটাগরি <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                    <span>+ Add Category</span>
                  </button>
                </div>
                <Select
                  options={[
                    { value: '', label: '— Select Trade Category —' },
                    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                  ]}
                  value={formData.jobCategoryId}
                  onChange={(e) => handleChange('jobCategoryId', e.target.value)}
                  error={fieldErrors.jobCategoryId}
                />
              </div>

              {/* Employing Principal (Optional for Direct Agency Demands) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Employing Company / নিয়োগকর্তা কোম্পানি
                  </label>
                  <span className="text-[11px] text-slate-400">Optional for Direct Quota</span>
                </div>
                <Select
                  options={[
                    {
                      value: '',
                      label: '🛡️ Agency Confidential / Direct Principal (এজেন্সি ডিরেক্ট ডিমান্ড)',
                    },
                    ...employers.map((emp) => ({
                      value: emp.id,
                      label: `${emp.companyName} (${emp.verificationStatus})`,
                    })),
                  ]}
                  value={formData.employerId}
                  onChange={(e) => handleChange('employerId', e.target.value)}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Leave as Confidential / Direct if employer is confidential until visa issue.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Input
                  label="Total Vacancies / মোট পদ"
                  type="number"
                  min="1"
                  required
                  value={formData.vacancyCount}
                  onChange={(e) => handleChange('vacancyCount', e.target.value)}
                />

                <Select
                  label="Publication Status / স্ট্যাটাস"
                  options={[
                    { value: 'PUBLISHED', label: '🟢 Published (Public & Matching)' },
                    { value: 'DRAFT', label: '🟡 Draft (Internal Only)' },
                    { value: 'PAUSED', label: '⏸️ Paused (Temporarily Hold)' },
                  ]}
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800">Featured Placement / বিশেষ বিজ্ঞাপন</span>
                  <p className="text-[11px] text-slate-500">Showcase prominently on home and overseas portals</p>
                </div>
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(v) => handleChange('featured', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Remuneration & Currency */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="bg-slate-50/60 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-navy-950">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <CardTitle className="text-base">Remuneration & Expatriate Benefits</CardTitle>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Step 2</span>
              </div>
              <CardDescription>Salary scale, working schedule, and mandatory company perks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {/* Salary & Smart Currency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Monthly Salary Scale & Currency / মাসিক বেতন স্কেল ও কারেন্সি
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <Input
                    placeholder="Min (e.g. 1800)"
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => handleChange('salaryMin', e.target.value)}
                  />
                  <Input
                    placeholder="Max (e.g. 2500)"
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => handleChange('salaryMax', e.target.value)}
                  />
                  <div>
                    <Select
                      options={POPULAR_CURRENCIES}
                      value={isCustomCurrency ? 'CUSTOM' : formData.currency}
                      onChange={(e) => handleCurrencySelect(e.target.value)}
                    />
                  </div>
                </div>

                {/* Custom Currency Input if selected */}
                {isCustomCurrency && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                    <span className="text-xs text-amber-800 font-medium">Custom Currency Code:</span>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. NZD, CZK, CHF"
                      value={customCurrencyCode}
                      onChange={(e) => handleCustomCurrencyChange(e.target.value)}
                      className="px-2.5 py-1 text-xs uppercase font-mono font-bold bg-white border border-amber-300 rounded focus:outline-hidden focus:ring-2 focus:ring-amber-500 w-28"
                    />
                    <span className="text-[11px] text-amber-700">Enter official ISO currency abbreviation</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Duty Working Hours / কাজের সময়"
                  placeholder="e.g. 8 hours / 6 days"
                  value={formData.workingHours}
                  onChange={(e) => handleChange('workingHours', e.target.value)}
                />
                <Input
                  label="Contract Term / চুক্তির মেয়াদ"
                  placeholder="e.g. 2 Years Renewable"
                  value={formData.contractDuration}
                  onChange={(e) => handleChange('contractDuration', e.target.value)}
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Mandatory Company Allowances / কোম্পানির সুবিধাসমূহ
                  </h3>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                    Standard Overseas Package
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-800">Free Accommodation / থাকা</span>
                    <Switch
                      checked={formData.accommodation}
                      onCheckedChange={(v) => handleChange('accommodation', v)}
                    />
                  </label>

                  <label className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-800">Free Food / Allowance / খাওয়া</span>
                    <Switch checked={formData.food} onCheckedChange={(v) => handleChange('food', v)} />
                  </label>

                  <label className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-800">Transportation / যাতায়াত</span>
                    <Switch
                      checked={formData.transportation}
                      onCheckedChange={(v) => handleChange('transportation', v)}
                    />
                  </label>

                  <label className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-800">Medical Insurance / চিকিৎসা</span>
                    <Switch
                      checked={formData.medical}
                      onCheckedChange={(v) => handleChange('medical', v)}
                    />
                  </label>

                  <label className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between cursor-pointer col-span-2">
                    <span className="font-medium text-slate-800">Return Air Ticket / বিমান টিকিট</span>
                    <Switch
                      checked={formData.airTicket}
                      onCheckedChange={(v) => handleChange('airTicket', v)}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Candidate Eligibility Criteria */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="bg-slate-50/60 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-navy-950">
                  <ListChecks className="w-4 h-4 text-purple-600" />
                  <CardTitle className="text-base">Candidate Eligibility & Matching Criteria</CardTitle>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Step 3</span>
              </div>
              <CardDescription>Matching engine parameters to filter qualified applicants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Min Experience / কাজের অভিজ্ঞতা"
                  type="number"
                  min="0"
                  placeholder="Years"
                  value={formData.experienceRequired}
                  onChange={(e) => handleChange('experienceRequired', e.target.value)}
                />

                <Select
                  label="Min Education Level / শিক্ষাগত যোগ্যতা"
                  options={[
                    { value: 'NONE', label: 'No Formal Requirement' },
                    { value: 'PRIMARY', label: 'Primary (৮ম শ্রেণি)' },
                    { value: 'SECONDARY', label: 'Secondary / SSC (এসএসসি)' },
                    { value: 'HIGHER_SECONDARY', label: 'Higher Secondary / HSC (এইচএসসি)' },
                    { value: 'DIPLOMA', label: 'Diploma / Technical (ডিপ্লোমা)' },
                    { value: 'BACHELORS', label: 'Bachelors / Graduate (স্নাতক)' },
                  ]}
                  value={formData.educationRequired}
                  onChange={(e) => handleChange('educationRequired', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Min Age / সর্বনিম্ন বয়স"
                  type="number"
                  min="18"
                  max="65"
                  value={formData.ageMin}
                  onChange={(e) => handleChange('ageMin', e.target.value)}
                />
                <Input
                  label="Max Age / সর্বোচ্চ বয়স"
                  type="number"
                  min="18"
                  max="65"
                  value={formData.ageMax}
                  onChange={(e) => handleChange('ageMax', e.target.value)}
                />
              </div>

              <Input
                label="Required Technical Skills / প্রয়োজনীয় দক্ষতা (কমা দিয়ে লিখুন)"
                placeholder="e.g. 6G Welding, Blueprint Reading, Pipe Fabrication"
                value={formData.skillsRequired}
                onChange={(e) => handleChange('skillsRequired', e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Language / ভাষার দক্ষতা"
                  placeholder="e.g. Basic English or Arabic"
                  value={formData.languageRequirements}
                  onChange={(e) => handleChange('languageRequirements', e.target.value)}
                />

                <Input
                  label="Application Deadline / আবেদনের শেষ সময়"
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={(e) => handleChange('applicationDeadline', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Official Job Description with Auto-Fill Button */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="bg-slate-50/60 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-navy-950">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-base">Official Job Description / নিয়োগ বিজ্ঞপ্তি</CardTitle>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillDescription}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3 py-1 rounded-md shadow-2xs transition-all hover:scale-[1.02]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>✨ Auto-Fill Template / অটো তৈরি করুন</span>
                </button>
              </div>
              <CardDescription>
                Public description displayed to overseas applicants. Click Auto-Fill for instant generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              <Textarea
                required
                rows={11}
                placeholder="Write or click '✨ Auto-Fill Template' above to automatically create an official overseas job description..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                error={fieldErrors.description}
                className="font-sans text-xs leading-relaxed"
              />
              <p className="text-[11px] text-slate-500">
                Tip: You can click the <strong>✨ Auto-Fill Template</strong> button anytime to generate a complete demand description, then edit specific terms as needed.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Submission Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center gap-3">
            {selectedCountry && (
              <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <CountryFlag flag={selectedCountry.flag} name={selectedCountry.name} size="sm" />
                <span className="font-semibold">{selectedCountry.name}</span>
                <span>•</span>
                <span className="font-mono text-emerald-700 font-semibold">{formData.currency}</span>
                <span>•</span>
                <span>{formData.vacancyCount} Openings</span>
              </div>
            )}
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
              className="bg-navy-900 hover:bg-navy-800 text-white font-semibold"
            >
              Publish Vacancy
            </Button>
          </div>
        </div>
      </form>

      {/* MODAL 1: Quick Add Country */}
      <Modal
        isOpen={isAddCountryOpen}
        onClose={() => setIsAddCountryOpen(false)}
        title="➕ Add Destination Country / নতুন দেশ যুক্ত করুন"
        description="Register a new overseas destination for recruitment demands and candidate preferences."
        maxWidth="md"
      >
        <form onSubmit={handleSaveNewCountry} className="space-y-4">
          <Input
            label="Country Name / দেশের নাম"
            required
            placeholder="e.g. Romania, Poland, Japan, Maldives"
            value={countryFormData.name}
            onChange={(e) => setCountryFormData((p) => ({ ...p, name: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="ISO 2-Letter Code"
                required
                maxLength={2}
                placeholder="e.g. RO, PL, JP, MV"
                value={countryFormData.code}
                onChange={(e) => {
                  const c = e.target.value.toUpperCase();
                  setCountryFormData((p) => ({
                    ...p,
                    code: c,
                    flag: p.flag || (c ? `https://flagcdn.com/w40/${c.toLowerCase()}.png` : ''),
                  }));
                }}
              />
            </div>

            <Select
              label="Continent / অঞ্চল"
              options={[
                { value: 'Middle East', label: 'Middle East (মধ্যপ্রাচ্য)' },
                { value: 'Europe', label: 'Europe (ইউরোপ)' },
                { value: 'East Asia', label: 'East Asia (পূর্ব এশিয়া)' },
                { value: 'Southeast Asia', label: 'Southeast Asia (দক্ষিণ-পূর্ব এশিয়া)' },
                { value: 'Oceania', label: 'Oceania (ওশেনিয়া)' },
                { value: 'North America', label: 'North America' },
              ]}
              value={countryFormData.continent}
              onChange={(e) => setCountryFormData((p) => ({ ...p, continent: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Default Currency Code"
              required
              maxLength={4}
              placeholder="e.g. RON, PLN, JPY, MVR"
              value={countryFormData.currencyCode}
              onChange={(e) =>
                setCountryFormData((p) => ({ ...p, currencyCode: e.target.value.toUpperCase() }))
              }
            />
            <Input
              label="Currency Name"
              placeholder="e.g. Romanian Leu, Yen"
              value={countryFormData.currency}
              onChange={(e) => setCountryFormData((p) => ({ ...p, currency: e.target.value }))}
            />
          </div>

          <Input
            label="Flag URL (Auto-generated or custom)"
            placeholder="https://flagcdn.com/w40/ro.png"
            value={countryFormData.flag}
            onChange={(e) => setCountryFormData((p) => ({ ...p, flag: e.target.value }))}
          />

          {countryFormData.code && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <span className="text-xs text-slate-500">Live Flag Preview:</span>
              <CountryFlag
                flag={countryFormData.flag || `https://flagcdn.com/w40/${countryFormData.code.toLowerCase()}.png`}
                name={countryFormData.name}
                size="lg"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsAddCountryOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSavingCountry}
              className="bg-navy-900 hover:bg-navy-800 text-white"
            >
              Save Country
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Quick Edit Country */}
      <Modal
        isOpen={isEditCountryOpen}
        onClose={() => setIsEditCountryOpen(false)}
        title="✏️ Edit Selected Country / দেশ পরিবর্তন ও সংশোধন"
        description="Update currency, name or flag for the destination country."
        maxWidth="md"
      >
        <form onSubmit={handleSaveEditCountry} className="space-y-4">
          <Input
            label="Country Name"
            required
            value={countryFormData.name}
            onChange={(e) => setCountryFormData((p) => ({ ...p, name: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="ISO 2-Letter Code"
              required
              maxLength={2}
              value={countryFormData.code}
              onChange={(e) =>
                setCountryFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))
              }
            />

            <Select
              label="Continent"
              options={[
                { value: 'Middle East', label: 'Middle East' },
                { value: 'Europe', label: 'Europe' },
                { value: 'East Asia', label: 'East Asia' },
                { value: 'Southeast Asia', label: 'Southeast Asia' },
                { value: 'Oceania', label: 'Oceania' },
                { value: 'North America', label: 'North America' },
              ]}
              value={countryFormData.continent}
              onChange={(e) => setCountryFormData((p) => ({ ...p, continent: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Default Currency Code"
              required
              maxLength={4}
              value={countryFormData.currencyCode}
              onChange={(e) =>
                setCountryFormData((p) => ({ ...p, currencyCode: e.target.value.toUpperCase() }))
              }
            />
            <Input
              label="Currency Name"
              value={countryFormData.currency}
              onChange={(e) => setCountryFormData((p) => ({ ...p, currency: e.target.value }))}
            />
          </div>

          <Input
            label="Flag URL"
            value={countryFormData.flag}
            onChange={(e) => setCountryFormData((p) => ({ ...p, flag: e.target.value }))}
          />

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <span className="text-xs text-slate-500">Live Flag Preview:</span>
            <CountryFlag
              flag={countryFormData.flag || `https://flagcdn.com/w40/${countryFormData.code.toLowerCase()}.png`}
              name={countryFormData.name}
              size="lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsEditCountryOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSavingCountry}
              className="bg-navy-900 hover:bg-navy-800 text-white"
            >
              Update Country
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Quick Add Category */}
      <Modal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        title="➕ Add Trade Category / নতুন কাজের ক্যাটাগরি"
        description="Register a new job or trade specialization category."
        maxWidth="sm"
      >
        <form onSubmit={handleSaveNewCategory} className="space-y-4">
          <Input
            label="Trade Category Name / পেশার নাম"
            required
            placeholder="e.g. Scaffolder, Pipe Fitter, Nurse, CNC Operator"
            value={categoryFormData.name}
            onChange={(e) => setCategoryFormData((p) => ({ ...p, name: e.target.value }))}
          />

          <Textarea
            label="Brief Description (Optional)"
            placeholder="Short trade summary..."
            rows={3}
            value={categoryFormData.description}
            onChange={(e) => setCategoryFormData((p) => ({ ...p, description: e.target.value }))}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsAddCategoryOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSavingCategory}
              className="bg-navy-900 hover:bg-navy-800 text-white"
            >
              Save Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
