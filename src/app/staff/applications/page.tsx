'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Search,
  Plus,
  Filter,
  Layers,
  ChevronRight,
  UserCheck,
  Building2,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRightCircle,
  UserPlus,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/context/language-context';

export interface ApplicationItem {
  id: string;
  applicationCode: string;
  applicationNumber: string;
  applicantId: string;
  jobId: string;
  currentStatus: string;
  status: string;
  priority: string;
  source?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  matchingSnapshot?: any;
  createdAt: string;
  appliedAt: string;
  applicant?: {
    id: string;
    applicantNumber: string;
    fullName: string;
    fullNameBn?: string;
    phone: string;
    email: string | null;
    passportNumber: string | null;
    profilePhoto: string | null;
    skills?: string | null;
    candidateType?: string;
  } | null;
  job?: {
    id: string;
    jobCode: string;
    title: string;
    titleLocal?: string;
    vacancies?: number;
    remainingVacancies?: number;
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    employer?: { id: string; companyName: string; verificationStatus?: string } | null;
    country?: { id: string; name: string; flag?: string; code?: string } | null;
  } | null;
  employer?: { id: string; companyName: string; verificationStatus?: string } | null;
  country?: { id: string; name: string; flag?: string; code?: string } | null;
  assignedTo?: { id: string; name: string; email: string } | null;
}

