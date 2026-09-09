'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ClipboardList,
  ArrowLeft,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  FileText,
  CalendarCheck,
  Receipt,
  UserPlus,
  ArrowRightCircle,
  Upload,
  Download,
  Plus,
  Eye,
  ShieldCheck,
  Globe2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLanguage } from '@/context/language-context';

export default function ApplicationDetailPage({ params }: { params?: { id?: string } }) {
  const routeParams = useParams();
  const id = (routeParams?.id as string) || params?.id || '';
  const router = useRouter();
  const { language, t } = useLanguage();

  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Status transition modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Staff assignment modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Document verification modal
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docVerifyStatus, setDocVerifyStatus] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Schedule Interview modal
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [interviewType, setInterviewType] = useState('IN_PERSON');
  const [scheduledDate, setScheduledDate] = useState('');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Upload Document modal
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docNumber, setDocNumber] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const fetchApplicationDetails = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/applications/${id}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.data) {
        setApplication(data.data);
        setTargetStatus(data.data.currentStatus || data.data.status || 'SUBMITTED');
        setSelectedStaffId(data.data.assignedStaffId || data.data.assignedToId || '');
      } else {
        throw new Error(data.error || 'Failed to fetch application details');
      }
    } catch (err: any) {
      console.error('Failed to load application', err);
      setFetchError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchApplicationDetails();
    }
  }, [id, fetchApplicationDetails]);

  // Load staff users and doc types
  useEffect(() => {
    async function loadAuxData() {
      try {
        const [staffRes, docsRes] = await Promise.all([
          fetch('/api/users?role=STAFF&limit=100'),
          fetch('/api/document-types'),
        ]);
        const staffData = await staffRes.json();
        if (staffData.success) {
          setStaffList(staffData.data?.items || staffData.data || []);
        }
        const docsData = await docsRes.json();
        if (docsData.success) {
          const types = docsData.data?.items || docsData.data || [];
          setDocTypes(types);
          if (types.length > 0) {
            setSelectedDocTypeId(types[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load aux data', err);
      }
    }
    loadAuxData();
  }, []);

  const handleStatusChange = async (forceOverride = false) => {
    if (!targetStatus) return;
    setStatusError(null);
    setIsUpdatingStatus(true);

    try {
      const res = await fetch(`/api/applications/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStatus: targetStatus,
          notes: statusNotes,
          forceOverride,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsStatusModalOpen(false);
        setStatusNotes('');
        fetchApplicationDetails();
      } else {
        setStatusError(data.error || 'Failed to advance status');
      }
    } catch (err: any) {
      setStatusError(err.message || 'Error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffId) return;
    setIsAssigning(true);

    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedStaffId: selectedStaffId,
          notes: assignNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAssignModalOpen(false);
        fetchApplicationDetails();
      }
    } catch (err) {
      console.error('Error assigning staff', err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleVerifyDocument = async () => {
    if (!selectedDoc) return;
    setIsVerifying(true);

    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: docVerifyStatus,
          rejectionReason: docVerifyStatus === 'REJECTED' ? rejectionReason : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsVerifyModalOpen(false);
        setSelectedDoc(null);
        setRejectionReason('');
        fetchApplicationDetails();
      }
    } catch (err) {
      console.error('Error verifying document', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate) return;
    setIsScheduling(true);

    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: id,
          interviewType,
          scheduledDate,
          location,
          meetingLink,
          notes: interviewNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsInterviewModalOpen(false);
        setScheduledDate('');
        setLocation('');
        setMeetingLink('');
        setInterviewNotes('');
        fetchApplicationDetails();
      }
    } catch (err) {
      console.error('Error scheduling interview', err);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocTypeId || !docFile) return;
    setIsUploadingDoc(true);

    try {
      const formData = new FormData();
      formData.append('applicationId', id);
      formData.append('documentTypeId', selectedDocTypeId);
      formData.append('documentNumber', docNumber);
      formData.append('file', docFile);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setIsUploadDocModalOpen(false);
        setDocFile(null);
        setDocNumber('');
        fetchApplicationDetails();
      }
    } catch (err) {
      console.error('Error uploading document', err);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-600" />
        <p className="text-sm font-medium text-slate-600">
          {t('আবেদন ফাইল লোড হচ্ছে...', 'Loading application case file...')}
        </p>
      </div>
    );
  }

  if (fetchError || !application) {
    return (
      <div className="py-24 text-center text-slate-600">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900">
          {fetchError || t('আবেদন পাওয়া যায়নি', 'Application Not Found')}
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          {t(
            'এই আইডি সম্বলিত কোনো আবেদন রেকর্ড ডাটাবেজে পাওয়া যায়নি।',
            'No matching application record found in system.'
          )}
        </p>
        <Link href="/admin/applications" className="text-primary-600 font-medium text-sm mt-4 inline-block">
          {t('আবেদন তালিকায় ফিরে যান', 'Return to Applications List')}
        </Link>
      </div>
    );
  }

  // Safe extraction of relations
  const applicant = application.applicant || null;
  const job = application.job || null;
  const employer = job?.employer || application.employer || null;
  const country = job?.country || application.country || null;
  const assignedTo = application.assignedTo || application.assignedStaff || null;
  const statusHistory = application.statusHistory || [];
  const documents = application.documents || [];
  const interviews = application.interviews || [];
  const invoices = application.invoices || [];

  const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + Number(inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum: number, inv: any) => sum + Number(inv.paidAmount || 0), 0);
  const totalDue = invoices.reduce((sum: number, inv: any) => sum + Number(inv.dueAmount || 0), 0);

  const applicantName = applicant?.fullName || t('আবেদনকারীর তথ্য পাওয়া যায়নি', 'Applicant unavailable');
  const appNumber = application.applicationNumber || application.applicationCode || application.id.substring(0, 8);
  const currentStatusKey = application.currentStatus || application.status || 'SUBMITTED';

  return (
    <div className="space-y-6 pb-16">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/applications"
          className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t('সকল আবেদনে ফিরে যান', 'Back to Applications')}
        </Link>
        <div className="text-xs text-slate-400">
          {t('তৈরির তারিখ:', 'Created:')} {new Date(application.createdAt).toLocaleString()}
        </div>
      </div>

      {/* Missing Employer Global Warning Banner */}
      {!employer && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">
                {t('তথ্য অসম্পূর্ণ: নিয়োগকর্তা অনুপস্থিত', 'Data Quality Issue: Missing Employer')}
              </p>
              <p className="text-amber-700 mt-0.5">
                {t(
                  'এই চাকরির পদের জন্য কোনো নিয়োগকারী প্রতিষ্ঠান নির্ধারিত নেই। পূর্ণাঙ্গ প্রক্রিয়াকরণের জন্য চাকরিটি এডিট করে নিয়োগকর্তা নির্বাচন করুন।',
                  'This job vacancy does not have an assigned employer. Please update the job record to assign an employer.'
                )}
              </p>
            </div>
          </div>
          {job?.id && (
            <Link href={`/admin/jobs/${job.id}/edit`}>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-amber-300 text-amber-900 bg-white hover:bg-amber-100 shrink-0"
              >
                {t('চাকরি এডিট করুন', 'Edit Job')}
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-lg overflow-hidden shrink-0 border border-slate-300">
            {applicant?.profilePhoto ? (
              <img src={applicant.profilePhoto} alt={applicantName} className="w-full h-full object-cover" />
            ) : (
              (applicantName || 'NA').substring(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{applicantName}</h1>
              <Badge variant="navy">{appNumber}</Badge>
              <Badge variant="gold">{currentStatusKey.replace(/_/g, ' ')}</Badge>
            </div>
            <div className="text-sm text-slate-600 flex flex-wrap items-center gap-3 mt-1.5">
              <span>
                Candidate ID: <strong>{applicant?.applicantNumber || '—'}</strong>
              </span>
              <span>•</span>
              <span>
                Passport: <strong>{applicant?.passportNumber || 'N/A'}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Target Job:{' '}
                <strong className="text-slate-900">
                  {job?.title || t('চাকরির তথ্য পাওয়া যায়নি', 'Job unavailable')}
                </strong>{' '}
                ({country?.name || t('দেশ নির্ধারিত নয়', 'Country not assigned')})
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsStatusModalOpen(true)}
            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs"
          >
            <ArrowRightCircle className="w-4 h-4" /> {t('পর্যায় পরিবর্তন', 'Advance Stage')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-1.5 text-xs border-slate-300"
          >
            <UserPlus className="w-4 h-4" /> {t('স্টাফ নির্ধারণ', 'Assign Staff')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsInterviewModalOpen(true)}
            className="flex items-center gap-1.5 text-xs border-slate-300"
          >
            <CalendarCheck className="w-4 h-4" /> {t('ইন্টারভিউ শিডিউল', 'Schedule Interview')}
          </Button>
          <Link
            href={`/admin/invoices/new?applicantId=${applicant?.id || ''}&applicationId=${application.id}`}
          >
            <Button variant="outline" className="flex items-center gap-1.5 text-xs border-slate-300">
              <Receipt className="w-4 h-4" /> {t('ইনভয়েস তৈরি', 'Generate Invoice')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-lg border border-slate-200">
          <TabsTrigger value="overview" className="text-xs font-semibold px-4 py-2">
            {t('সারসংক্ষেপ ও প্রোফাইল', 'Overview & Profile')}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs font-semibold px-4 py-2">
            {t('পর্যায় টাইমলাইন', 'Stage Timeline')} ({statusHistory.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs font-semibold px-4 py-2">
            {t('নথিপত্র', 'Documents')} ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="interviews" className="text-xs font-semibold px-4 py-2">
            {t('সাক্ষাৎকার', 'Interviews')} ({interviews.length})
          </TabsTrigger>
          <TabsTrigger value="finance" className="text-xs font-semibold px-4 py-2">
            {t('আর্থিক লেজার', 'Financial Ledger')} ({invoices.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Candidate Specs */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-primary-600" /> {t('প্রার্থীর তথ্য', 'Candidate Profile')}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">{t('মোবাইল নম্বর', 'Phone')}</span>
                  <span className="font-semibold text-slate-800">{applicant?.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t('ইমেইল', 'Email')}</span>
                  <span className="font-semibold text-slate-800">{applicant?.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t('দক্ষতা / ট্রেড', 'Skills')}</span>
                  <span className="font-semibold text-slate-800">{applicant?.skills || 'General Labor'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t('ঠিকানা', 'Current Address')}</span>
                  <span className="font-semibold text-slate-800">
                    {applicant?.address || applicant?.district || 'Bangladesh'}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Job Specs */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <Briefcase className="w-4 h-4 text-primary-600" /> {t('চাকরির চাহিদা বিবরণ', 'Target Job Demand')}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">{t('জব কোড', 'Job Code')}</span>
                  <span className="font-semibold text-slate-800">{job?.jobCode || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t('নিয়োগকারী প্রতিষ্ঠান', 'Employer')}</span>
                  {employer ? (
                    <span className="font-semibold text-slate-800">{employer.companyName}</span>
                  ) : (
                    <span className="font-semibold text-amber-700 inline-flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      {t('নিয়োগকর্তা নির্ধারিত নয়', 'Employer not assigned')}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">{t('গন্তব্য দেশ', 'Destination')}</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    {country?.flag && <span>{country.flag}</span>}
                    {country?.name || t('দেশ নির্ধারিত নয়', 'Country not assigned')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t('মাসিক বেতন', 'Monthly Salary')}</span>
                  <span className="font-semibold text-emerald-700">
                    {job?.salaryMin
                      ? `${job.currency || 'BDT'} ${Number(job.salaryMin).toLocaleString()}`
                      : job?.salaryAmount
                      ? `${job.salaryCurrency || 'BDT'} ${Number(job.salaryAmount).toLocaleString()}`
                      : 'Negotiable'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t('উন্মুক্ত পদ সংখ্যা', 'Open Vacancies')}</span>
                  <span className="font-semibold text-slate-800">
                    {job?.vacancyCount ?? job?.vacancies ?? 1} Positions
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t('দায়িত্বপ্রাপ্ত স্টাফ', 'Assigned Staff')}</span>
                  <span className="font-semibold text-primary-700">
                    {assignedTo ? assignedTo.name : t('অনির্ধারিত', 'Unassigned')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Case Notes */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {t('অভ্যন্তরীণ কেস নোট', 'Internal Case Notes')}
            </h3>
            <p className="text-xs text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">
              {application.notes || application.internalNotes || t('কোনো অভ্যন্তরীণ নোট পাওয়া যায়নি।', 'No internal case notes recorded yet.')}
            </p>
          </div>
        </TabsContent>

        {/* 2. STAGE TIMELINE TAB */}
        <TabsContent value="timeline" className="mt-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">
              {t('নিয়োগ পর্যায় অডিট ট্রেইল', 'Recruitment Stage Audit Trail')}
            </h3>

            {statusHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                {t('কোনো পর্যায় পরিবর্তনের ইতিহাস নেই', 'No stage transition history recorded')}
              </p>
            ) : (
              <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {statusHistory.map((hist: any) => (
                  <div key={hist.id} className="relative group">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-primary-600 border-4 border-white shadow-sm" />
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                        {hist.fromStage || hist.fromStatus ? `${hist.fromStage || hist.fromStatus} → ` : ''}
                        {hist.toStage || hist.toStatus}
                      </span>
                      <span className="text-slate-400 font-normal">
                        {new Date(hist.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {hist.notes && <div className="text-xs text-slate-600 mt-1">{hist.notes}</div>}
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {t('আপডেট করেছেন:', 'Updated by:')} <strong>{hist.changedBy?.name || 'System'}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 3. DOCUMENTS TAB */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {t('প্রার্থীর নথিপত্র', 'Candidate Documents')}
              </h3>
              <p className="text-xs text-slate-500">
                {t(
                  'পাসপোর্ট, মেডিকেল সনদ, পুলিশ ক্লিয়ারেন্স ও ভিসা সংক্রান্ত ফাইল।',
                  'Official passports, medical certificates, police clearances and visas.'
                )}
              </p>
            </div>
            <Button
              onClick={() => setIsUploadDocModalOpen(true)}
              size="sm"
              className="bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1.5 text-xs"
            >
              <Upload className="w-3.5 h-3.5" /> {t('নথি আপলোড', 'Upload Document')}
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <th className="p-3.5">{t('নথির ধরন', 'Document Type')}</th>
                  <th className="p-3.5">{t('ফাইল নাম', 'File Name')}</th>
                  <th className="p-3.5">{t('নম্বর ও মেয়াদ', 'Doc # / Expiry')}</th>
                  <th className="p-3.5">{t('যাচাই অবস্থা', 'Verification')}</th>
                  <th className="p-3.5">{t('যাচাইকারী', 'Verified By')}</th>
                  <th className="p-3.5 text-right">{t('অ্যাকশন', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {t('কোনো নথি আপলোড করা হয়নি।', 'No documents uploaded for this application yet.')}
                    </td>
                  </tr>
                ) : (
                  documents.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-semibold text-slate-800">
                        {doc.documentType?.name || doc.documentType?.code || 'Document'}
                      </td>
                      <td className="p-3.5 text-slate-600">{doc.fileName}</td>
                      <td className="p-3.5 text-slate-500">
                        {doc.documentNumber || '—'}{' '}
                        {doc.expiryDate && (
                          <span className="block text-[10px] text-slate-400">
                            Exp: {new Date(doc.expiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {doc.isVerified ? (
                          <Badge variant="success">{t('যাচাইকৃত', 'Verified')}</Badge>
                        ) : doc.rejectionReason ? (
                          <div>
                            <Badge variant="error">{t('বাতিলকৃত', 'Rejected')}</Badge>
                            <span className="block text-[10px] text-rose-600 mt-0.5">{doc.rejectionReason}</span>
                          </div>
                        ) : (
                          <Badge variant="warning">{t('যাচাই প্রক্রিয়াধীন', 'Pending Verification')}</Badge>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500">{doc.verifiedBy?.name || '—'}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDoc(doc);
                              setDocVerifyStatus(doc.isVerified ? 'REJECTED' : 'VERIFIED');
                              setIsVerifyModalOpen(true);
                            }}
                            className="h-7 text-xs px-2"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            {t('যাচাই / বাতিল', 'Verify / Reject')}
                          </Button>
                          {doc.id && (
                            <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                <Download className="w-3.5 h-3.5 text-slate-500" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* 4. INTERVIEWS TAB */}
        <TabsContent value="interviews" className="mt-4 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {t('সাক্ষাৎকার তালিকা', 'Candidate Interviews')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('অভ্যন্তরীণ বাছাই এবং বিদেশি নিয়োগকর্তার ইন্টারভিউ সূচি।', 'Agency screening and foreign employer interviews.')}
              </p>
            </div>
            <Button
              onClick={() => setIsInterviewModalOpen(true)}
              size="sm"
              className="bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1.5 text-xs"
            >
              <CalendarCheck className="w-3.5 h-3.5" /> {t('নতুন ইন্টারভিউ', 'Schedule Interview')}
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <th className="p-3.5">{t('তারিখ ও সময়', 'Date & Time')}</th>
                  <th className="p-3.5">{t('ধরন', 'Type')}</th>
                  <th className="p-3.5">{t('ইন্টারভিউয়ার', 'Interviewer')}</th>
                  <th className="p-3.5">{t('স্ট্যাটাস', 'Status')}</th>
                  <th className="p-3.5">{t('ফলাফল ও স্কোর', 'Score & Outcome')}</th>
                  <th className="p-3.5">{t('মন্তব্য', 'Feedback')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {t('কোনো সাক্ষাৎকার নির্ধারিত নেই।', 'No interviews scheduled for this application yet.')}
                    </td>
                  </tr>
                ) : (
                  interviews.map((int: any) => (
                    <tr key={int.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-semibold text-slate-800">
                        {new Date(int.scheduledAt || int.scheduledDate).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-medium">
                        {(int.interviewType || 'IN_PERSON').replace(/_/g, ' ')}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {int.interviewer?.name || int.interviewerName || '—'}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            int.status === 'COMPLETED'
                              ? 'success'
                              : int.status === 'CANCELLED'
                              ? 'error'
                              : 'info'
                          }
                        >
                          {int.status}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        {int.outcome ? (
                          <div className="font-semibold">
                            <span className={int.outcome === 'PASSED' ? 'text-emerald-600' : 'text-rose-600'}>
                              {int.outcome}
                            </span>
                            {int.score !== null && int.score !== undefined && (
                              <span className="text-slate-500 ml-1">({int.score}/100)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">{t('অপেক্ষারত', 'Awaiting Evaluation')}</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">{int.feedback || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* 5. FINANCIAL TAB */}
        <TabsContent value="finance" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold uppercase">{t('মোট ইনভয়েস', 'Total Invoiced')}</span>
              <p className="text-xl font-bold text-slate-900 mt-1">BDT {totalInvoiced.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-emerald-600 font-semibold uppercase">{t('পরিশোধিত', 'Total Paid')}</span>
              <p className="text-xl font-bold text-emerald-700 mt-1">BDT {totalPaid.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-rose-600 font-semibold uppercase">{t('বকেয়া', 'Outstanding Due')}</span>
              <p className="text-xl font-bold text-rose-700 mt-1">BDT {totalDue.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <th className="p-3.5">{t('ইনভয়েস #', 'Invoice #')}</th>
                  <th className="p-3.5">{t('ইস্যু তারিখ', 'Issue Date')}</th>
                  <th className="p-3.5">{t('পরিশোধের শেষ তারিখ', 'Due Date')}</th>
                  <th className="p-3.5">{t('মোট টাকা', 'Total')}</th>
                  <th className="p-3.5">{t('পরিশোধিত', 'Paid')}</th>
                  <th className="p-3.5">{t('বকেয়া', 'Due')}</th>
                  <th className="p-3.5">{t('স্ট্যাটাস', 'Status')}</th>
                  <th className="p-3.5 text-right">{t('অ্যাকশন', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      {t('এই আবেদনের জন্য কোনো ইনভয়েস ইস্যু করা হয়নি।', 'No invoices issued for this application.')}
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold font-mono text-primary-700">{inv.invoiceNumber}</td>
                      <td className="p-3.5">
                        {new Date(inv.invoiceDate || inv.issueDate || inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="p-3.5 font-semibold">BDT {Number(inv.totalAmount || 0).toLocaleString()}</td>
                      <td className="p-3.5 text-emerald-600 font-semibold">
                        BDT {Number(inv.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-rose-600 font-semibold">
                        BDT {Number(inv.dueAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            inv.status === 'PAID'
                              ? 'success'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'gold'
                              : 'neutral'
                          }
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <Link href={`/admin/invoices/${inv.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2">
                            {t('ইনভয়েস দেখুন', 'View Invoice')}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Advance Stage Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={t('নিয়োগ পর্যায় পরিবর্তন', 'Transition Recruitment Stage')}
        description={`${t('আবেদন', 'Application')}: ${appNumber} — ${applicantName}`}
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
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
            >
              {[
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
              ].map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
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
              placeholder={t('এই পর্যায়ে রূপান্তরের মন্তব্য...', 'Reason or evaluation feedback for this transition...')}
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
              {isUpdatingStatus ? t('আপডেট হচ্ছে...', 'Updating...') : t('নিশ্চিত করুন', 'Confirm Transition')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={t('দায়িত্বপ্রাপ্ত স্টাফ নির্ধারণ', 'Assign Staff Member')}
        description={t(
          'এই কেস ফাইল তদারকির জন্য একজন দায়িত্বপ্রাপ্ত স্টাফ নির্বাচন করুন।',
          'Assign a team member responsible for handling this recruitment case.'
        )}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {t('স্টাফ নির্বাচন করুন', 'Select Staff')}
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">{t('অনির্ধারিত / নির্বাচন করুন...', 'Select Staff...')}</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {t('দায়িত্ব হস্তান্তর নোট', 'Assignment Note')}
            </label>
            <textarea
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder={t('স্টাফের জন্য বিশেষ কোনো নির্দেশনা থাকলে লিখুন...', 'Specific instructions for assigned staff...')}
              rows={2}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              {t('বাতিল', 'Cancel')}
            </Button>
            <Button
              onClick={handleAssignStaff}
              disabled={isAssigning}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isAssigning ? t('সংরক্ষণ হচ্ছে...', 'Saving...') : t('সংরক্ষণ করুন', 'Save Assignment')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadDocModalOpen}
        onClose={() => setIsUploadDocModalOpen(false)}
        title={t('নতুন নথি আপলোড', 'Upload Application Document')}
        description={t('প্রার্থীর পাসপোর্ট, সার্টিফিকেট বা অন্যান্য নথি সংযুক্ত করুন।', 'Attach candidate identity, medical or visa files.')}
        maxWidth="md"
      >
        <form onSubmit={handleUploadDocument} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {t('নথির ধরন', 'Document Type')} <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedDocTypeId}
              onChange={(e) => setSelectedDocTypeId(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              {docTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name} ({dt.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {t('নথি নম্বর (ঐচ্ছিক)', 'Document Number (Optional)')}
            </label>
            <Input
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="e.g. A01234567"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {t('ফাইল নির্বাচন করুন', 'File Attachment')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="file"
              required
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsUploadDocModalOpen(false)}>
              {t('বাতিল', 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isUploadingDoc || !docFile}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isUploadingDoc ? t('আপলোড হচ্ছে...', 'Uploading...') : t('আপলোড করুন', 'Upload File')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Verify Document Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title={t('নথি যাচাইকরণ মূল্যায়ন', 'Verify Candidate Document')}
        description={selectedDoc ? `${selectedDoc.documentType?.name}: ${selectedDoc.fileName}` : ''}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {t('যাচাইকরণ ফলাফল', 'Verification Decision')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDocVerifyStatus('VERIFIED')}
                className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 ${
                  docVerifyStatus === 'VERIFIED'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> {t('অনুমোদিত / সঠিক', 'Verify Document')}
              </button>
              <button
                type="button"
                onClick={() => setDocVerifyStatus('REJECTED')}
                className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 ${
                  docVerifyStatus === 'REJECTED'
                    ? 'border-rose-500 bg-rose-50 text-rose-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <XCircle className="w-4 h-4" /> {t('বাতিল / অসঙ্গতিপূর্ণ', 'Reject Document')}
              </button>
            </div>
          </div>

          {docVerifyStatus === 'REJECTED' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('বাতিলকরণের কারণ', 'Rejection Reason')} <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t('কেন নথিটি গৃহীত হয়নি...', 'e.g. Blurred photo, expired date, invalid format')}
                rows={2}
                className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsVerifyModalOpen(false)}>
              {t('বাতিল', 'Cancel')}
            </Button>
            <Button
              onClick={handleVerifyDocument}
              disabled={isVerifying || (docVerifyStatus === 'REJECTED' && !rejectionReason.trim())}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isVerifying ? t('সংরক্ষণ হচ্ছে...', 'Saving...') : t('সিদ্ধান্ত সংরক্ষণ', 'Save Decision')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        title={t('সাক্ষাৎকার নির্ধারণ', 'Schedule Candidate Interview')}
        description={t('প্রার্থীর সাক্ষাৎকার সূচি ও মাধ্যম নির্ধারণ করুন।', 'Schedule an interview session for this candidate.')}
        maxWidth="md"
      >
        <form onSubmit={handleScheduleInterview} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('ইন্টারভিউ ধরন', 'Interview Type')}
              </label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="IN_PERSON">{t('সরাসরি (In Person)', 'In Person')}</option>
                <option value="ONLINE_VIDEO">{t('অনলাইন ভিডিও (Zoom/Meet)', 'Online Video')}</option>
                <option value="PHONE">{t('টেলিফোন (Phone Call)', 'Phone Call')}</option>
                <option value="EMPLOYER_CLIENT">{t('নিয়োগকর্তার সরাসরি ভাইভা', 'Client Interview')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('তারিখ ও সময়', 'Date & Time')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {t('স্থান বা রুম', 'Location')}
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Dhaka Head Office, Room 402"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {t('অনলাইন মিটিং লিংক (যদি থাকে)', 'Meeting Link (Optional)')}
            </label>
            <Input
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/xyz"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {t('বিশেষ নির্দেশনা', 'Interview Notes')}
            </label>
            <textarea
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              placeholder={t('প্রার্থীর সাথে প্রয়োজনীয় নথি বা নির্দেশাবলী...', 'Candidate instructions or interviewer guidelines...')}
              rows={2}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsInterviewModalOpen(false)}>
              {t('বাতিল', 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isScheduling || !scheduledDate}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isScheduling ? t('নির্ধারণ হচ্ছে...', 'Scheduling...') : t('ইন্টারভিউ নির্ধারণ করুন', 'Confirm Schedule')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
