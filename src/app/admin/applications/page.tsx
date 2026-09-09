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
  AlertTriangle,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRightCircle,
  UserPlus,
  Trash2,
  Globe,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/context/language-context';

export interface ApplicationItem {
  id: string;
  applicationNumber: string;
  applicationCode?: string;
  applicantId: string;
  jobId: string;
  currentStatus: string;
  status?: string;
  priority: string;
  source?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  createdAt: string;
  updatedAt?: string;
  applicant?: {
    id: string;
    applicantNumber: string;
    fullName: string;
    phone: string;
    email: string | null;
    passportNumber: string | null;
    profilePhoto: string | null;
    skills?: string | null;
  } | null;
  job?: {
    id: string;
    jobCode: string;
    title: string;
    vacancies?: number;
    salaryMin?: number | null;
    salaryMax?: number | null;
    currency?: string;
    employer?: { id: string; companyName: string } | null;
    country?: { id: string; name: string; flag: string | null; code: string } | null;
  } | null;
  employer?: { id: string; companyName: string } | null;
  country?: { id: string; name: string; flag: string | null; code: string } | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  _count?: {
    documents: number;
    interviews: number;
    statusHistory: number;
  };
}

const STAGES = [
  'SUBMITTED',
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
  'DEPLOYED',
  'REJECTED',
  'CANCELLED',
];

const STAGE_LABELS: Record<string, { en: string; bn: string }> = {
  SUBMITTED: { en: 'Applied', bn: 'আবেদন দাখিল' },
  APPLIED: { en: 'Applied', bn: 'আবেদন দাখিল' },
  SCREENING: { en: 'Screening', bn: 'প্রাথমিক যাচাই' },
  SHORTLISTED: { en: 'Shortlisted', bn: 'বাছাইকৃত' },
  INTERVIEW_SCHEDULED: { en: 'Interview Scheduled', bn: 'সাক্ষাৎকার নির্ধারিত' },
  INTERVIEW_PASSED: { en: 'Interview Passed', bn: 'সাক্ষাৎকারে উত্তীর্ণ' },
  SELECTED: { en: 'Selected', bn: 'চূড়ান্ত নির্বাচিত' },
  OFFER_LETTER_ISSUED: { en: 'Offer Letter Issued', bn: 'নিয়োগপত্র প্রদান' },
  CONTRACT_SIGNED: { en: 'Contract Signed', bn: 'চুক্তি স্বাক্ষরিত' },
  MEDICAL_PASSED: { en: 'Medical Passed', bn: 'মেডিকেল উত্তীর্ণ' },
  VISA_SUBMITTED: { en: 'Visa Submitted', bn: 'ভিসা দাখিলকৃত' },
  VISA_STAMPED: { en: 'Visa Stamped', bn: 'ভিসা অনুমোদিত' },
  TICKET_CONFIRMED: { en: 'Ticket Confirmed', bn: 'টিকেট নিশ্চিত' },
  RECRUITMENT_COMPLETED: { en: 'Completed', bn: 'সম্পন্ন' },
  DEPLOYED: { en: 'Deployed', bn: 'ফ্লাইট সম্পন্ন' },
  REJECTED: { en: 'Rejected', bn: 'বাতিলকৃত' },
  CANCELLED: { en: 'Cancelled', bn: 'স্থগিত' },
};

const STAGE_COLORS: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'error' | 'gold' | 'navy'> = {
  SUBMITTED: 'neutral',
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
  DEPLOYED: 'success',
  REJECTED: 'error',
  CANCELLED: 'neutral',
};

