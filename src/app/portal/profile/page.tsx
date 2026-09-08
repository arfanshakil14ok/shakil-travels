'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Briefcase,
  Calendar,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function PortalProfilePage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    gender: 'MALE',
    nationality: 'Bangladeshi',
    district: '',
    upazila: '',
    address: '',
    education: '',
    profession: '',
    yearsOfExperience: 0,
    skills: '',
    languages: '',
    passportAvailable: false,
    passportNumber: '',
    passportExpiry: '',
    preferredCountryId: '',
    preferredJobCategoryId: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [pRes, cRes, catRes] = await Promise.all([
          fetch('/api/portal/profile'),
          fetch('/api/countries'),
          fetch('/api/job-categories'),
        ]);

        const [pData, cData, catData] = await Promise.all([
          pRes.json(),
          cRes.json(),
          catRes.json(),
        ]);

        if (pData.success) {
          setProfile(pData.data);
          const p = pData.data;
          setFormData({
            fullName: p.fullName || '',
            fatherName: p.fatherName || '',
            motherName: p.motherName || '',
            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
            gender: p.gender || 'MALE',
            nationality: p.nationality || 'Bangladeshi',
            district: p.district || '',
            upazila: p.upazila || '',
            address: p.address || '',
            education: p.education || '',
            profession: p.profession || '',
            yearsOfExperience: p.yearsOfExperience || 0,
            skills: p.skills || '',
            languages: p.languages || '',
            passportAvailable: !!p.passportAvailable,
            passportNumber: p.passportNumber || '',
            passportExpiry: p.passportExpiry ? p.passportExpiry.slice(0, 10) : '',
            preferredCountryId: p.preferredCountryId || '',
            preferredJobCategoryId: p.preferredJobCategoryId || '',
          });
        }
        if (cData.success) setCountries(cData.data);
        if (catData.success) setCategories(catData.data);
      } catch {
        error('Failed to load profile details');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/portal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          yearsOfExperience: Number(formData.yearsOfExperience) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        success('Profile updated successfully');
        setProfile(data.data);
      } else {
        error(data.error || 'Failed to update profile');
      }
    } catch {
      error('Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
        Loading candidate profile...
      </div>
    );
  }

  const completion = profile?.completion?.percentage || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="w-6 h-6 text-primary" /> Candidate Profile
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Candidate ID: <span className="font-mono font-semibold text-primary">{profile?.applicantNumber}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-muted/40 px-4 py-2.5 rounded-xl border border-border">
          <div>
            <div className="text-xs text-muted-foreground">Profile Strength</div>
            <div className="text-lg font-bold text-foreground">{completion}%</div>
          </div>
          <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${completion >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal Info */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <h3 className="font-semibold text-base text-foreground border-b border-border pb-2">
            1. Personal & Identity Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Full Legal Name *
              </label>
              <Input
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Father&apos;s Name
              </label>
              <Input
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Mother&apos;s Name
              </label>
              <Input
                value={formData.motherName}
                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Date of Birth
              </label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Gender</label>
              <select
                className="w-full text-sm bg-background border border-border rounded-lg p-2.5"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Nationality</label>
              <Input
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Passport & Travel Readiness */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <h3 className="font-semibold text-base text-foreground border-b border-border pb-2">
            2. Passport & Travel Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Do you have a valid Passport?
              </label>
              <select
                className="w-full text-sm bg-background border border-border rounded-lg p-2.5"
                value={formData.passportAvailable ? 'YES' : 'NO'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    passportAvailable: e.target.value === 'YES',
                  })
                }
              >
                <option value="NO">No, not yet</option>
                <option value="YES">Yes, valid passport</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Passport Number
              </label>
              <Input
                placeholder="e.g. A01234567"
                value={formData.passportNumber}
                onChange={(e) =>
                  setFormData({ ...formData, passportNumber: e.target.value.toUpperCase() })
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Passport Expiration Date
              </label>
              <Input
                type="date"
                value={formData.passportExpiry}
                onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Trade, Experience & Skills */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <h3 className="font-semibold text-base text-foreground border-b border-border pb-2">
            3. Profession, Experience & Preferences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Primary Trade / Profession
              </label>
              <Input
                placeholder="e.g. Pipe Fitter, Electrician, Heavy Driver"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Years of Work Experience
              </label>
              <Input
                type="number"
                min={0}
                value={formData.yearsOfExperience}
                onChange={(e) =>
                  setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Preferred Destination Country
              </label>
              <select
                className="w-full text-sm bg-background border border-border rounded-lg p-2.5"
                value={formData.preferredCountryId}
                onChange={(e) =>
                  setFormData({ ...formData, preferredCountryId: e.target.value })
                }
              >
                <option value="">No preference / Open to all</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Preferred Job Category
              </label>
              <select
                className="w-full text-sm bg-background border border-border rounded-lg p-2.5"
                value={formData.preferredJobCategoryId}
                onChange={(e) =>
                  setFormData({ ...formData, preferredJobCategoryId: e.target.value })
                }
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-full">
              <label className="text-xs font-medium text-foreground block mb-1">
                Technical Skills & Certifications
              </label>
              <textarea
                rows={2}
                className="w-full text-sm bg-background border border-border rounded-lg p-2.5"
                placeholder="e.g. 6G Welding Certificate, AutoCAD, Heavy Machinery License..."
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              />
            </div>

            <div className="col-span-full">
              <label className="text-xs font-medium text-foreground block mb-1">
                Languages Spoken
              </label>
              <Input
                placeholder="e.g. Bengali (Native), English (Basic), Arabic (Conversational)"
                value={formData.languages}
                onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Address & Contact */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <h3 className="font-semibold text-base text-foreground border-b border-border pb-2">
            4. Address & Permanent Residence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Home District</label>
              <Input
                placeholder="e.g. Chattogram, Cumilla, Sylhet"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Upazila / Thana</label>
              <Input
                placeholder="e.g. Kotwali, Mirsharai"
                value={formData.upazila}
                onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
              />
            </div>

            <div className="col-span-full">
              <label className="text-xs font-medium text-foreground block mb-1">Village / Street Address</label>
              <textarea
                rows={2}
                className="w-full text-sm bg-background border border-border rounded-lg p-2.5"
                placeholder="Complete postal address..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={saving} className="px-6">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
