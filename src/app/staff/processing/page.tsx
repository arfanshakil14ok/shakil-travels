'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  Filter,
  FileCheck2,
  HeartPulse,
  Stamp,
  Plane,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  RefreshCw,
  User,
  Building2,
  Calendar,
  AlertCircle,
  PauseCircle,
  XCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const STAGE_LABELS: Record<string, { label: string; labelBn: string; color: string }> = {
  SELECTED: { label: 'Selected', labelBn: 'নির্বাচিত', color: 'bg-slate-100 text-slate-800' },
  DOCUMENT_PROCESSING: { label: 'Doc Collection', labelBn: 'কাগজপত্র সংগ্রহ', color: 'bg-amber-100 text-amber-800' },
  DOCUMENT_VERIFICATION: { label: 'Doc Verification', labelBn: 'কাগজপত্র যাচাই', color: 'bg-blue-100 text-blue-800' },
  MEDICAL_PENDING: { label: 'Medical Pending', labelBn: 'মেডিকেল বাকি', color: 'bg-yellow-100 text-yellow-800' },
  MEDICAL_SCHEDULED: { label: 'Medical Scheduled', labelBn: 'মেডিকেল নির্ধারিত', color: 'bg-cyan-100 text-cyan-800' },
  MEDICAL_COMPLETED: { label: 'Medical Done', labelBn: 'মেডিকেল সম্পন্ন', color: 'bg-teal-100 text-teal-800' },
  MEDICAL_PASSED: { label: 'Medical Fit', labelBn: 'মেডিকেল উত্তীর্ণ', color: 'bg-emerald-100 text-emerald-800' },
  MEDICAL_FAILED: { label: 'Medical Unfit', labelBn: 'মেডিকেল অনুত্তীর্ণ', color: 'bg-rose-100 text-rose-800' },
  VISA_PREPARATION: { label: 'Visa File Prep', labelBn: 'ভিসা ফাইল প্রস্তুত', color: 'bg-indigo-100 text-indigo-800' },
  VISA_SUBMITTED: { label: 'Visa Submitted', labelBn: 'ভিসা জমা দেওয়া', color: 'bg-purple-100 text-purple-800' },
  VISA_PROCESSING: { label: 'Visa In Embassy', labelBn: 'ভিসা প্রসেসিং', color: 'bg-violet-100 text-violet-800' },
  VISA_APPROVED: { label: 'Visa Approved', labelBn: 'ভিসা অনুমোদিত', color: 'bg-green-100 text-green-800' },
  VISA_REJECTED: { label: 'Visa Rejected', labelBn: 'ভিসা বাতিল', color: 'bg-rose-100 text-rose-800' },
  CLEARANCE_PENDING: { label: 'Clearance Pending', labelBn: 'ছাড়পত্র বাকি', color: 'bg-orange-100 text-orange-800' },
  CLEARANCE_PROCESSING: { label: 'BMET Processing', labelBn: 'বিএমইটি প্রসেসিং', color: 'bg-amber-100 text-amber-800' },
  CLEARANCE_COMPLETED: { label: 'BMET Issued', labelBn: 'স্মার্ট কার্ড সম্পন্ন', color: 'bg-emerald-100 text-emerald-800' },
  TICKET_PENDING: { label: 'Ticket Pending', labelBn: 'টিকিট বাকি', color: 'bg-sky-100 text-sky-800' },
  TICKET_ISSUED: { label: 'Ticket Issued', labelBn: 'টিকিট ইস্যু', color: 'bg-blue-100 text-blue-800' },
  DEPARTURE_READY: { label: 'Departure Ready', labelBn: 'যাত্রার জন্য প্রস্তুত', color: 'bg-emerald-100 text-emerald-900 border border-emerald-300' },
  DEPARTED: { label: 'Departed', labelBn: 'ফ্লাইট প্রস্থান', color: 'bg-cyan-100 text-cyan-900 font-bold' },
  JOINED: { label: 'Joined Overseas', labelBn: 'কর্মস্থলে যোগদান', color: 'bg-emerald-100 text-emerald-900 font-bold' },
  COMPLETED: { label: 'Cycle Completed', labelBn: 'নিয়োগ সম্পন্ন', color: 'bg-purple-100 text-purple-900 font-bold' },
  ON_HOLD: { label: 'On Hold', labelBn: 'স্থগিত', color: 'bg-amber-200 text-amber-900' },
  CANCELLED: { label: 'Cancelled', labelBn: 'বাতিল', color: 'bg-slate-200 text-slate-700' },
};

