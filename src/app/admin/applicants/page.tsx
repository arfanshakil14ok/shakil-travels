'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  ShieldCheck,
  AlertTriangle,
  CheckSquare,
  Square,
  UserCheck,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

export default function ApplicantsPage() {
  const { success, error } = useToast();

  const [applicants, setApplicants] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [educationFilter, setEducationFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState('ACTIVE');
  const [isBulkStaffModalOpen, setIsBulkStaffModalOpen] = useState(false);
  const [bulkTargetStaffId, setBulkTargetStaffId] = useState('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Fetch Lookups
  useEffect(() => {
    async function loadLookups() {
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
        console.error('Error loading lookups', err);
      }
    }
    loadLookups();
  }, []);

  // Fetch Applicants
  const fetchApplicants = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '12');
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (countryFilter !== 'ALL') params.append('countryId', countryFilter);
      if (categoryFilter !== 'ALL') params.append('categoryId', categoryFilter);
      if (educationFilter !== 'ALL') params.append('education', educationFilter);

      const res = await fetch(`/api/applicants?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load applicants');
      }

      setApplicants(data.data.items || []);
      setTotalPages(data.data.pagination.totalPages || 1);
      setTotalCount(data.data.pagination.total || 0);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, countryFilter, categoryFilter, educationFilter, error]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  // Bulk Selection Toggles
  const handleSelectAll = () => {
    if (selectedIds.length === applicants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applicants.map((a) => a.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Status Update
  const handleExecuteBulkStatus = async () => {
    try {
      setIsBulkSubmitting(true);
      const res = await fetch('/api/applicants/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          ids: selectedIds,
          payload: { status: bulkTargetStatus },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Bulk update failed');

      success(data.message);
      setIsBulkStatusModalOpen(false);
      setSelectedIds([]);
      fetchApplicants();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Bulk Staff Assignment
  const handleExecuteBulkStaff = async () => {
    try {
      setIsBulkSubmitting(true);
      const res = await fetch('/api/applicants/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_staff',
          ids: selectedIds,
          payload: { staffId: bulkTargetStaffId || null },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Bulk assignment failed');

      success(data.message);
      setIsBulkStaffModalOpen(false);
      setSelectedIds([]);
      fetchApplicants();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (statusFilter !== 'ALL') params.append('status', statusFilter);
    if (countryFilter !== 'ALL') params.append('countryId', countryFilter);
    if (categoryFilter !== 'ALL') params.append('categoryId', categoryFilter);

    window.open(`/api/applicants/export?${params.toString()}`, '_blank');
  };

  const getStatusBadgeVariant = (st: string) => {
    switch (st) {
      case 'ACTIVE':
        return 'success';
      case 'SHORTLISTED':
        return 'primary';
      case 'PLACED':
      case 'DEPARTED':
        return 'neutral';
      case 'ON_HOLD':
      case 'PROFILE_INCOMPLETE':
        return 'warning';
      case 'BLACKLISTED':
      case 'INACTIVE':
        return 'danger';
      default:
        return 'primary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Recruitment Core
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Candidate Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage applicant profiles, passport tracking, trade qualifications, and job matching.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>

          <Link href="/admin/applicants/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Register Candidate
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search name, phone, passport, SGR code..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            {/* Status */}
            <div>
              <Select
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'NEW', label: 'New Lead' },
                  { value: 'PROFILE_INCOMPLETE', label: 'Incomplete' },
                  { value: 'ACTIVE', label: 'Active Pool' },
                  { value: 'SHORTLISTED', label: 'Shortlisted' },
                  { value: 'ON_HOLD', label: 'On Hold' },
                  { value: 'PLACED', label: 'Placed' },
                  { value: 'DEPARTED', label: 'Departed' },
                  { value: 'INACTIVE', label: 'Inactive' },
                  { value: 'BLACKLISTED', label: 'Blacklisted' },
                ]}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Country */}
            <div>
              <Select
                options={[
                  { value: 'ALL', label: 'All Countries' },
                  ...countries.map((c) => ({ value: c.id, label: c.name })),
                ]}
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Trade Category */}
            <div>
              <Select
                options={[
                  { value: 'ALL', label: 'All Trades' },
                  ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                ]}
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar (Visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-navy-950 text-white rounded-xl flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold bg-navy-800 px-2.5 py-1 rounded-md text-emerald-400">
              {selectedIds.length} Selected
            </span>
            <span className="text-slate-300">Perform bulk operation on marked candidates</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-navy-900 text-white border-navy-700 hover:bg-navy-800 hover:text-white text-xs h-8"
              onClick={() => setIsBulkStatusModalOpen(true)}
            >
              Update Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-navy-900 text-white border-navy-700 hover:bg-navy-800 hover:text-white text-xs h-8"
              onClick={() => setIsBulkStaffModalOpen(true)}
            >
              Assign Staff
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white text-xs h-8"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Candidates Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 w-10">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Select all rows"
                  >
                    {selectedIds.length === applicants.length && applicants.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3.5">Candidate & ID</th>
                <th className="p-3.5">Contact & District</th>
                <th className="p-3.5">Target Trade & Country</th>
                <th className="p-3.5">Experience & Edu</th>
                <th className="p-3.5">Passport</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Assigned Staff</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-navy-900" />
                    Loading candidates...
                  </td>
                </tr>
              ) : applicants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    No candidates found matching the selected filters.
                  </td>
                </tr>
              ) : (
                applicants.map((a) => {
                  const isSelected = selectedIds.includes(a.id);
                  let isPassportAlert = false;
                  if (a.passportExpiry) {
                    const expiry = new Date(a.passportExpiry);
                    const diffDays = Math.ceil(
                      (expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    if (diffDays <= 180) isPassportAlert = true;
                  }

                  return (
                    <tr
                      key={a.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(a.id)}
                          className="text-slate-400 hover:text-slate-600"
                          aria-label={`Select ${a.fullName}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Candidate Name & SGR ID */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <ProfileAvatar
                            name={a.fullName}
                            photoUrl={a.profilePhoto}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/applicants/${a.id}`}
                              className="font-semibold text-slate-900 hover:text-emerald-600 block truncate max-w-[150px]"
                            >
                              {a.fullName}
                            </Link>
                            <span className="font-mono text-[10px] text-slate-500 block mt-0.5">
                              {a.applicantNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone & District */}
                      <td className="p-3.5">
                        <span className="text-slate-800 font-medium block">{a.phone}</span>
                        <span className="text-slate-400 text-[11px] block">{a.district || 'N/A'}</span>
                      </td>

                      {/* Target Trade & Destination */}
                      <td className="p-3.5">
                        <span className="font-medium text-navy-900 block truncate max-w-[160px]">
                          {a.preferredJobCategory?.name || 'General Trade'}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          {a.preferredCountry?.flag && <span>{a.preferredCountry.flag}</span>}
                          <span>{a.preferredCountry?.name || 'Open'}</span>
                        </span>
                      </td>

                      {/* Experience & Education */}
                      <td className="p-3.5">
                        <span className="font-medium text-slate-800 block">
                          {a.yearsOfExperience} Yrs Exp
                        </span>
                        <span className="text-[11px] text-slate-400 block">{a.education || 'Literate'}</span>
                      </td>

                      {/* Passport Info */}
                      <td className="p-3.5">
                        {a.passportAvailable && a.passportNumber ? (
                          <div>
                            <span className="font-mono font-medium text-slate-800 block">
                              {a.passportNumber}
                            </span>
                            {isPassportAlert ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 mt-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> &lt;6 Mos Left
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-600">Valid</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No Passport</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <Badge variant={getStatusBadgeVariant(a.status)} size="sm">
                          {a.status.replace('_', ' ')}
                        </Badge>
                      </td>

                      {/* Assigned Staff */}
                      <td className="p-3.5">
                        <span className="text-slate-700 block truncate max-w-[120px]">
                          {a.assignedStaff?.name || '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <Link href={`/admin/applicants/${a.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            className="text-xs"
                          >
                            360° Profile
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {applicants.length} of {totalCount} total candidates
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
            >
              Previous
            </Button>
            <span className="px-2 font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Modal: Bulk Status Change */}
      <Modal
        isOpen={isBulkStatusModalOpen}
        onClose={() => setIsBulkStatusModalOpen(false)}
        title="Update Status for Selected Candidates"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-500">
            Select the new operational pipeline status for all {selectedIds.length} marked candidates.
          </p>
          <Select
            label="Target Status"
            options={[
              { value: 'NEW', label: 'New Lead' },
              { value: 'PROFILE_INCOMPLETE', label: 'Profile Incomplete' },
              { value: 'ACTIVE', label: 'Active Candidate Pool' },
              { value: 'SHORTLISTED', label: 'Shortlisted' },
              { value: 'ON_HOLD', label: 'On Hold' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
            value={bulkTargetStatus}
            onChange={(e) => setBulkTargetStatus(e.target.value)}
          />
          <div className="flex justify-end gap-2.5 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsBulkStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecuteBulkStatus}
              isLoading={isBulkSubmitting}
            >
              Apply Status Update
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Bulk Assign Staff */}
      <Modal
        isOpen={isBulkStaffModalOpen}
        onClose={() => setIsBulkStaffModalOpen(false)}
        title="Assign Recruitment Officer"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-500">
            Assign a staff officer to handle {selectedIds.length} marked candidates.
          </p>
          <Select
            label="Recruitment Officer"
            options={[
              { value: '', label: 'Unassigned' },
              ...staffUsers.map((u) => ({ value: u.id, label: `${u.name} (${u.role.name})` })),
            ]}
            value={bulkTargetStaffId}
            onChange={(e) => setBulkTargetStaffId(e.target.value)}
          />
          <div className="flex justify-end gap-2.5 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsBulkStaffModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecuteBulkStaff}
              isLoading={isBulkSubmitting}
            >
              Confirm Assignment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