export default function ApplicationsPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters & search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [employerFilter, setEmployerFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Dropdown lists
  const [countriesList, setCountriesList] = useState<{ id: string; name: string; flag?: string | null }[]>([]);
  const [employersList, setEmployersList] = useState<{ id: string; companyName: string }[]>([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<ApplicationItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create Application modal states
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
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Load dropdown lists on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const [countriesRes, employersRes] = await Promise.all([
          fetch('/api/countries'),
          fetch('/api/employers?limit=100'),
        ]);
        const countriesData = await countriesRes.json();
        if (countriesData.success) {
          setCountriesList(countriesData.data || []);
        }
        const employersData = await employersRes.json();
        if (employersData.success && employersData.data?.items) {
          setEmployersList(employersData.data.items || []);
        }
      } catch (e) {
        console.error('Failed to load filter metadata', e);
      }
    }
    loadMeta();
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (search.trim()) query.set('search', search.trim());
      if (statusFilter !== 'ALL') query.set('status', statusFilter);
      if (countryFilter !== 'ALL') query.set('countryId', countryFilter);
      if (employerFilter !== 'ALL') query.set('employerId', employerFilter);
      if (priorityFilter !== 'ALL') query.set('priority', priorityFilter);

      const res = await fetch(`/api/applications?${query.toString()}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setApplications(data.data.items || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalCount(data.data.pagination?.total || 0);
      } else {
        throw new Error(data.error || 'Failed to fetch applications');
      }
    } catch (err: any) {
      console.error('Failed to load applications', err);
      setFetchError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, countryFilter, employerFilter, priorityFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Load jobs when create modal opens
  const openCreateModal = async () => {
    setIsCreateModalOpen(true);
    setCreateError(null);
    setSelectedApplicant(null);
    setApplicantSearch('');
    setApplicantResults([]);
    try {
      const res = await fetch('/api/jobs?limit=100');
      const data = await res.json();
      if (data.success) {
        const items = data.data.items || [];
        setJobsList(items);
        if (items.length > 0) {
          setSelectedJobId(items[0].id);
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
        setApplicantResults(data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to search applicants', err);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) {
      setCreateError(t('অনুগ্রহ করে একজন প্রার্থী নির্বাচন করুন', 'Please select a candidate'));
      return;
    }
    if (!selectedJobId) {
      setCreateError(t('অনুগ্রহ করে একটি চাকরির পদ নির্বাচন করুন', 'Please select a job vacancy'));
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
          notes: createNotes,
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
        setCreateError(data.error || t('আবেদন তৈরি ব্যর্থ হয়েছে', 'Failed to create application'));
      }
    } catch (err: any) {
      setCreateError(err.message || t('আবেদন তৈরিতে সমস্যা দেখা দিয়েছে', 'Error creating application'));
    } finally {
      setIsCreating(false);
    }
  };

  const openStatusModal = (app: ApplicationItem) => {
    setSelectedApp(app);
    setNewStatus(app.currentStatus || app.status || 'SUBMITTED');
    setStatusNotes('');
    setStatusError(null);
    setIsStatusModalOpen(true);
  };

  const handleStatusChange = async (forceOverride = false) => {
    if (!selectedApp || !newStatus) return;
    setStatusError(null);
    setIsUpdatingStatus(true);

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
        setStatusError(data.error || t('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে', 'Failed to update status'));
      }
    } catch (err: any) {
      setStatusError(err.message || t('স্ট্যাটাস আপডেটে সমস্যা দেখা দিয়েছে', 'Error updating status'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedIds.length === 0 || !bulkStatus) return;
    setIsBulkUpdating(true);

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
        setBulkStatus('');
        fetchApplications();
      }
    } catch (err) {
      console.error('Bulk update error', err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const openDeleteModal = (app: ApplicationItem) => {
    setAppToDelete(app);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteApplication = async () => {
    if (!appToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/applications/${appToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleteModalOpen(false);
        setAppToDelete(null);
        fetchApplications();
      } else {
        setDeleteError(data.error || t('আবেদন ডিলিট করা যায়নি', 'Failed to delete application'));
      }
    } catch (err: any) {
      setDeleteError(err.message || t('আবেদন ডিলিট করতে সমস্যা হয়েছে', 'Error deleting application'));
    } finally {
      setIsDeleting(false);
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

  // Safe extractors
  const getAppNumber = (app: ApplicationItem) =>
    app.applicationNumber || app.applicationCode || app.id.substring(0, 8);

  const getApplicantName = (app: ApplicationItem) =>
    app.applicant?.fullName || t('আবেদনকারীর তথ্য পাওয়া যায়নি', 'Applicant unavailable');

  const getApplicantInitials = (app: ApplicationItem) => {
    const name = app.applicant?.fullName;
    if (!name || !name.trim()) return 'NA';
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  };

  const getJobTitle = (app: ApplicationItem) =>
    app.job?.title || t('চাকরির তথ্য পাওয়া যায়নি', 'Job information unavailable');

  const getEmployer = (app: ApplicationItem) =>
    app.job?.employer || app.employer || null;

  const getCountry = (app: ApplicationItem) =>
    app.job?.country || app.country || null;

  // Calculated metrics
  const missingEmployerCount = applications.filter((a) => !getEmployer(a)).length;
  const screeningCount = applications.filter(
    (a) => a.currentStatus === 'SCREENING' || a.currentStatus === 'SUBMITTED' || a.currentStatus === 'APPLIED'
  ).length;
  const selectedCount = applications.filter((a) => a.currentStatus === 'SELECTED').length;
  const completedCount = applications.filter(
    (a) => a.currentStatus === 'RECRUITMENT_COMPLETED' || a.currentStatus === 'DEPLOYED'
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary-600" />
            {t('আবেদন ব্যবস্থাপনা', 'Candidate Applications')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t(
              'নিয়োগ প্রক্রিয়ার প্রতিটি পর্যায় পর্যবেক্ষণ ও পরিচালনা করুন।',
              'Recruitment pipeline stage progression tracking from initial application to deployment.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link href="/admin/applications/pipeline">
            <Button variant="outline" className="flex items-center gap-2 border-slate-300 text-xs sm:text-sm">
              <Layers className="w-4 h-4 text-slate-600" />
              {t('পাইপলাইন ভিউ', 'Pipeline Board')}
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={fetchApplications}
            disabled={loading}
            className="flex items-center gap-1.5 border-slate-300 text-slate-700 text-xs sm:text-sm"
            title={t('পুনরায় লোড করুন', 'Refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-600' : 'text-slate-600'}`} />
            <span className="hidden sm:inline">{t('রিফ্রেশ', 'Refresh')}</span>
          </Button>

          <a href="/api/applications/export" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="flex items-center gap-2 border-slate-300 text-xs sm:text-sm">
              <Download className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">{t('এক্সপোর্ট', 'Export CSV')}</span>
            </Button>
          </a>

          <Button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            {t('নতুন আবেদন', 'New Application')}
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            {t('মোট সক্রিয়', 'Total Active')}
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-sky-600 tracking-wider">
            {t('প্রাথমিক যাচাই', 'Screening')}
          </p>
          <p className="text-2xl font-bold text-sky-700 mt-1">{screeningCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-amber-600 tracking-wider">
            {t('চূড়ান্ত নির্বাচিত', 'Selected')}
          </p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{selectedCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-emerald-600 tracking-wider">
            {t('সম্পন্ন / ফ্লাইট', 'Completed')}
          </p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{completedCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase text-rose-600 tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t('তথ্য অসম্পূর্ণ', 'Data Issues')}
            </p>
            {missingEmployerCount > 0 && (
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </div>
          <p className={`text-2xl font-bold mt-1 ${missingEmployerCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {missingEmployerCount}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Global Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder={t('প্রার্থী, আইডি, পাসপোর্ট, পদ বা কোম্পানি খুঁজুন...', 'Search candidate, ID, passport, job, employer...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-slate-50 border-slate-200 text-sm"
            />
          </div>

          {/* Stage Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="ALL">{t('সকল পর্যায়', 'All Stages')}</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {language === 'bn' ? STAGE_LABELS[s]?.bn || s : STAGE_LABELS[s]?.en || s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Country Filter */}
          <div className="md:col-span-2">
            <select
              value={countryFilter}
              onChange={(e) => {
                setCountryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="ALL">{t('সকল দেশ', 'All Countries')}</option>
              {countriesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.flag ? `${c.flag} ` : ''}{c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employer Filter */}
          <div className="md:col-span-2">
            <select
              value={employerFilter}
              onChange={(e) => {
                setEmployerFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="ALL">{t('সকল নিয়োগকর্তা', 'All Employers')}</option>
              <option value="UNASSIGNED" className="text-amber-700 font-medium">
                ⚠️ {t('নিয়োগকর্তা নির্ধারিত নয়', 'Unassigned Employer')}
              </option>
              {employersList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="md:col-span-2 flex items-center gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="ALL">{t('সকল অগ্রাধিকার', 'All Priorities')}</option>
              <option value="LOW">{t('কম (Low)', 'Low')}</option>
              <option value="NORMAL">{t('সাধারণ (Normal)', 'Normal')}</option>
              <option value="HIGH">{t('উচ্চ (High)', 'High')}</option>
              <option value="URGENT">{t('জরুরি (Urgent)', 'Urgent')}</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setCountryFilter('ALL');
                setEmployerFilter('ALL');
                setPriorityFilter('ALL');
                setPage(1);
              }}
              className="text-slate-600 text-xs px-2.5"
              title={t('ফিল্টার রিসেট করুন', 'Reset Filters')}
            >
              {t('রিসেট', 'Reset')}
            </Button>
          </div>
        </div>

        {/* Bulk action toolbar if rows selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm text-primary-900 font-medium">
              <CheckCircle2 className="w-4 h-4 text-primary-600" />
              <span>
                {selectedIds.length} {t('টি আবেদন নির্বাচিত', 'applications selected')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsBulkStatusModalOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white text-xs"
              >
                {t('পর্যায় পরিবর্তন', 'Advance Status')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedIds([])}
                className="text-xs text-slate-600 bg-white"
              >
                {t('সব বাতিল', 'Deselect All')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {fetchError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">{t('তথ্য লোড করতে ব্যর্থ', 'Failed to load applications')}</p>
              <p className="text-xs text-rose-600 mt-0.5">{fetchError}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchApplications}
            className="border-rose-300 text-rose-700 hover:bg-rose-100 text-xs"
          >
            {t('পুনরায় চেষ্টা করুন', 'Retry')}
          </Button>
        </div>
      )}

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === applications.length && applications.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                  />
                </th>
                <th className="py-3.5 px-4">{t('আবেদন নং ও তারিখ', 'Application ID')}</th>
                <th className="py-3.5 px-4">{t('প্রার্থী', 'Candidate')}</th>
                <th className="py-3.5 px-4">{t('পদের নাম ও কোড', 'Job Title & Code')}</th>
                <th className="py-3.5 px-4">{t('নিয়োগকারী প্রতিষ্ঠান', 'Employer')}</th>
                <th className="py-3.5 px-4">{t('গন্তব্য দেশ', 'Destination')}</th>
                <th className="py-3.5 px-4">{t('বর্তমান পর্যায়', 'Status / Stage')}</th>
                <th className="py-3.5 px-4">{t('অগ্রাধিকার', 'Priority')}</th>
                <th className="py-3.5 px-4">{t('দায়িত্বপ্রাপ্ত স্টাফ', 'Assigned To')}</th>
                <th className="py-3.5 px-4 text-right">{t('অ্যাকশন', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-primary-600" />
                    <p className="text-sm font-medium text-slate-600">{t('আবেদন তালিকা লোড হচ্ছে...', 'Loading applications...')}</p>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-base">
                      {t('কোনো আবেদন পাওয়া যায়নি', 'No applications found')}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {t(
                        'ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন অথবা নতুন আবেদন যোগ করুন।',
                        'Try adjusting your search criteria or create a new application record.'
                      )}
                    </p>
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const employer = getEmployer(app);
                  const country = getCountry(app);
                  const applicantName = getApplicantName(app);
                  const jobTitle = getJobTitle(app);
                  const appNumber = getAppNumber(app);
                  const isMissingEmployer = !employer;
                  const currentStageKey = app.currentStatus || app.status || 'SUBMITTED';

                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isMissingEmployer ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(app.id)}
                          onChange={() => toggleSelect(app.id)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                        />
                      </td>

                      {/* 1. Application ID & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 font-mono text-xs">
                          {appNumber}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(app.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* 2. Applicant Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs overflow-hidden shrink-0 border border-slate-300">
                            {app.applicant?.profilePhoto ? (
                              <img
                                src={app.applicant.profilePhoto}
                                alt={applicantName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getApplicantInitials(app)
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 hover:text-primary-600 transition-colors line-clamp-1">
                              {applicantName}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>ID: {app.applicant?.applicantNumber || '—'}</span>
                              {app.applicant?.passportNumber && (
                                <span className="text-slate-400">• Pass: {app.applicant.passportNumber}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Job Title & Code */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 line-clamp-1">{jobTitle}</div>
                        {app.job?.jobCode && (
                          <div className="text-xs font-mono text-slate-400 mt-0.5">
                            {app.job.jobCode}
                          </div>
                        )}
                      </td>

                      {/* 4. Employer with Data Quality Badge */}
                      <td className="py-3.5 px-4">
                        {employer ? (
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="line-clamp-1">{employer.companyName}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{t('নিয়োগকর্তা নির্ধারিত নয়', 'Employer not assigned')}</span>
                          </div>
                        )}
                      </td>

                      {/* 5. Destination Country */}
                      <td className="py-3.5 px-4">
                        {country ? (
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                            {country.flag && <span className="text-sm">{country.flag}</span>}
                            <span>{country.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {t('দেশ নির্ধারিত নয়', 'Country not assigned')}
                          </span>
                        )}
                      </td>

                      {/* 6. Current Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={STAGE_COLORS[currentStageKey] || 'neutral'}>
                          {language === 'bn'
                            ? STAGE_LABELS[currentStageKey]?.bn || currentStageKey
                            : STAGE_LABELS[currentStageKey]?.en || currentStageKey.replace(/_/g, ' ')}
                        </Badge>
                      </td>

                      {/* 7. Priority */}
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

                      {/* 8. Assigned Staff */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {app.assignedTo ? (
                          <span className="font-medium text-slate-800">{app.assignedTo.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">{t('অনির্ধারিত', 'Unassigned')}</span>
                        )}
                      </td>

                      {/* 9. Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openStatusModal(app)}
                            title={t('পর্যায় পরিবর্তন করুন', 'Advance Status')}
                            className="h-8 px-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                          >
                            <ArrowRightCircle className="w-4 h-4" />
                          </Button>

                          <Link href={`/admin/applications/${app.id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              title={t('বিস্তারিত প্রোফাইল দেখুন', 'View 360 Details')}
                              className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteModal(app)}
                            title={t('আবেদন বাতিল / ডিলিট', 'Delete Application')}
                            className="h-8 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination and Page Size */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              {t(
                `মোট ${totalCount} টি রেকর্ডের মধ্যে পৃষ্ঠা ${page} (মোট ${totalPages} পৃষ্ঠা)`,
                `Showing Page ${page} of ${totalPages} (${totalCount} total)`
              )}
            </span>
            <div className="flex items-center gap-1.5">
              <span>{t('প্রতি পৃষ্ঠায়:', 'Show:')}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-slate-200 rounded px-2 py-0.5 text-xs bg-slate-50"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs"
            >
              {t('পূর্ববর্তী', 'Previous')}
            </Button>
            <span className="px-2 font-medium text-slate-700">{page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs"
            >
              {t('পরবর্তী', 'Next')}
            </Button>
          </div>
        </div>
      </div>

      {/* New Application Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('নতুন প্রার্থী আবেদন নিবন্ধন', 'Create Candidate Application')}
        description={t(
          'একজন প্রার্থীকে উন্মুক্ত বৈদেশিক কর্মসংস্থান চাহিদার সাথে সংযুক্ত করুন।',
          'Attach an applicant to an open overseas job vacancy.'
        )}
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
              {t('প্রার্থী নির্বাচন', 'Select Candidate')} <span className="text-rose-500">*</span>
            </label>
            {selectedApplicant ? (
              <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-primary-900">{selectedApplicant.fullName}</div>
                  <div className="text-xs text-primary-700 mt-0.5">
                    ID: {selectedApplicant.applicantNumber} • Phone: {selectedApplicant.phone}{' '}
                    {selectedApplicant.passportNumber ? `• Pass: ${selectedApplicant.passportNumber}` : ''}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedApplicant(null)}
                  className="text-xs text-rose-600 hover:text-rose-700"
                >
                  {t('পরিবর্তন', 'Change')}
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder={t('নাম, ফোন বা পাসপোর্ট নম্বর দিয়ে খুঁজুন...', 'Type name, phone or passport to find candidate...')}
                  value={applicantSearch}
                  onChange={(e) => handleSearchApplicants(e.target.value)}
                  className="pl-9 text-sm"
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
                        <div className="text-slate-500 mt-0.5">
                          {cand.applicantNumber} • {cand.phone}{' '}
                          {cand.passportNumber ? `• Pass: ${cand.passportNumber}` : ''}
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
              {t('চাকরির পদ ও নিয়োগকারী', 'Job Vacancy')} <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              {jobsList.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.jobCode}) — {j.employer?.companyName || t('নিয়োগকর্তা নির্ধারিত নয়', 'Employer not assigned')} [{j.vacancyCount || j.vacancies || 1} vacancies]
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {t('আবেদনের অগ্রাধিকার', 'Application Priority')}
            </label>
            <select
              value={createPriority}
              onChange={(e) => setCreatePriority(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="LOW">{t('কম (Low)', 'Low')}</option>
              <option value="NORMAL">{t('সাধারণ (Normal)', 'Normal')}</option>
              <option value="HIGH">{t('উচ্চ (High)', 'High')}</option>
              <option value="URGENT">{t('জরুরি (Urgent - Fast Track)', 'Urgent (Fast-track)')}</option>
            </select>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {t('অভ্যন্তরীণ নোট / মন্তব্য', 'Internal Case Notes')}
            </label>
            <textarea
              value={createNotes}
              onChange={(e) => setCreateNotes(e.target.value)}
              placeholder={t('রেফারেন্স, প্রাথমিক মন্তব্য বা বিশেষ নির্দেশনা...', 'Initial screening remarks, referral origin, or special instructions...')}
              rows={3}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              {t('বাতিল', 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !selectedApplicant || !selectedJobId}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isCreating
                ? t('নিবন্ধন হচ্ছে...', 'Registering...')
                : t('আবেদন নিবন্ধন করুন', 'Register Application')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Advance Stage Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={t('নিয়োগ পর্যায় পরিবর্তন', 'Transition Recruitment Stage')}
        description={
          selectedApp
            ? `${t('আবেদন', 'Application')}: ${getAppNumber(selectedApp)} — ${getApplicantName(selectedApp)}`
            : ''
        }
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
                  {t('ম্যানেজার ওভাররাইড দিয়ে অনুমোদন করুন', 'Force Manager Override')}
                </Button>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {t('পরবর্তী পর্যায়', 'Target Pipeline Stage')} <span className="text-rose-500">*</span>
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {language === 'bn' ? STAGE_LABELS[s]?.bn || s : STAGE_LABELS[s]?.en || s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {t('পর্যায় পরিবর্তনের বিবরণ / কারণ', 'Stage Transition Notes')} <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder={t('এই পর্যায়ে প্রেরণের যৌক্তিকতা বা ফলাফল...', 'Reason or feedback for moving to this stage...')}
              rows={3}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              {t('বাতিল', 'Cancel')}
            </Button>
            <Button
              onClick={() => handleStatusChange(false)}
              disabled={isUpdatingStatus}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isUpdatingStatus
                ? t('আপডেট হচ্ছে...', 'Updating...')
                : t('নিশ্চিত করুন', 'Confirm Transition')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Status Modal */}
      <Modal
        isOpen={isBulkStatusModalOpen}
        onClose={() => setIsBulkStatusModalOpen(false)}
        title={t('একযোগে পর্যায় পরিবর্তন', 'Bulk Stage Transition')}
        description={t(
          `নির্বাচিত ${selectedIds.length} টি আবেদনের পর্যায় একসাথে পরিবর্তন করুন।`,
          `Advance all ${selectedIds.length} selected applications simultaneously.`
        )}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {t('নতুন পর্যায় নির্বাচন করুন', 'Target Stage')}
            </label>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">{t('পর্যায় নির্বাচন করুন...', 'Select Stage...')}</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {language === 'bn' ? STAGE_LABELS[s]?.bn || s : STAGE_LABELS[s]?.en || s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsBulkStatusModalOpen(false)}>
              {t('বাতিল', 'Cancel')}
            </Button>
            <Button
              onClick={handleBulkStatusChange}
              disabled={!bulkStatus || isBulkUpdating}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isBulkUpdating
                ? t('প্রক্রিয়াধীন...', 'Applying...')
                : t('প্রয়োগ করুন', 'Apply to Selected')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('আবেদন ডিলিট নিশ্চিতকরণ', 'Confirm Application Deletion')}
        description={
          appToDelete
            ? `${t('আবেদন নং', 'Application')}: ${getAppNumber(appToDelete)}`
            : ''
        }
        maxWidth="sm"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {deleteError}
            </div>
          )}

          <p className="text-xs text-slate-600">
            {t(
              'আপনি কি নিশ্চিত যে এই আবেদনটি ডিলিট করতে চান? লিংক করা ইনভয়েস থাকলে ডিলিট করা সম্ভব হবে না।',
              'Are you sure you want to delete this application record? Applications with active invoices cannot be deleted.'
            )}
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              {t('বাতিল', 'Cancel')}
            </Button>
            <Button
              onClick={handleDeleteApplication}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? t('ডিলিট হচ্ছে...', 'Deleting...') : t('ডিলিট করুন', 'Delete Application')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