export default function StaffProcessingDashboardPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [pipelineCounts, setPipelineCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [workQueue, setWorkQueue] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 15 });

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedStage) params.set('stage', selectedStage);
      if (selectedPriority) params.set('priority', selectedPriority);
      if (workQueue !== 'ALL') params.set('workQueue', workQueue);

      const res = await fetch(`/api/staff/processing?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch processing cases');
      }

      setCases(data.data.cases || []);
      setPagination(data.data.pagination || { total: 0, totalPages: 1, limit: 15 });
      if (data.data.pipelineCounts) {
        setPipelineCounts(data.data.pipelineCounts);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading cases');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedStage, selectedPriority, workQueue]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const totalActive =
    (pipelineCounts.TOTAL_ACTIVE as number) ||
    Object.entries(pipelineCounts)
      .filter(([k]) => !['TOTAL_ACTIVE', 'ON_HOLD', 'CANCELLED', 'COMPLETED'].includes(k))
      .reduce((acc, [, val]) => acc + (val as number), 0);

  const docCount = (pipelineCounts.DOCUMENT_PROCESSING || 0) + (pipelineCounts.DOCUMENT_VERIFICATION || 0);
  const medCount = (pipelineCounts.MEDICAL_PENDING || 0) + (pipelineCounts.MEDICAL_SCHEDULED || 0) + (pipelineCounts.MEDICAL_COMPLETED || 0) + (pipelineCounts.MEDICAL_PASSED || 0);
  const visaCount = (pipelineCounts.VISA_PREPARATION || 0) + (pipelineCounts.VISA_SUBMITTED || 0) + (pipelineCounts.VISA_PROCESSING || 0) + (pipelineCounts.VISA_APPROVED || 0);
  const clearanceCount = (pipelineCounts.CLEARANCE_PENDING || 0) + (pipelineCounts.CLEARANCE_PROCESSING || 0) + (pipelineCounts.CLEARANCE_COMPLETED || 0);
  const depCount = (pipelineCounts.DEPARTURE_READY || 0) + (pipelineCounts.DEPARTED || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Post-Selection Recruitment Processing
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                সিলেকশন পরবর্তী প্রক্রিয়া: ডকুমেন্ট, মেডিকেল (গামকা), ভিসা, বিএমইটি ও ফ্লাইট অপারেশন
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCases}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/staff/applications?status=SELECTED">
            <Button size="sm" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              Selected Applications ({pipelineCounts.SELECTED || 0}) →
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Funnel Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Active</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalActive}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active Processing Files</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-700 mb-1">
            <span>Documents</span>
            <FileCheck2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{docCount}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Collection & Verification</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-teal-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-teal-700 mb-1">
            <span>Medical</span>
            <HeartPulse className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-900">{medCount}</div>
          <div className="text-[10px] text-teal-600 mt-0.5">GAMCA Appointments</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-purple-700 mb-1">
            <span>Visa Stamping</span>
            <Stamp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900">{visaCount}</div>
          <div className="text-[10px] text-purple-600 mt-0.5">Embassy Processing</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
            <span>Clearance / BMET</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{clearanceCount}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Smart Card & Emigration</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-700 mb-1">
            <span>Deployment</span>
            <Plane className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{depCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Departure Ready / Flown</div>
        </div>
      </div>

      {/* Work Queue Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <Tabs value={workQueue} onValueChange={(v) => { setWorkQueue(v); setPage(1); }}>
          <TabsList className="bg-slate-100 p-1 rounded-lg flex flex-wrap gap-1">
            <TabsTrigger value="ALL" className="text-xs font-semibold">
              All Files ({totalActive})
            </TabsTrigger>
            <TabsTrigger value="DOCUMENTS" className="text-xs font-semibold">
              📄 Documents ({docCount})
            </TabsTrigger>
            <TabsTrigger value="MEDICAL" className="text-xs font-semibold">
              🩺 Medical ({medCount})
            </TabsTrigger>
            <TabsTrigger value="VISA" className="text-xs font-semibold">
              🛂 Visa ({visaCount})
            </TabsTrigger>
            <TabsTrigger value="CLEARANCE" className="text-xs font-semibold">
              🏛️ BMET ({clearanceCount})
            </TabsTrigger>
            <TabsTrigger value="TICKET_DEPARTURE" className="text-xs font-semibold">
              ✈️ Tickets & Flight ({depCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search candidate, passport, code, job..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
            >
              <option value="">All Stages (সব ধাপ)</option>
              {Object.entries(STAGE_LABELS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label} ({item.labelBn})
                </option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent ⚡</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading processing files...
          </div>
        ) : errorMsg ? (
          <div className="py-16 text-center text-xs text-rose-600 space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
            <p>{errorMsg}</p>
            <Button size="sm" variant="outline" onClick={fetchCases}>
              Try Again
            </Button>
          </div>
        ) : cases.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-400" />
            <p className="font-semibold text-slate-700">No recruitment processing cases found</p>
            <p className="text-[11px] text-slate-400">
              When candidates are selected in applications, a processing case can be initiated.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Processing ID & Date</th>
                  <th className="py-3 px-4">Candidate & Passport</th>
                  <th className="py-3 px-4">Job & Employer</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4">5-Pillar Milestones</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((pc) => {
                  const stageInfo = STAGE_LABELS[pc.currentStage] || {
                    label: pc.currentStage,
                    labelBn: '',
                    color: 'bg-slate-100 text-slate-800',
                  };

                  const medFit = pc.medicalCase?.result === 'FIT';
                  const visaOk = pc.visaCase?.status === 'APPROVED';
                  const clrOk = pc.clearanceCase?.status === 'COMPLETED';
                  const tktOk = pc.travelTicket?.status === 'ISSUED';
                  const unverifiedDocs = pc.documentRequirements?.filter(
                    (d: any) => d.required && d.status !== 'VERIFIED'
                  ).length;
                  const docsOk = unverifiedDocs === 0;

                  return (
                    <tr key={pc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 align-top">
                        <Link
                          href={`/staff/processing/${pc.id}`}
                          className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          {pc.processingCode}
                        </Link>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(pc.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-900">
                          {pc.applicant?.fullName || 'Unnamed Candidate'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {pc.applicant?.passportNumber ? `🛂 ${pc.applicant.passportNumber}` : 'No Passport'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {pc.applicant?.phone || ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-800 max-w-[200px] truncate">
                          {pc.job?.title}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[180px]">
                            {pc.employer?.companyName}
                          </span>
                        </div>
                        <div className="text-[10px] text-indigo-600 font-medium">
                          {pc.job?.country?.name || 'Saudi Arabia'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[11px] ${stageInfo.color}`}
                        >
                          {stageInfo.label}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {stageInfo.labelBn}
                        </div>
                      </td>

                      {/* 5-Pillar Milestones Pills */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            title={docsOk ? 'Mandatory Documents Verified' : `${unverifiedDocs} docs pending`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              docsOk ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            DOC {docsOk ? '✓' : '!'}
                          </span>
                          <span
                            title={medFit ? 'Medical Fit' : `Medical: ${pc.medicalCase?.result || 'Pending'}`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              medFit ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            MED {medFit ? '✓' : '—'}
                          </span>
                          <span
                            title={visaOk ? 'Visa Approved' : `Visa: ${pc.visaCase?.status || 'Pending'}`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              visaOk ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            VISA {visaOk ? '✓' : '—'}
                          </span>
                          <span
                            title={clrOk ? 'Clearance Issued' : `Clearance: ${pc.clearanceCase?.status || 'Pending'}`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              clrOk ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            BMET {clrOk ? '✓' : '—'}
                          </span>
                          <span
                            title={tktOk ? 'Ticket Issued' : 'Ticket Pending'}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              tktOk ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            TKT {tktOk ? '✓' : '—'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            pc.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-800 animate-pulse'
                              : pc.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {pc.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        <Link href={`/staff/processing/${pc.id}`}>
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2.5 font-semibold">
                            Manage File
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
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
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {cases.length} of {pagination.total} cases
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-7 text-xs"
              >
                Previous
              </Button>
              <span className="px-2 text-slate-700 font-semibold">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