export default function StaffApplicationsPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [pipelineCounts, setPipelineCounts] = useState<Record<string, number>>({
    ALL: 0,
    APPLIED: 0,
    SCREENING: 0,
    SHORTLISTED: 0,
    INTERVIEW: 0,
    SELECTED: 0,
    REJECTED: 0,
    WITHDRAWN: 0,
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Start Application modal state
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [candidatesList, setCandidatesList] = useState<any[]>([]);
  const [jobsList, setJobsList] = useState<any[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [startNotes, setStartNotes] = useState('');
  const [startError, setStartError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());

      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (activeTab !== 'ALL') params.set('status', activeTab);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      if (assignedToMe) params.set('assignedToMe', 'true');

      const res = await fetch(`/api/applications?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setApplications(data.data.items || []);
        if (data.data.pipelineCounts) {
          setPipelineCounts(data.data.pipelineCounts);
        }
        if (data.data.pagination) {
          setPagination(data.data.pagination);
        }
      }
    } catch (err) {
      console.error('Error loading applications:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, activeTab, priorityFilter, assignedToMe]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const loadDropdownData = async () => {
    try {
      const [candidatesRes, jobsRes] = await Promise.all([
        fetch('/api/applicants?limit=50'),
        fetch('/api/jobs?limit=50'),
      ]);
      const [candData, jobsData] = await Promise.all([candidatesRes.json(), jobsRes.json()]);

      if (candData.success) {
        setCandidatesList(candData.data?.items || candData.data || []);
      }
      if (jobsData.success) {
        setJobsList(jobsData.data?.items || jobsData.data || []);
      }
    } catch (e) {
      console.error('Error loading candidates/jobs for modal:', e);
    }
  };

  const handleOpenStartModal = () => {
    setIsStartModalOpen(true);
    setStartError(null);
    loadDropdownData();
  };

  const handleStartApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateId || !selectedJobId) {
      setStartError('Please select both a candidate and an open job demand.');
      return;
    }

    try {
      setIsSubmitting(true);
      setStartError(null);

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: selectedCandidateId,
          jobId: selectedJobId,
          source: 'STAFF_CREATED',
          appliedStage: 'APPLIED',
          internalNotes: startNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create application');
      }

      setIsStartModalOpen(false);
      setSelectedCandidateId('');
      setSelectedJobId('');
      setStartNotes('');
      fetchApplications();
      router.push(`/staff/applications/${data.data.id}`);
    } catch (err: any) {
      setStartError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'APPLIED':
      case 'SUBMITTED':
      case 'NEW':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">আবেদন জমা (Applied)</Badge>;
      case 'SCREENING':
      case 'UNDER_REVIEW':
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">বাছাই চলছে (Screening)</Badge>;
      case 'SHORTLISTED':
        return <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">শর্টলিস্টেড (Shortlisted)</Badge>;
      case 'INTERVIEW_SCHEDULED':
      case 'INTERVIEW':
        return <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">ইন্টারভিউ নির্ধারিত (Interview)</Badge>;
      case 'INTERVIEWED':
      case 'INTERVIEW_PASSED':
        return <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 border-cyan-200">ইন্টারভিউ সম্পন্ন (Interviewed)</Badge>;
      case 'SELECTED':
      case 'OFFER_ACCEPTED':
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold">নির্বাচিত (Selected)</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" className="bg-rose-50 text-rose-700 border-rose-200">প্রত্যাখ্যাত (Rejected)</Badge>;
      case 'WITHDRAWN':
        return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-300">প্রত্যাহার (Withdrawn)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              RL-1892 Recruitment ERP
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Applications & Recruitment Pipeline (নিয়োগ পাইপলাইন)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            প্রার্থীদের চাকরি আবেদন, বাছাই যাচাই, শর্টলিস্টিং, ইন্টারভিউ ও চূড়ান্ত নির্বাচন ব্যবস্থাপনা।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchApplications()}
            className="text-slate-600"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleOpenStartModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Start Application (নতুন আবেদন)
          </Button>
        </div>
      </div>

      {/* Recruitment Visual Funnel */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Live Recruitment Funnel (লাইভ রিক্রুটমেন্ট ফানেল)
          </h2>
          <span className="text-xs text-slate-400 font-medium">Total: {pipelineCounts.ALL || 0} applications</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {/* Step 1: Applied */}
          <button
            onClick={() => { setActiveTab('APPLIED'); setPagination((p) => ({ ...p, page: 1 })); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === 'APPLIED' ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20' : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">1. Applied</div>
            <div className="text-xl sm:text-2xl font-black text-blue-700 mt-1">{pipelineCounts.APPLIED || 0}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">নতুন আবেদন জমা</div>
          </button>

          {/* Step 2: Screening */}
          <button
            onClick={() => { setActiveTab('SCREENING'); setPagination((p) => ({ ...p, page: 1 })); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === 'SCREENING' ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20' : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">2. Screening</div>
            <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1">{pipelineCounts.SCREENING || 0}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">বাছাই যাচাই চলছে</div>
          </button>

          {/* Step 3: Shortlisted */}
          <button
            onClick={() => { setActiveTab('SHORTLISTED'); setPagination((p) => ({ ...p, page: 1 })); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === 'SHORTLISTED' ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20' : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">3. Shortlisted</div>
            <div className="text-xl sm:text-2xl font-black text-purple-700 mt-1">{pipelineCounts.SHORTLISTED || 0}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">ইন্টারভিউ উপযোগী</div>
          </button>

          {/* Step 4: Interview */}
          <button
            onClick={() => { setActiveTab('INTERVIEW'); setPagination((p) => ({ ...p, page: 1 })); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === 'INTERVIEW' ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20' : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">4. Interview</div>
            <div className="text-xl sm:text-2xl font-black text-indigo-700 mt-1">{pipelineCounts.INTERVIEW || 0}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">সাক্ষাৎকার পর্যায়</div>
          </button>

          {/* Step 5: Selected */}
          <button
            onClick={() => { setActiveTab('SELECTED'); setPagination((p) => ({ ...p, page: 1 })); }}
            className={`p-3 rounded-xl border text-left transition-all col-span-2 sm:col-span-1 ${
              activeTab === 'SELECTED' ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20' : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
            }`}
          >
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">5. Selected ✓</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{pipelineCounts.SELECTED || 0}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">চূড়ান্ত নির্বাচিত (Phase 6)</div>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, job code, employer, code..."
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">🔴 Urgent</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">⚪ Low</option>
            </select>

            {/* My Applications toggle */}
            <button
              onClick={() => setAssignedToMe(!assignedToMe)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors ${
                assignedToMe
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              My Applications
            </button>
          </div>
        </div>

        {/* Pipeline Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 text-xs scrollbar-none">
          {[
            { key: 'ALL', label: 'All Cases', count: pipelineCounts.ALL },
            { key: 'APPLIED', label: 'Applied', count: pipelineCounts.APPLIED },
            { key: 'SCREENING', label: 'Screening', count: pipelineCounts.SCREENING },
            { key: 'SHORTLISTED', label: 'Shortlisted', count: pipelineCounts.SHORTLISTED },
            { key: 'INTERVIEW', label: 'Interview', count: pipelineCounts.INTERVIEW },
            { key: 'SELECTED', label: 'Selected', count: pipelineCounts.SELECTED },
            { key: 'REJECTED', label: 'Rejected', count: pipelineCounts.REJECTED },
            { key: 'WITHDRAWN', label: 'Withdrawn', count: pipelineCounts.WITHDRAWN },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === tab.key ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading recruitment applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="py-20 text-center px-4">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">কোনো আবেদন পাওয়া যায়নি (No Applications Found)</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              নির্বাচিত ফিল্টারে কোনো রিক্রুটমেন্ট কেস নেই। নতুন আবেদন শুরু করতে উপরের &quot;Start Application&quot; বোতামে ক্লিক করুন।
            </p>
            <Button
              size="sm"
              onClick={handleOpenStartModal}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Start Application
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Case / Code</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Job / Vacancy</th>
                  <th className="py-3 px-4">Match</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Recruiter</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => {
                  const match = app.matchingSnapshot;
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        <Link
                          href={`/staff/applications/${app.id}`}
                          className="hover:text-indigo-600 flex items-center gap-1"
                        >
                          {app.applicationCode || app.applicationNumber}
                          <ArrowUpRight className="w-3 h-3 text-slate-400" />
                        </Link>
                        {app.priority === 'URGENT' && (
                          <span className="text-[10px] text-rose-600 font-bold block">URGENT</span>
                        )}
                      </td>

                      {/* Candidate */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{app.applicant?.fullName || 'N/A'}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span>{app.applicant?.applicantNumber}</span>
                          <span>•</span>
                          <span>{app.applicant?.phone}</span>
                        </div>
                      </td>

                      {/* Job & Employer */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 truncate">
                          {app.job?.title || 'Open Demand'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <span>{app.job?.country?.name || app.country?.name || 'Overseas'}</span>
                          <span>•</span>
                          <span className="truncate">{app.job?.employer?.companyName || app.employer?.companyName || 'Verified Employer'}</span>
                        </div>
                      </td>

                      {/* Match Score */}
                      <td className="py-3 px-4">
                        {match && typeof match.score === 'number' ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              match.score >= 80
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : match.score >= 60
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            {match.score}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(app.status || app.currentStatus)}
                      </td>

                      {/* Recruiter */}
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {app.assignedTo?.name ? (
                          <span className="font-medium text-slate-800">{app.assignedTo.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Applied Date */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-7 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-medium"
                        >
                          <Link href={`/staff/applications/${app.id}`}>
                            Case 360° →
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing Page <span className="font-bold">{pagination.page}</span> of <span className="font-bold">{pagination.totalPages}</span> ({pagination.total} total)
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="h-7 px-2.5 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="h-7 px-2.5 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Start New Application Modal */}
      <Modal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        title="Start Application on Behalf of Candidate (প্রার্থীর হয়ে আবেদন শুরু করুন)"
        maxWidth="lg"
      >
        <form onSubmit={handleStartApplication} className="space-y-4">
          {startError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{startError}</span>
            </div>
          )}

          {/* Select Candidate */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Candidate (প্রার্থী নির্বাচন করুন) *
            </label>
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              required
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Candidate --</option>
              {candidatesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.applicantNumber} — {c.fullName} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Select Job */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Overseas Job Order (চাকরির চাহিদা নির্বাচন করুন) *
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              required
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Job Demand --</option>
              {jobsList.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.jobCode} — {j.title} ({j.country?.name || 'Overseas'} - {j.employer?.companyName || 'Verified Employer'})
                </option>
              ))}
            </select>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Recruiter Internal Notes (প্রাথমিক নোট)
            </label>
            <textarea
              value={startNotes}
              onChange={(e) => setStartNotes(e.target.value)}
              rows={3}
              placeholder="Candidate sourced via overseas trade evaluation test..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsStartModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              {isSubmitting ? 'Initiating...' : 'Start Recruitment Case'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
