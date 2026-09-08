'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Globe2,
  Search,
  Edit,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  XCircle,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

export default function AdminCountryInformationPage() {
  const { success, error } = useToast();
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    recruitmentStatus: 'ACTIVE',
    continent: '',
    currency: '',
    currencyCode: '',
    timezone: '',
    visaInformation: '',
    workerInformation: '',
    featured: false,
    displayOrder: 0,
  });

  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/countries');
      const data = await res.json();
      if (data.success) {
        setCountries(data.data || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch countries');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const handleOpenEdit = (c: any) => {
    setEditingCountry(c);
    setFormData({
      recruitmentStatus: c.recruitmentStatus || 'ACTIVE',
      continent: c.continent || '',
      currency: c.currency || '',
      currencyCode: c.currencyCode || '',
      timezone: c.timezone || '',
      visaInformation: c.visaInformation || '',
      workerInformation: c.workerInformation || '',
      featured: !!c.featured,
      displayOrder: c.displayOrder || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCountry) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/countries/${editingCountry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        success(`Updated ${editingCountry.name} guidelines`);
        setIsModalOpen(false);
        fetchCountries();
      } else {
        error(data.error || 'Failed to update country guidelines');
      }
    } catch (err: any) {
      error(err.message || 'Error updating country');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">ACTIVE</Badge>;
      case 'LIMITED':
        return <Badge variant="warning">LIMITED</Badge>;
      case 'PAUSED':
        return <Badge variant="navy">PAUSED</Badge>;
      case 'INACTIVE':
        return <Badge variant="danger">INACTIVE</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <Globe2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Country Recruitment Guidelines & Policies</h1>
              <p className="text-sm text-slate-500">
                Configure destination status (Active/Limited/Paused), worker rights, living costs, and official immigration guidance.
              </p>
            </div>
          </div>
        </div>

        <Link href="/admin/countries">
          <Button variant="outline">Manage Base Countries</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <Input
          placeholder="Search country name or ISO code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-sm bg-white"
        />
      </div>

      {/* Countries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400">Loading countries...</div>
        ) : filteredCountries.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400">No countries found.</div>
        ) : (
          filteredCountries.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-primary-200 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{c.flag || '🌐'}</span>
                    <div>
                      <h3 className="font-bold text-slate-900">{c.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">{c.code} {c.continent ? `• ${c.continent}` : ''}</span>
                    </div>
                  </div>
                  {getStatusBadge(c.recruitmentStatus || 'ACTIVE')}
                </div>

                <div className="text-xs text-slate-600 space-y-1 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Currency:</span>
                    <span>{c.currency ? `${c.currency} (${c.currencyCode || ''})` : 'Not Set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Jobs:</span>
                    <span className="font-semibold text-primary-700">{c._count?.jobs || 0}</span>
                  </div>
                  {c.visaInformation && (
                    <div className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                      {c.visaInformation}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Link
                  href={`/countries/${c.slug}`}
                  target="_blank"
                  className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                >
                  View Public Page <ExternalLink className="w-3 h-3" />
                </Link>
                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(c)} className="text-xs flex items-center gap-1">
                  <Edit className="w-3.5 h-3.5" /> Edit Policy
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Edit Guidelines: ${editingCountry?.name || ''}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Recruitment Status *</label>
              <select
                value={formData.recruitmentStatus}
                onChange={(e) => setFormData({ ...formData, recruitmentStatus: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800"
              >
                <option value="ACTIVE">ACTIVE (Government approved & ongoing)</option>
                <option value="LIMITED">LIMITED (Quota or restricted skills)</option>
                <option value="PAUSED">PAUSED (Temporarily suspended)</option>
                <option value="INACTIVE">INACTIVE (Not processing)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Continent / Region</label>
              <Input
                placeholder="e.g. Middle East, East Asia, Europe"
                value={formData.continent}
                onChange={(e) => setFormData({ ...formData, continent: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Currency Name</label>
              <Input
                placeholder="e.g. Japanese Yen or Saudi Riyal"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Currency Code</label>
              <Input
                placeholder="e.g. JPY, SAR, AED"
                value={formData.currencyCode}
                onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Visa & Immigration Overview</label>
            <textarea
              rows={3}
              placeholder="Official work permit structure, minimum salary guidelines, embassy processing times..."
              value={formData.visaInformation}
              onChange={(e) => setFormData({ ...formData, visaInformation: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Worker Rights & Living Conditions</label>
            <textarea
              rows={3}
              placeholder="Accommodation, overtime laws, medical insurance, BMET clearance conditions..."
              value={formData.workerInformation}
              onChange={(e) => setFormData({ ...formData, workerInformation: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="featured" className="text-sm text-slate-700">
              Feature this destination on homepage
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Policy'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
