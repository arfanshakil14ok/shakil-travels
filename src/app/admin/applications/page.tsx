'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Search,
  Plus,
  Download,
  Filter,
  Layers,
  ChevronRight,
  UserCheck,
  Building2,
  Calendar,
  AlertCircle,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRightCircle,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

interface ApplicationItem {
  id: string;
  applicationNumber: string;
  applicantId: string;
  jobId: string;
  currentStatus: string;
  priority: string;
  source: string;
  internalNotes: string | null;
  createdAt: string;
  applicant: {
    id: string;
    applicantNumber: string;
    fullName: string;
    phone: string;
    email: string | null;
    passportNumber: string | null;
    profilePhoto: string | null;
    skills: string | null;
  };
  job: {
    id: string;
    jobCode: string;
    title: string;
    vacancies: number;
    employer: { id: string; companyName: string };
    country: { id: string; name: string; flag: string | null; code: string };
  };
  assignedTo: { id: string; name: string; email: string } | null;
  _count: {
    documents: number;
    interviews: number;
    statusHistory: number;
  };
}

const STAGES = [
  'APPLIED',
  'SCREENING',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_PASSED',
  'SELECTED',
  'OFFER_LETTER_ISSUED',
  'CONTRACT_SIGNED',
  'MEDICAL_PASSED',
  'VISA_SUBMITTED',
  'VISA_STAMPED',
  'TICKET_CONFIRMED',
  'RECRUITMENT_COMPLETED',
  'REJECTED',
  'CANCELLED',
];

