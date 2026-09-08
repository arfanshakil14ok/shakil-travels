'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Stamp,
  Globe2,
  Plus,
  Edit,
  Trash2,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { VISA_TYPES } from '@/lib/validations/visa';

export default function AdminVisaInformationPage() {
  const { success, error } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    countryId: '',
    visaType: 'WORK_VISA',
    title: '',
    overview: '',
    eligibility: '',
    requiredDocuments: '',
    applicationProcess: '',
    processingInformation: '',
    feesInformation: '',
    validityInformation: '',
    workRights: '',
    restrictions: '',
    officialSourceName: '',
    officialSourceUrl: '',
    isActive: true,
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        countryId: countryFilter,
        active: 'false',
      });
      const [itemsRes, countriesRes] = await Promise.all([
        fetch(`/api/visa-information?${query.toString()}`),
        fetch('/api/countries'),
      ]);
      const itemsData = await itemsRes.json();
      const countriesData = await countriesRes.json();

      if (itemsData.success) setItems(itemsData.data || []);
      if (countriesData.success) setCountries(countriesData.data || []);
    } catch (err: any) {
      error(err.message || 'Failed to load visa information');
    } finally {
      setLoading(false);
    }
  }, [search, countryFilter, error]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      countryId: countries[0]?.id || '',
      visaType: 'WORK_VISA',
      title: '',
      overview: '',
      eligibility: '',
      requiredDocuments: '',
      applicationProcess: '',
      processingInformation: '',
      feesInformation: '',
      validityInformation: '',
      workRights: '',
      restrictions: '',
      officialSourceName: '',
      officialSourceUrl: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      countryId: item.countryId,
      visaType: item.visaType,
      title: item.title,
      overview: item.overview || '',
      eligibility: item.eligibility || '',
      requiredDocuments: item.requiredDocuments || '',
      applicationProcess: item.applicationProcess || '',
      processingInformation: item.processingInformation || '',
      feesInformation: item.feesInformation || '',
      validityInformation: item.validityInformation || '',
      workRights: item.workRights || '',
      restrictions: item.restrictions || '',
      officialSourceName: item.officialSourceName || '',
      officialSourceUrl: item.officialSourceUrl || '',
      isActive: item.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingItem
        ? `/api/visa-information/${editingItem.id}`
        : '/api/visa-information';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        success(editingItem ? 'Visa criteria updated' : 'Visa criteria published');
        setIsModalOpen(false);
        fetchItems();
      } else {
        error(data.error || 'Failed to save visa information');
      }
    } catch (err: any) {
      error(err.message || 'Error submitting visa info');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/visa-information/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        success('Visa criteria removed');
        setDeleteTarget(null);
        fetchItems();
      } else {
        error(data.error || 'Failed to delete');
      }
    } catch (err: any) {
      error(err.message || 'Error deleting visa info');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Official Visa Rules & Criteria</h1>
              <p className="text-sm text-slate-500">
                Country-specific work permits, eligibility requirements, fees, and government links.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Visa Criteria
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search visa rules, country, title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
        >
          <option value="ALL">All Countries</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Title & Visa Type</th>
                <th className="py-3.5 px-4">Country</th>
                <th className="py-3.5 px-4">Official Source</th>
                <th className="py-3.5 px-4">Last Verified</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading visa information...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No visa information records created yet.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-400">{item.visaType.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">{item.country?.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {item.officialSourceUrl ? (
                        <a
                          href={item.officialSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline flex items-center gap-1"
                        >
                          {item.officialSourceName || 'Official Link'}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">{item.officialSourceName || 'N/A'}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {item.lastVerifiedAt ? new Date(item.lastVerifiedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={item.isActive ? 'success' : 'secondary'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenEdit(item)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-rose-600 hover:bg-rose-50" onClick={() => setDeleteTarget(item)}>
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Visa Criteria' : 'Add Official Visa Criteria'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Country *</label>
              <select
                value={formData.countryId}
                onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800"
                required
              >
                <option value="">Select country...</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Visa Type *</label>
              <select
                value={formData.visaType}
                onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800"
              >
                {VISA_TYPES.map((vt) => (
                  <option key={vt} value={vt}>{vt.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Visa Title *</label>
            <Input
              placeholder="e.g. Japan Specified Skilled Worker (SSW-1) Permit"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Overview</label>
            <textarea
              rows={2}
              placeholder="Short description of this visa category..."
              value={formData.overview}
              onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Eligibility Criteria</label>
            <textarea
              rows={2}
              placeholder="Age, qualifications, skills, language test requirements..."
              value={formData.eligibility}
              onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Required Documents</label>
            <textarea
              rows={2}
              placeholder="Passport, police clearance, medical, diploma, contract..."
              value={formData.requiredDocuments}
              onChange={(e) => setFormData({ ...formData, requiredDocuments: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Official Government Source Name</label>
              <Input
                placeholder="e.g. Japan Immigration Services Agency"
                value={formData.officialSourceName}
                onChange={(e) => setFormData({ ...formData, officialSourceName: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Official Source URL</label>
              <Input
                placeholder="https://www.mofa.go.jp/..."
                value={formData.officialSourceUrl}
                onChange={(e) => setFormData({ ...formData, officialSourceUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700">
              Active / Visible on public website
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Visa Information'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Visa Criteria"
        message={`Are you sure you want to delete ${deleteTarget?.title}?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
