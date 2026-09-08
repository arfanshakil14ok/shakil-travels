'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Globe2,
  FileText,
  Calendar,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';

export default function NewApplicantPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [countries, setCountries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    gender: 'MALE',
    nationality: 'Bangladeshi',
    phone: '',
    email: '',
    district: '',
    upazila: '',
    address: '',
    education: 'SECONDARY',
    profession: '',
    yearsOfExperience: 0,
    skills: '',
    languages: 'Bengali, English',
    passportAvailable: false,
    passportNumber: '',
    passportExpiry: '',
    preferredCountryId: '',
    preferredJobCategoryId: '',
    status: 'NEW',
    source: 'DIRECT_VISIT',
    assignedStaffId: '',
  });

  useEffect(() => {
    async function loadOptions() {
      try {
        const [cRes, catRes, uRes] = await Promise.all([
          fetch('/api/countries?activeOnly=true'),
          fetch('/api/job-categories?activeOnly=true'),
          fetch('/api/users'),
        ]);

        const [cData, catData, uData] = await Promise.all([
          cRes.json(),
          catRes.json(),
          uRes.json(),
        ]);

        if (cData.success) setCountries(cData.data);
        if (catData.success) setCategories(catData.data);
        if (uData.success) setStaffUsers(uData.data.users || []);
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
        yearsOfExperience: Number(formData.yearsOfExperience) || 0,
        preferredCountryId: formData.preferredCountryId || null,
        preferredJobCategoryId: formData.preferredJobCategoryId || null,
        assignedStaffId: formData.assignedStaffId || null,
        email: formData.email ? formData.email.trim() : null,
        passportNumber: formData.passportNumber ? formData.passportNumber.trim() : null,
      };

      const res = await fetch('/api/applicants', {
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
        throw new Error(data.error || 'Failed to register applicant');
      }

      success(`Applicant registered successfully with ID: ${data.data.applicantNumber}`);
      router.push(`/admin/applicants/${data.data.id}`);
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
          <Link href="/admin/applicants">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Register New Candidate
            </h1>
            <p className="text-xs text-slate-500">
              Create an official applicant profile and sync CRM customer record.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/applicants">
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
            Save Candidate
          </Button>
        </div>
      </div>

      {/* Grid of form cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Personal & Contact Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-navy-900">
              <User className="w-4 h-4 text-emerald-600" />
              <CardTitle>Personal Details</CardTitle>
            </div>
            <CardDescription>Primary identity and bio-data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Full Name (as in Passport/NID)"
              required
              placeholder="e.g. Md. Shakil Hossain"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              error={fieldErrors.fullName}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Father's Name"
                placeholder="Father's name"
                value={formData.fatherName}
                onChange={(e) => handleChange('fatherName', e.target.value)}
              />
              <Input
                label="Mother's Name"
                placeholder="Mother's name"
                value={formData.motherName}
                onChange={(e) => handleChange('motherName', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              />
              <Select
                label="Gender"
                options={[
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'OTHER', label: 'Other' },
                ]}
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone Number"
                required
                placeholder="e.g. +880 1711-000000"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                error={fieldErrors.phone}
              />
              <Input
                label="Email Address (Optional)"
                type="email"
                placeholder="candidate@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={fieldErrors.email}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="District (Home Town)"
                placeholder="e.g. Comilla, Bogura"
                value={formData.district}
                onChange={(e) => handleChange('district', e.target.value)}
              />
              <Input
                label="Upazila / Thana"
                placeholder="e.g. Chandina"
                value={formData.upazila}
                onChange={(e) => handleChange('upazila', e.target.value)}
              />
            </div>

            <Input
              label="Full Village / Street Address"
              placeholder="Village, Post Office, Police Station"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </CardContent>
        </Card>

        {/* 2. Passport & Travel Readiness */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-navy-900">
              <Globe2 className="w-4 h-4 text-blue-600" />
              <CardTitle>Passport & Travel Documents</CardTitle>
            </div>
            <CardDescription>Govt travel credentials and validity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800">Passport Available</span>
                <p className="text-[11px] text-slate-500">Candidate currently possesses valid passport</p>
              </div>
              <Switch
                checked={formData.passportAvailable}
                onCheckedChange={(v) => handleChange('passportAvailable', v)}
              />
            </div>

            {formData.passportAvailable && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Passport Number"
                    placeholder="e.g. A01234567"
                    value={formData.passportNumber}
                    onChange={(e) => handleChange('passportNumber', e.target.value.toUpperCase())}
                  />
                  <Input
                    label="Passport Expiry Date"
                    type="date"
                    value={formData.passportExpiry}
                    onChange={(e) => handleChange('passportExpiry', e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Placement Preferences
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Target Destination Country"
                  options={[
                    { value: '', label: 'Select Preferred Country' },
                    ...countries.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  value={formData.preferredCountryId}
                  onChange={(e) => handleChange('preferredCountryId', e.target.value)}
                />

                <Select
                  label="Target Trade / Category"
                  options={[
                    { value: '', label: 'Select Trade Category' },
                    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                  ]}
                  value={formData.preferredJobCategoryId}
                  onChange={(e) => handleChange('preferredJobCategoryId', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Skills, Experience & Education */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-navy-900">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <CardTitle>Trade Skills & Qualifications</CardTitle>
            </div>
            <CardDescription>Professional trade history and education level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Profession / Current Designation"
                placeholder="e.g. Electrician, Heavy Driver"
                value={formData.profession}
                onChange={(e) => handleChange('profession', e.target.value)}
              />
              <Input
                label="Experience (Years)"
                type="number"
                min="0"
                value={formData.yearsOfExperience}
                onChange={(e) => handleChange('yearsOfExperience', e.target.value)}
              />
            </div>

            <Select
              label="Education Level"
              options={[
                { value: 'NONE', label: 'No Formal Education / Literate' },
                { value: 'PRIMARY', label: 'Primary (Class 1-5)' },
                { value: 'SECONDARY', label: 'Secondary / SSC (Class 10)' },
                { value: 'HIGHER_SECONDARY', label: 'Higher Secondary / HSC (Class 12)' },
                { value: 'DIPLOMA', label: 'Technical Diploma' },
                { value: 'BACHELORS', label: 'Bachelors Degree' },
                { value: 'MASTERS', label: 'Masters Degree' },
                { value: 'OTHER', label: 'Vocational / Other' },
              ]}
              value={formData.education}
              onChange={(e) => handleChange('education', e.target.value)}
            />

            <Input
              label="Key Skills (comma separated)"
              placeholder="e.g. Pipe Welding, Conduit Wiring, Blueprint Reading"
              value={formData.skills}
              onChange={(e) => handleChange('skills', e.target.value)}
            />

            <Input
              label="Languages Spoken"
              placeholder="e.g. Bengali, English, Arabic"
              value={formData.languages}
              onChange={(e) => handleChange('languages', e.target.value)}
            />
          </CardContent>
        </Card>

        {/* 4. CRM & Internal Assignment */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-navy-900">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <CardTitle>Recruitment Operations & CRM</CardTitle>
            </div>
            <CardDescription>Operational pipeline status and agency handling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Initial Pipeline Status"
                options={[
                  { value: 'NEW', label: 'New Lead' },
                  { value: 'PROFILE_INCOMPLETE', label: 'Profile Incomplete' },
                  { value: 'ACTIVE', label: 'Active Candidate Pool' },
                  { value: 'SHORTLISTED', label: 'Shortlisted' },
                  { value: 'ON_HOLD', label: 'On Hold' },
                ]}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              />

              <Select
                label="Lead Source"
                options={[
                  { value: 'DIRECT_VISIT', label: 'Direct Agency Visit' },
                  { value: 'WEBSITE', label: 'Website Application' },
                  { value: 'REFERRAL', label: 'Candidate Referral' },
                  { value: 'AGENT', label: 'Authorized Agent' },
                ]}
                value={formData.source}
                onChange={(e) => handleChange('source', e.target.value)}
              />
            </div>

            <Select
              label="Assigned Recruitment Officer"
              options={[
                { value: '', label: 'Unassigned' },
                ...staffUsers.map((u) => ({ value: u.id, label: `${u.name} (${u.role.name})` })),
              ]}
              value={formData.assignedStaffId}
              onChange={(e) => handleChange('assignedStaffId', e.target.value)}
            />

            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Automatic CRM Integration:</span> Saving this candidate
                will automatically create a linked Customer profile under the CRM registry and generate a
                sequential SGR registration code.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky footer action bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Link href="/admin/applicants">
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
          Save Candidate
        </Button>
      </div>
    </form>
  );
}
