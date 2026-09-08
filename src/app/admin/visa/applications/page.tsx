'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Stamp,
  Search,
  Filter,
  Plus,
  Eye,
  Calendar,
  User,
  Globe2,
  RefreshCw,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { VISA_STATUSES, VISA_TYPES } from '@/lib/validations/visa';

export default function VisaApplicationsPage() {
  const { success, error } = useToast();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [visaTypeFilter, setVisaTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Metadata dropdowns
  const [countries, setCountries] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applicationsList, setApplicationsList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    applicationId: '',
    visaType: 'WORK_VISA',
    assignedStaffId: '',
    referenceNumber: '',
    notes: '',
  });

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
        status: statusFilter,
        countryId: countryFilter,
        visaType: visaTypeFilter,
      });

      const res = await fetch(`/api/visa/applications?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCases(data.data.items || []);
        setTotalPages(data.data.pagination.totalPages || 1);
        setTotalCount(data.data.pagination.total || 0);
      } else {
        error(data.error || 'Failed to load visa cases');
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch visa cases');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, countryFilter, visaTypeFilter, error]);

  const loadMetadata = useCallback(async () => {
    try {
      const [countriesRes, staffRes, appsRes] = await Promise.all([
        fetch('/api/countries'),
        fetch('/api/users?role=STAFF'),
        fetch('/api/applications?limit=100'),
      ]);
      const countriesData = await countriesRes.json();
      const staffData = await staffRes.json();
      const appsData = await appsRes.json();

      if (countriesData.success) setCountries(countriesData.data || []);
      if (staffData.success) setStaffUsers(staffData.data.users || staffData.data || []);
      if (appsData.success) setApplicationsList(appsData.data.items || []);
    } catch (e) {
      console.error('Error loading metadata:', e);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicationId) {
      error('Please select a recruitment application');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/visa/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        success(data.message || 'Visa case created successfully');
        setIsCreateModalOpen(false);
        setFormData({ applicationId: '', visaType: 'WORK_VISA', assignedStaffId: '', referenceNumber: '', notes: '' });
        fetchCases();
      } else {
        error(data.error || 'Failed to create visa case');
      }
    } catch (err: any) {
      error(err.message || 'Error creating visa case');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return <Badge variant="success">{status}</Badge>;
      case 'REJECTED':
      case 'WITHDRAWN':
        return <Badge variant="danger">{status}</Badge>;
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'BIOMETRICS':
      case 'MEDICAL':
        return <Badge variant="primary">{status.replace(/_/g, ' ')}</Badge>;
      case 'DOCUMENT_PENDING':
      case 'ADDITIONAL_DOCUMENT_REQUESTED':
        return <Badge variant="warning">{status.replace(/_/g, ' ')}</Badge>;
      default:
        return <Badge variant="secondary">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <Stamp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Visa Applications & Tracking</h1>
              <p className="text-sm text-slate-500">
                Total {totalCount} registered visa processing cases.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Open Visa Case
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search candidate, visa ID, passport..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              {VISA_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={countryFilter}
              onChange={(e) => {
                setCountryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
            >
              <option value="ALL">All Countries</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={visaTypeFilter}
              onChange={(e) => {
                setVisaTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
            >
              <option value="ALL">All Visa Types</option>
              {VISA_TYPES.map((vt) => (
                <option key={vt} value={vt}>
                  {vt.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Visa ID</th>
                <th className="py-3.5 px-4">Applicant</th>
                <th className="py-3.5 px-4">Application</th>
                <th className="py-3.5 px-4">Country & Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Staff</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                    Loading visa cases...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No visa records match your query.
                  </td>
                </tr>
              ) : (
                cases.map((vc) => (
                  <tr key={vc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-primary-700">
                      <Link href={`/admin/visa/applications/${vc.id}`} className="hover:underline">
                        {vc.visaApplicationNumber}
                      </Link>
                      {vc.referenceNumber && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Ref: {vc.referenceNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{vc.applicant?.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Passport: {vc.applicant?.passportNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <Link href={`/admin/applications/${vc.application?.id}`} className="hover:underline text-slate-700 hover:text-primary-600">
                        {vc.application?.applicationCode}
                      </Link>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {vc.application?.job?.title}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{vc.country?.name}</div>
                      <div className="text-[11px] text-slate-400">{vc.visaType.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(vc.status)}</td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {vc.assignedStaff ? vc.assignedStaff.name : <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/admin/visa/applications/${vc.id}`}>
                        <Button size="sm" variant="outline" className="text-xs flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing Page {page} of {totalPages} ({totalCount} total cases)
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Visa Case Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Open New Visa Processing Case"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Recruitment Application *</label>
            <select
              value={formData.applicationId}
              onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800"
              required
            >
              <option value="">Select candidate application...</option>
              {applicationsList.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.applicationCode} — {app.applicant?.fullName} ({app.job?.title} - {app.country?.name || 'Overseas'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Visa Type</label>
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

            <div>
              <label className="block font-medium text-slate-700 mb-1">Assigned Staff</label>
              <select
                value={formData.assignedStaffId}
                onChange={(e) => setFormData({ ...formData, assignedStaffId: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800"
              >
                <option value="">Select officer...</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Embassy / Reference Number</label>
            <Input
              placeholder="e.g. MOFA-10928374 or VFS-BD-9921"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Internal Notes</label>
            <textarea
              rows={3}
              placeholder="Initial processing notes, submission requirements, or agency instructions..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating Case...' : 'Create Visa Case'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
