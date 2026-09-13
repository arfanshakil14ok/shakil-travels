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
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Briefcase,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

export default function StaffEmployersPage() {
  const { success, error } = useToast();

  const [employers, setEmployers] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    companyNameLocal: '',
    countryId: '',
    city: '',
    industry: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    status: 'ACTIVE',
    verificationStatus: 'PENDING',
    notes: '',
  });

  // Verify Modal State
  const [verifyModalTarget, setVerifyModalTarget] = useState<any | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'VERIFIED' | 'REJECTED' | 'PENDING'>('VERIFIED');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`/api/employers?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch employers');

      setEmployers(data.data.items || []);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [search, countryFilter, verificationFilter, statusFilter, error]);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  const handleOpenCreate = () => {
    setFormData({
      companyName: '',
      companyNameLocal: '',
      countryId: countries[0]?.id || '',
      city: '',
      industry: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      status: 'ACTIVE',
      verificationStatus: 'PENDING',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const res = await fetch('/api/employers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create employer');
      }

      success('Employer registered successfully with human-readable ID');
      setIsModalOpen(false);
      fetchEmployers();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySubmit = async () => {
    if (!verifyModalTarget) return;
    try {
      setIsVerifying(true);
      const res = await fetch(`/api/employers/${verifyModalTarget.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationStatus: verifyStatus,
          verificationNotes: verifyNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Verification update failed');

      success(`Employer status changed to ${verifyStatus}`);
      setVerifyModalTarget(null);
      fetchEmployers();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/employers/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete employer');

      success(data.message || 'Employer removed successfully');
      setDeleteTarget(null);
      fetchEmployers();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <Badge variant="success" className="gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified
          </Badge>
        );
      case 'PENDING':
      case 'PENDING_VERIFICATION':
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="danger" className="gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-500" /> Unverified
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'SUSPENDED':
        return <Badge variant="danger">Suspended</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-indigo-600" />
            Overseas Employers & Companies
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            নিয়োগকারী বৈদেশিক প্রতিষ্ঠান ব্যবস্থাপনা, ডকুমেন্ট ভেরিফিকেশন ও ডিমান্ড ট্র্যাকিং (RL-1892)
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={fetchEmployers} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-1.5" />
            Register Employer
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by company, code, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div>
            <Select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Destination Countries' },
                ...countries.map((c) => ({ value: c.id, label: `${c.flag || ''} ${c.name}` })),
              ]}
              className="text-xs"
            />
          </div>

          <div>
            <Select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Verification Statuses' },
                { value: 'VERIFIED', label: 'Verified Only' },
                { value: 'PENDING', label: 'Pending Review' },
                { value: 'UNVERIFIED', label: 'Unverified' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
              className="text-xs"
            />
          </div>

          <div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Operational Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'SUSPENDED', label: 'Suspended' },
              ]}
              className="text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Employers Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Employer Code & Company</th>
                <th className="py-3 px-4">Destination & Location</th>
                <th className="py-3 px-4">Primary Contact</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Demand Metrics</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading employers database...
                  </td>
                </tr>
              ) : employers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No employers found matching criteria.
                  </td>
                </tr>
              ) : (
                employers.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                        <Link
                          href={`/staff/employers/${emp.id}`}
                          className="hover:text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          {emp.companyName}
                          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                        </Link>
                      </div>
                      {emp.companyNameLocal && (
                        <div className="text-xs text-slate-500 font-normal">{emp.companyNameLocal}</div>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {emp.employerCode || 'ID Pending'}
                        </span>
                        {getStatusBadge(emp.status)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <span className="text-base">{emp.country?.flag || '🌐'}</span>
                        <span>{emp.country?.name || 'Unassigned'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {emp.city ? `${emp.city} • ` : ''}
                        {emp.industry || 'General Recruitment'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">
                        {emp.contacts?.[0]?.name || emp.contactPerson || 'None specified'}
                      </div>
                      <div className="text-[11px] text-slate-500 space-y-0.5 mt-0.5">
                        {(emp.contacts?.[0]?.email || emp.email) && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {emp.contacts?.[0]?.email || emp.email}
                          </div>
                        )}
                        {(emp.contacts?.[0]?.phone || emp.phone) && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {emp.contacts?.[0]?.phone || emp.phone}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getVerificationBadge(emp.verificationStatus)}
                      {emp.verifiedAt && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          Verified: {new Date(emp.verifiedAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="text-xs">
                          <span className="font-bold text-slate-900">{emp._count?.jobs || 0}</span>
                          <span className="text-slate-400"> jobs</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div className="text-xs">
                          <span className="font-bold text-indigo-600">
                            {emp.metrics?.remainingVacancies ?? (emp.metrics?.totalVacancies || 0)}
                          </span>
                          <span className="text-slate-400"> vacancies</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {emp.metrics?.totalApplications || 0} applications
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          <Link href={`/staff/employers/${emp.id}`}>
                            360° View
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVerifyModalTarget(emp);
                            setVerifyStatus(emp.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'VERIFIED');
                            setVerifyNotes(emp.verificationNotes || '');
                          }}
                          className="h-8 text-xs text-slate-700"
                        >
                          Verify
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(emp)}
                          className="h-8 text-rose-600 hover:bg-rose-50 p-1.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Overseas Employer (নিয়োগকারী কোম্পানি)"
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name (English) *
              </label>
              <Input
                required
                placeholder="e.g. Al-Futtaim Construction LLC"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name (Local / Arabic)
              </label>
              <Input
                placeholder="e.g. مجموعة الفطيم للمقاولات"
                value={formData.companyNameLocal}
                onChange={(e) => setFormData({ ...formData, companyNameLocal: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destination Country *
              </label>
              <Select
                required
                value={formData.countryId}
                onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                options={[
                  { value: '', label: 'Select Country' },
                  ...countries.map((c) => ({ value: c.id, label: `${c.flag || ''} ${c.name}` })),
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City / Region
              </label>
              <Input
                placeholder="e.g. Riyadh / Dubai / Doha"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industry Sector
              </label>
              <Input
                placeholder="e.g. Construction & Engineering"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Website
              </label>
              <Input
                placeholder="https://..."
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Contact Person
              </label>
              <Input
                placeholder="e.g. Tariq Mansoor (HR Director)"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <Input
                placeholder="e.g. +966 50 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email
              </label>
              <Input
                type="email"
                placeholder="recruitment@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Headquarters Address
              </label>
              <Input
                placeholder="Full address in destination country"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSubmitting ? 'Registering...' : 'Register Employer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Verification Modal */}
      <Modal
        isOpen={Boolean(verifyModalTarget)}
        onClose={() => setVerifyModalTarget(null)}
        title={`Employer Verification Workflow: ${verifyModalTarget?.companyName}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Verification Status</label>
            <Select
              value={verifyStatus}
              onChange={(e) => setVerifyStatus(e.target.value as any)}
              options={[
                { value: 'VERIFIED', label: '✓ VERIFIED (Permits Job Posting & Marketplace Publishing)' },
                { value: 'PENDING', label: '⏳ PENDING (Awaiting compliance or document review)' },
                { value: 'REJECTED', label: '✕ REJECTED (Suspends employer and blocks job postings)' },
              ]}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Internal Verification Notes & Audit Trail
            </label>
            <textarea
              rows={3}
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              placeholder="Record reason, verified documents, chamber of commerce registration number, etc."
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" onClick={() => setVerifyModalTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleVerifySubmit}
              disabled={isVerifying}
              className={verifyStatus === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
            >
              {isVerifying ? 'Updating...' : 'Update Verification'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Confirm Employer Deletion / Deactivation"
        message={`Are you sure you want to remove ${deleteTarget?.companyName}? If active jobs or applications exist, this employer will be set to INACTIVE instead of deleting records.`}
        confirmText={isDeleting ? 'Processing...' : 'Confirm Delete'}
        variant="danger"
      />
    </div>
  );
}
