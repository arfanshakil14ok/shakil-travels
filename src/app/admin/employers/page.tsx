'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  Globe2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

export default function EmployersPage() {
  const { success, error } = useToast();

  const [employers, setEmployers] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    countryId: '',
    industry: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    verificationStatus: 'PENDING',
    notes: '',
  });

  // Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch('/api/countries?activeOnly=true');
        const data = await res.json();
        if (data.success) setCountries(data.data);
      } catch (err) {
        console.error('Failed to load countries', err);
      }
    }
    loadCountries();
  }, []);

  const fetchEmployers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (countryFilter !== 'ALL') params.append('countryId', countryFilter);
      if (verificationFilter !== 'ALL') params.append('verificationStatus', verificationFilter);

      const res = await fetch(`/api/employers?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch employers');

      setEmployers(data.data.items || []);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [search, countryFilter, verificationFilter, error]);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  const handleOpenCreate = () => {
    setEditingEmployer(null);
    setFormData({
      companyName: '',
      countryId: '',
      industry: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      verificationStatus: 'PENDING',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: any) => {
    setEditingEmployer(emp);
    setFormData({
      companyName: emp.companyName,
      countryId: emp.countryId || '',
      industry: emp.industry || '',
      contactPerson: emp.contactPerson || '',
      email: emp.email || '',
      phone: emp.phone || '',
      address: emp.address || '',
      website: emp.website || '',
      verificationStatus: emp.verificationStatus || 'PENDING',
      notes: emp.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const url = editingEmployer ? `/api/employers/${editingEmployer.id}` : '/api/employers';
      const method = editingEmployer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save employer');

      success(editingEmployer ? 'Employer updated successfully' : 'Employer registered successfully');
      setIsModalOpen(false);
      fetchEmployers();
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
      const res = await fetch(`/api/employers/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to remove employer');

      success(data.message || 'Employer removed');
      setDeleteTarget(null);
      fetchEmployers();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Corporate Principals
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Overseas Employers & Principals
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage international hiring companies, contract verification, and job quotas.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Register Employer
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Search company, contact, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />

            <Select
              options={[
                { value: 'ALL', label: 'All Destination Countries' },
                ...countries.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
            />

            <Select
              options={[
                { value: 'ALL', label: 'All Verification Statuses' },
                { value: 'VERIFIED', label: 'Verified' },
                { value: 'PENDING', label: 'Pending Verification' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Employers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-navy-900" />
            Loading employers directory...
          </div>
        ) : employers.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
            No employer organizations found matching criteria.
          </div>
        ) : (
          employers.map((emp) => (
            <Card key={emp.id} className="hover:border-navy-400 hover:shadow-xs transition-all">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-base truncate">
                        {emp.companyName}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        {emp.country?.flag && <span>{emp.country.flag}</span>}
                        <span>{emp.country?.name || 'International'}</span>
                        {emp.industry && (
                          <>
                            <span>•</span>
                            <span>{emp.industry}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <Badge
                      variant={
                        emp.verificationStatus === 'VERIFIED'
                          ? 'success'
                          : emp.verificationStatus === 'PENDING'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {emp.verificationStatus}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    {emp.contactPerson && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Contact:</span>
                        <span className="font-medium text-slate-800">{emp.contactPerson}</span>
                      </div>
                    )}
                    {emp.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.phone}</span>
                      </div>
                    )}
                    {emp.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {emp._count?.jobs || 0} Posted Demands
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(emp)}
                      leftIcon={<Edit className="w-3 h-3" />}
                      className="text-xs h-7 px-2"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(emp)}
                      leftIcon={<Trash2 className="w-3 h-3 text-rose-500" />}
                      className="text-xs h-7 px-2"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Register / Edit Employer */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployer ? 'Edit Employer Organization' : 'Register Overseas Employer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            label="Company Name"
            required
            placeholder="e.g. Al-Rashid Construction Co."
            value={formData.companyName}
            onChange={(e) => setFormData((p) => ({ ...p, companyName: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Country"
              options={[
                { value: '', label: 'Select Country' },
                ...countries.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={formData.countryId}
              onChange={(e) => setFormData((p) => ({ ...p, countryId: e.target.value }))}
            />

            <Input
              label="Industry / Sector"
              placeholder="e.g. Engineering, Hospital"
              value={formData.industry}
              onChange={(e) => setFormData((p) => ({ ...p, industry: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Person"
              placeholder="e.g. HR Director Name"
              value={formData.contactPerson}
              onChange={(e) => setFormData((p) => ({ ...p, contactPerson: e.target.value }))}
            />

            <Select
              label="Verification Status"
              options={[
                { value: 'VERIFIED', label: 'Verified & Approved' },
                { value: 'PENDING', label: 'Pending Due Diligence' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
              value={formData.verificationStatus}
              onChange={(e) => setFormData((p) => ({ ...p, verificationStatus: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Email"
              type="email"
              placeholder="hr@company.com"
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            />

            <Input
              label="Phone"
              placeholder="+966 11 000 0000"
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>

          <Input
            label="Website URL"
            placeholder="https://example.com"
            value={formData.website}
            onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))}
          />

          <Input
            label="Physical Address / Headquarters"
            placeholder="P.O. Box, City, Province"
            value={formData.address}
            onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              {editingEmployer ? 'Save Changes' : 'Register Principal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Employer"
        message={`Are you sure you want to remove ${deleteTarget?.companyName}? If associated jobs exist, the employer will be safely marked INACTIVE.`}
        confirmText="Confirm Deletion"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