const STAGE_COLORS: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'error' | 'gold' | 'navy'> = {
  APPLIED: 'neutral',
  SCREENING: 'info',
  SHORTLISTED: 'navy',
  INTERVIEW_SCHEDULED: 'info',
  INTERVIEW_PASSED: 'success',
  SELECTED: 'gold',
  OFFER_LETTER_ISSUED: 'info',
  CONTRACT_SIGNED: 'success',
  MEDICAL_PASSED: 'success',
  VISA_SUBMITTED: 'info',
  VISA_STAMPED: 'success',
  TICKET_CONFIRMED: 'info',
  RECRUITMENT_COMPLETED: 'success',
  REJECTED: 'error',
  CANCELLED: 'neutral',
};

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);

  // Form states for Create
  const [applicantSearch, setApplicantSearch] = useState('');
  const [applicantResults, setApplicantResults] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [jobsList, setJobsList] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [createPriority, setCreatePriority] = useState('NORMAL');
  const [createNotes, setCreateNotes] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Multi-select for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
        status: statusFilter,
        priority: priorityFilter,
      });

      const res = await fetch(`/api/applications?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setApplications(data.data.items);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCount(data.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Load jobs when create modal opens
  const openCreateModal = async () => {
    setIsCreateModalOpen(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/jobs?status=ACTIVE&limit=100');
      const data = await res.json();
      if (data.success) {
        setJobsList(data.data.items);
        if (data.data.items.length > 0) {
          setSelectedJobId(data.data.items[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    }
  };

  // Search applicants for create modal
  const handleSearchApplicants = async (term: string) => {
    setApplicantSearch(term);
    if (term.length < 2) {
      setApplicantResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/applicants?search=${encodeURIComponent(term)}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setApplicantResults(data.data.items);
      }
    } catch (err) {
      console.error('Failed to search applicants', err);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) {
      setCreateError('Please select a candidate');
      return;
    }
    if (!selectedJobId) {
      setCreateError('Please select a job vacancy');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: selectedApplicant.id,
          jobId: selectedJobId,
          priority: createPriority,
          internalNotes: createNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        setSelectedApplicant(null);
        setApplicantSearch('');
        setCreateNotes('');
        fetchApplications();
      } else {
        setCreateError(data.error || 'Failed to create application');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Error creating application');
    } finally {
      setIsCreating(false);
    }
  };

  const openStatusModal = (app: ApplicationItem) => {
    setSelectedApp(app);
    setNewStatus(app.currentStatus);
    setStatusNotes('');
    setStatusError(null);
    setIsStatusModalOpen(true);
  };

  const handleStatusChange = async (forceOverride = false) => {
    if (!selectedApp || !newStatus) return;
    setStatusError(null);

    try {
      const res = await fetch(`/api/applications/${selectedApp.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStatus: newStatus,
          notes: statusNotes,
          forceOverride,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsStatusModalOpen(false);
        fetchApplications();
      } else {
        setStatusError(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      setStatusError(err.message || 'Error updating status');
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedIds.length === 0 || !bulkStatus) return;

    try {
      const res = await fetch('/api/applications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationIds: selectedIds,
          toStatus: bulkStatus,
          notes: 'Bulk status transition via admin table',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsBulkStatusModalOpen(false);
        setSelectedIds([]);
        fetchApplications();
      }
    } catch (err) {
      console.error('Bulk update error', err);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(applications.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary-600" />
            Candidate Applications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Recruitment pipeline stage progression tracking from initial application to deployment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/applications/pipeline">
            <Button variant="outline" className="flex items-center gap-2 border-slate-300">
              <Layers className="w-4 h-4 text-slate-600" />
              Pipeline Board
            </Button>
          </Link>

          <a href="/api/applications/export" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="flex items-center gap-2 border-slate-300">
              <Download className="w-4 h-4 text-slate-600" />
              Export CSV
            </Button>
          </a>

          <Button onClick={openCreateModal} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white">
            <Plus className="w-4 h-4" />
            New Application
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Active</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-sky-600 tracking-wider">Under Screening</p>
          <p className="text-2xl font-bold text-sky-700 mt-1">
            {applications.filter((a) => a.currentStatus === 'SCREENING' || a.currentStatus === 'APPLIED').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-amber-600 tracking-wider">Selected (Quota)</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {applications.filter((a) => a.currentStatus === 'SELECTED').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-emerald-600 tracking-wider">Completed / Deployed</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {applications.filter((a) => a.currentStatus === 'RECRUITMENT_COMPLETED' || a.currentStatus === 'DEPLOYED').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search candidate name, applicant #, passport, or job..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="ALL">All Stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setPage(1);
              }}
              className="text-slate-600"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Bulk action toolbar if rows selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm text-primary-900 font-medium">
              <CheckCircle2 className="w-4 h-4 text-primary-600" />
              <span>{selectedIds.length} candidate applications selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsBulkStatusModalOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white text-xs"
              >
                Advance Status
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedIds([])}
                className="text-xs text-slate-600 bg-white"
              >
                Deselect All
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === applications.length && applications.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                  />
                </th>
                <th className="py-3.5 px-4">Application</th>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Target Job & Destination</th>
                <th className="py-3.5 px-4">Recruitment Stage</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No applications found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or create a new application.</p>
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(app.id)}
                        onChange={() => toggleSelect(app.id)}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 font-mono text-xs">{app.applicationNumber}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs overflow-hidden shrink-0">
                          {app.applicant.profilePhoto ? (
                            <img
                              src={app.applicant.profilePhoto}
                              alt={app.applicant.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            app.applicant.fullName.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 hover:text-primary-600 transition-colors">
                            {app.applicant.fullName}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span>ID: {app.applicant.applicantNumber}</span>
                            {app.applicant.passportNumber && (
                              <span className="text-slate-400">• Pass: {app.applicant.passportNumber}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{app.job.title}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{app.job.employer.companyName}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          {app.job.country.flag && <span>{app.job.country.flag}</span>}
                          {app.job.country.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={STAGE_COLORS[app.currentStatus] || 'neutral'}>
                        {app.currentStatus.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          app.priority === 'URGENT'
                            ? 'bg-rose-100 text-rose-700'
                            : app.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {app.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {app.assignedTo ? (
                        <span className="font-medium text-slate-800">{app.assignedTo.name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openStatusModal(app)}
                          title="Advance Status"
                          className="h-8 px-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                        >
                          <ArrowRightCircle className="w-4 h-4" />
                        </Button>

                        <Link href={`/admin/applications/${app.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="View 360 Details"
                            className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing Page {page} of {totalPages} ({totalCount} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Application Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Candidate Application"
        description="Attach an applicant to an open overseas job vacancy."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateApplication} className="space-y-4">
          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          {/* Search Applicant */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Select Candidate <span className="text-rose-500">*</span>
            </label>
            {selectedApplicant ? (
              <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-primary-900">{selectedApplicant.fullName}</div>
                  <div className="text-xs text-primary-700">
                    ID: {selectedApplicant.applicantNumber} • Phone: {selectedApplicant.phone}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedApplicant(null)}
                  className="text-xs text-rose-600 hover:text-rose-700"
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Type name, phone or passport to find candidate..."
                  value={applicantSearch}
                  onChange={(e) => handleSearchApplicants(e.target.value)}
                  className="pl-9"
                />
                {applicantResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {applicantResults.map((cand) => (
                      <div
                        key={cand.id}
                        onClick={() => {
                          setSelectedApplicant(cand);
                          setApplicantResults([]);
                        }}
                        className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs"
                      >
                        <div className="font-semibold text-slate-800">{cand.fullName}</div>
                        <div className="text-slate-500">
                          {cand.applicantNumber} • {cand.phone} {cand.passportNumber ? `• Pass: ${cand.passportNumber}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Job Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Job Vacancy <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              {jobsList.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.jobCode}) — {j.employer?.companyName} [{j.vacancies} vacancies]
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Application Priority
            </label>
            <select
              value={createPriority}
              onChange={(e) => setCreatePriority(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent (Fast-track)</option>
            </select>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Internal Case Notes
            </label>
            <textarea
              value={createNotes}
              onChange={(e) => setCreateNotes(e.target.value)}
              placeholder="Initial screening remarks, referral origin, or remarks..."
              rows={3}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !selectedApplicant || !selectedJobId}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isCreating ? 'Registering...' : 'Register Application'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Advance Stage Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Transition Recruitment Stage"
        description={selectedApp ? `Application: ${selectedApp.applicationNumber} — ${selectedApp.applicant.fullName}` : ''}
        maxWidth="md"
      >
        <div className="space-y-4">
          {statusError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              <p className="font-semibold">{statusError}</p>
              {statusError.includes('quota') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(true)}
                  className="mt-2 text-rose-700 border-rose-300 hover:bg-rose-100 text-xs"
                >
                  Force Manager Override
                </Button>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Target Pipeline Stage <span className="text-rose-500">*</span>
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Stage Transition Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Reason or feedback for moving to this stage..."
              rows={3}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleStatusChange(false)}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              Confirm Transition
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Status Modal */}
      <Modal
        isOpen={isBulkStatusModalOpen}
        onClose={() => setIsBulkStatusModalOpen(false)}
        title="Bulk Stage Transition"
        description={`Advance all ${selectedIds.length} selected applications simultaneously.`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Target Stage for {selectedIds.length} Applicants
            </label>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">Select Stage...</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsBulkStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkStatusChange}
              disabled={!bulkStatus}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              Apply to Selected
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
