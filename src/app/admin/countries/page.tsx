'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe2,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { CountryFlag } from '@/components/ui/country-flag';

export default function AdminCountriesPage() {
  const { success, error } = useToast();

  const [countries, setCountries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    flag: '',
    currency: '',
    currencyCode: '',
    description: '',
    isActive: true,
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCountries = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/countries');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch countries');
      setCountries(data.data || []);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const handleOpenCreate = () => {
    setEditingCountry(null);
    setFormData({
      name: '',
      code: '',
      flag: '',
      currency: '',
      currencyCode: '',
      description: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingCountry(c);
    setFormData({
      name: c.name,
      code: c.code,
      flag: c.flag || '',
      currency: c.currency || '',
      currencyCode: c.currencyCode || '',
      description: c.description || '',
      isActive: c.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const url = editingCountry ? `/api/countries/${editingCountry.id}` : '/api/countries';
      const method = editingCountry ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save country');

      success(editingCountry ? 'Country updated successfully' : 'Country added successfully');
      setIsModalOpen(false);
      fetchCountries();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/countries/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete country');

      success('Country removed successfully');
      setDeleteTarget(null);
      fetchCountries();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Immigration & Destinations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Destination Countries
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Authorized migration destination corridors, job demand allocations, and visa regulations.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Destination
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search destination country by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Country & Flag</th>
                <th className="p-3.5">ISO Code</th>
                <th className="p-3.5">Default Currency</th>
                <th className="p-3.5">Active Demands</th>
                <th className="p-3.5">Applicant Preferences</th>
                <th className="p-3.5">Corridor Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-navy-900" />
                    Loading countries...
                  </td>
                </tr>
              ) : filteredCountries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    No countries found.
                  </td>
                </tr>
              ) : (
                filteredCountries.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <CountryFlag flag={c.flag} name={c.name} size="md" />
                        <span className="font-semibold text-slate-900 text-sm">{c.name}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs border border-slate-200">
                        {c.code}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {c.currencyCode ? (
                        <span className="inline-flex items-center gap-1 font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                          {c.currencyCode}
                          {c.currency && <span className="text-[10px] text-emerald-600 font-sans font-normal">({c.currency})</span>}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Not configured</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-emerald-700">
                        {c._count?.jobs || 0} Published Demands
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="text-slate-600">
                        {c._count?.preferredApplicants || 0} Candidates
                      </span>
                    </td>

                    <td className="p-3.5">
                      <Badge variant={c.isActive ? 'success' : 'neutral'} size="sm">
                        {c.isActive ? 'Active Corridor' : 'Suspended'}
                      </Badge>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(c)}
                          leftIcon={<Edit className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(c)}
                          leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                          className="text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Country */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCountry ? 'Edit Destination Country / দেশ সম্পাদনা' : 'Add Destination Country / নতুন দেশ যোগ করুন'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            label="Country Name *"
            required
            placeholder="e.g. Kingdom of Saudi Arabia, Japan, Qatar"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Country Code (ISO 2/3 letter) *"
              required
              maxLength={3}
              placeholder="e.g. SA, JP, QA, RO"
              value={formData.code}
              onChange={(e) => {
                const code = e.target.value.toUpperCase();
                setFormData((p) => {
                  const updated: any = { ...p, code };
                  // Auto-suggest flag and currency for common codes if not set
                  if (!p.flag || p.flag.includes('flagcdn.com')) {
                    updated.flag = code.length >= 2 ? `https://flagcdn.com/w40/${code.slice(0, 2).toLowerCase()}.png` : '';
                  }
                  if (!p.currencyCode) {
                    const map: Record<string, { code: string; name: string }> = {
                      SA: { code: 'SAR', name: 'Saudi Riyal' },
                      AE: { code: 'AED', name: 'UAE Dirham' },
                      QA: { code: 'QAR', name: 'Qatari Riyal' },
                      KW: { code: 'KWD', name: 'Kuwaiti Dinar' },
                      OM: { code: 'OMR', name: 'Omani Rial' },
                      BH: { code: 'BHD', name: 'Bahraini Dinar' },
                      MY: { code: 'MYR', name: 'Malaysian Ringgit' },
                      SG: { code: 'SGD', name: 'Singapore Dollar' },
                      JP: { code: 'JPY', name: 'Japanese Yen' },
                      KR: { code: 'KRW', name: 'South Korean Won' },
                      RO: { code: 'RON', name: 'Romanian Leu' },
                      PL: { code: 'PLN', name: 'Polish Zloty' },
                      GB: { code: 'GBP', name: 'British Pound' },
                      US: { code: 'USD', name: 'US Dollar' },
                      BD: { code: 'BDT', name: 'Bangladeshi Taka' },
                    };
                    if (map[code]) {
                      updated.currencyCode = map[code].code;
                      updated.currency = map[code].name;
                    }
                  }
                  return updated;
                });
              }}
            />

            <Input
              label="Flag Symbol / Image URL"
              placeholder="e.g. 🇸🇦 or flagcdn URL"
              value={formData.flag}
              onChange={(e) => setFormData((p) => ({ ...p, flag: e.target.value }))}
            />
          </div>

          {/* Live Flag & Currency Preview */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Flag Preview:</span>
              <CountryFlag flag={formData.flag || (formData.code.length >= 2 ? `https://flagcdn.com/w40/${formData.code.slice(0, 2).toLowerCase()}.png` : null)} name={formData.name} size="md" />
              <span className="text-xs font-semibold text-slate-800">{formData.name || 'Country'}</span>
            </div>
            {formData.currencyCode && (
              <span className="font-mono text-xs font-bold bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                {formData.currencyCode} {formData.currency ? `(${formData.currency})` : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Default Currency Code"
              placeholder="e.g. SAR, JPY, EUR, QAR"
              maxLength={5}
              value={formData.currencyCode}
              onChange={(e) => setFormData((p) => ({ ...p, currencyCode: e.target.value.toUpperCase() }))}
            />

            <Input
              label="Currency Name / Symbol"
              placeholder="e.g. Saudi Riyal, Yen, Euro"
              value={formData.currency}
              onChange={(e) => setFormData((p) => ({ ...p, currency: e.target.value }))}
            />
          </div>

          <Textarea
            label="Description & Migration Policy Brief"
            placeholder="Key visa policies, processing guidelines, or notes..."
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          />

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800">Active Migration Corridor</span>
              <p className="text-[11px] text-slate-500">Enable candidate matching and job publishing for this country</p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(v) => setFormData((p) => ({ ...p, isActive: v }))}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              {editingCountry ? 'Update Country / আপডেট করুন' : 'Add Country / দেশ যুক্ত করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Destination Country"
        message={`Are you sure you want to remove ${deleteTarget?.name}? If active job demands exist, deletion will be blocked.`}
        confirmText="Confirm Removal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
