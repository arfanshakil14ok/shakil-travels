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
  Sparkles,
  SlidersHorizontal,
  Check,
  Ban,
  UserCheck,
  ChevronRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLanguage } from '@/context/language-context';

export default function StaffApplicationDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const router = useRouter();
  const { language } = useLanguage();

  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [isShortlistModalOpen, setIsShortlistModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isScorecardModalOpen, setIsScorecardModalOpen] = useState(false);
  const [selectedInterviewForScore, setSelectedInterviewForScore] = useState<any | null>(null);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Form states
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Interview form
  const [interviewForm, setInterviewForm] = useState({
    interviewType: 'ONLINE',
    scheduledAt: '',
    durationMinutes: 30,
    location: '',
    meetingLink: '',
    interviewerName: '',
    notes: '',
  });

  // Scorecard form
  const [scorecardForm, setScorecardForm] = useState({
    technicalSkill: 8,
    experience: 8,
    communication: 7,
    language: 7,
    behaviour: 8,
    jobUnderstanding: 8,
    overallImpression: 8,
    result: 'PASS',
    feedback: '',
  });

  // Rejection form
  const [rejectionForm, setRejectionForm] = useState({
    rejectionReason: 'SKILL_MISMATCH',
    internalNotes: '',
    candidateFeedback: '',
  });

  // Selection form
  const [selectionForm, setSelectionForm] = useState({
    selectionNotes: '',
    selectedPosition: '',
    forceOverride: false,
    overrideReason: '',
  });

  // Screening Checklist form state (13 points)
  const SCREENING_CRITERIA = [
    { key: 'ageEligibility', label: 'Age Eligibility (বয়সসীমা)', desc: 'Must meet job destination age range' },
    { key: 'passportAvailability', label: 'Passport Available (মূল পাসপোর্ট)', desc: 'Valid original passport present' },
    { key: 'passportValidity', label: 'Passport Validity (মেয়াদ নূন্যতম ৬ মাস)', desc: 'Valid for at least 6+ months' },
    { key: 'requiredSkill', label: 'Trade Skill Match (ট্রেড দক্ষতা)', desc: 'Candidate possess requested core skill' },
    { key: 'skillProficiency', label: 'Proficiency Level (দক্ষতার মান)', desc: 'Meets minimum skill level requirement' },
    { key: 'workExperience', label: 'Experience Proof (কাজের অভিজ্ঞতা)', desc: 'Meets required years of work experience' },
    { key: 'education', label: 'Minimum Education (শিক্ষাগত যোগ্যতা)', desc: 'Satisfies required educational certificate' },
    { key: 'language', label: 'Language Readiness (ভাষা জ্ঞান)', desc: 'Basic English/Arabic/destination language' },
    { key: 'destinationEligibility', label: 'Country Eligibility (গন্তব্য ছাড়পত্র)', desc: 'No prior travel or visa ban' },
    { key: 'requiredDocuments', label: 'Compliance Documents (প্রয়োজনীয় কাগজপত্র)', desc: 'NID, photos, police clearance readiness' },
    { key: 'jobRequirements', label: 'Job Specific Physical Fitness (শারীরিক সক্ষমতা)', desc: 'Physical height, weight, stamina requirements' },
    { key: 'trainingCertification', label: 'Accredited Training (প্রশিক্ষণ সার্টিফিকেট)', desc: 'BMET / Technical Center certified if required' },
    { key: 'otherEligibility', label: 'Conduct & Background Check (আচরণ ও চরিত্র)', desc: 'Clean background check' },
  ];

  const [screeningChecklist, setScreeningChecklist] = useState<Record<string, { status: string; notes: string }>>({});
  const [screeningOverall, setScreeningOverall] = useState('PASS');
  const [screeningNotes, setScreeningNotes] = useState('');
  const [autoShortlist, setAutoShortlist] = useState(true);
  const [isSavingScreening, setIsSavingScreening] = useState(false);

  const fetchApplication = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/applications/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch application');
      }
      setApplication(data.data);

      // Prepopulate screening checklist if latest screening exists
      if (data.data.screenings && data.data.screenings.length > 0) {
        const latest = data.data.screenings[0];
        if (latest.checklist && typeof latest.checklist === 'object') {
          setScreeningChecklist(latest.checklist);
        }
        setScreeningOverall(latest.overallResult || 'PASS');
        setScreeningNotes(latest.notes || '');
      } else {
        // Initialize default checklist
        const init: Record<string, { status: string; notes: string }> = {};
        SCREENING_CRITERIA.forEach((c) => {
          init[c.key] = { status: 'PENDING', notes: '' };
        });
        setScreeningChecklist(init);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchApplication();
  }, [id, fetchApplication]);

  // Shortlist action
  const handleShortlist = async () => {
    try {
      setIsSubmittingAction(true);
      setActionError(null);
      const res = await fetch(`/api/applications/${application.id}/shortlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: actionNotes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to shortlist');
      setIsShortlistModalOpen(false);
      setActionNotes('');
      fetchApplication();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Schedule Interview action
  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingAction(true);
      setActionError(null);
      const res = await fetch(`/api/applications/${application.id}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to schedule interview');
      setIsInterviewModalOpen(false);
      fetchApplication();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Submit Scorecard
  const handleSubmitScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterviewForScore) return;

    try {
      setIsSubmittingAction(true);
      setActionError(null);

      const criteriaScores = [
        scorecardForm.technicalSkill,
        scorecardForm.experience,
        scorecardForm.communication,
        scorecardForm.language,
        scorecardForm.behaviour,
        scorecardForm.jobUnderstanding,
        scorecardForm.overallImpression,
      ];
      const avg = Number((criteriaScores.reduce((a, b) => a + b, 0) / criteriaScores.length).toFixed(1));

      const payload = {
        result: scorecardForm.result,
        score: Math.round(avg * 10),
        feedback: scorecardForm.feedback,
        scorecard: {
          ...scorecardForm,
          averageScore: avg,
        },
      };

      const res = await fetch(`/api/interviews/${selectedInterviewForScore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to record interview evaluation');

      setIsScorecardModalOpen(false);
      setSelectedInterviewForScore(null);
      fetchApplication();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Select Candidate
  const handleSelectCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingAction(true);
      setActionError(null);
      const res = await fetch(`/api/applications/${application.id}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectionForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to select candidate');
      setIsSelectModalOpen(false);
      fetchApplication();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Start Post-Selection Processing
  const handleStartProcessing = async () => {
    try {
      setIsSubmittingAction(true);
      setActionError(null);
      const res = await fetch('/api/staff/processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: application.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to start processing');
      if (data.data?.id) {
        router.push(`/staff/processing/${data.data.id}`);
      } else {
        fetchApplication();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Reject Candidate
  const handleRejectCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingAction(true);
      setActionError(null);
      const res = await fetch(`/api/applications/${application.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rejectionForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to reject application');
      setIsRejectModalOpen(false);
      fetchApplication();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Withdraw Application
  const handleWithdrawApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingAction(true);
      setActionError(null);
      const res = await fetch(`/api/applications/${application.id}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalReason: actionNotes || 'Candidate requested withdrawal',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to withdraw application');
      setIsWithdrawModalOpen(false);
      setActionNotes('');
      fetchApplication();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Save Screening Checklist
  const handleSaveScreening = async () => {
    try {
      setIsSavingScreening(true);
      const res = await fetch(`/api/applications/${application.id}/screening`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overallResult: screeningOverall,
          checklist: screeningChecklist,
          notes: screeningNotes,
          autoShortlist: autoShortlist && screeningOverall === 'PASS',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save screening');
      fetchApplication();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingScreening(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 text-xs">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        Loading Recruitment Case 360°...
      </div>
    );
  }

  if (errorMsg || !application) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Application Case Not Found</h2>
        <p className="text-xs text-slate-500">{errorMsg || 'The requested application could not be found.'}</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/staff/applications">Back to Applications</Link>
        </Button>
      </div>
    );
  }

  const match = application.matchingSnapshot;
  const isSelected = application.status === 'SELECTED';
  const isRejected = application.status === 'REJECTED';
  const isWithdrawn = application.status === 'WITHDRAWN';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-900 -ml-2">
          <Link href="/staff/applications">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Applications Pipeline
          </Link>
        </Button>
        <span className="text-xs text-slate-400 font-mono">Case ID: {application.id}</span>
      </div>

      {/* Case Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                {application.applicationCode || application.applicationNumber}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                isSelected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : isRejected
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : isWithdrawn
                  ? 'bg-slate-100 text-slate-600 border-slate-300'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                Status: {application.status}
              </span>
              {match && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {match.score}% {match.level || 'Match'}
                </span>
              )}
              {application.priority === 'URGENT' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  🔴 URGENT
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {application.applicant?.fullName}
            </h1>

            <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700">{application.applicant?.applicantNumber}</span>
              <span>•</span>
              <span>{application.applicant?.phone}</span>
              <span>•</span>
              <span>Applying for: <strong className="text-slate-800">{application.job?.title}</strong></span>
              <span>•</span>
              <span>Destination: <strong className="text-slate-800">{application.country?.name || application.job?.country?.name}</strong></span>
            </p>
          </div>

          {/* Recruiter & Applied Date */}
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Assigned Recruiter</div>
              <div className="font-bold text-slate-800">{application.assignedStaff?.name || 'Unassigned'}</div>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Applied Date</div>
              <div className="font-bold text-slate-800">
                {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100 overflow-x-auto scrollbar-none">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('screening')}
            className="text-xs bg-amber-50/50 text-amber-900 border-amber-300 hover:bg-amber-100"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
            Screen Candidate
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isSelected || isRejected || isWithdrawn}
            onClick={() => setIsShortlistModalOpen(true)}
            className="text-xs bg-purple-50/50 text-purple-900 border-purple-300 hover:bg-purple-100"
          >
            <UserCheck className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
            Shortlist
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isRejected || isWithdrawn}
            onClick={() => setIsInterviewModalOpen(true)}
            className="text-xs bg-indigo-50/50 text-indigo-900 border-indigo-300 hover:bg-indigo-100"
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
            Schedule Interview
          </Button>

          {isSelected && (
            application.processingCase ? (
              <Link href={`/staff/processing/${application.processingCase.id}`}>
                <Button size="sm" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  View Processing File ({application.processingCase.processingCode})
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                onClick={handleStartProcessing}
                disabled={isSubmittingAction}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                Start Post-Selection Processing (প্রসেসিং শুরু করুন)
              </Button>
            )
          )}

          <Button
            size="sm"
            disabled={isSelected || isRejected || isWithdrawn}
            onClick={() => {
              setSelectionForm((s) => ({ ...s, selectedPosition: application.job?.title || '' }));
              setIsSelectModalOpen(true);
            }}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Select Candidate (চূড়ান্ত নির্বাচন)
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isSelected || isRejected || isWithdrawn}
            onClick={() => setIsRejectModalOpen(true)}
            className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
          >
            <Ban className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
            Reject
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={isWithdrawn}
            onClick={() => setIsWithdrawModalOpen(true)}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Withdraw
          </Button>
        </div>
      </div>

      {/* 10 Structured Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-1">
          <TabsTrigger value="overview" className="text-xs">Overview (সারসংক্ষেপ)</TabsTrigger>
          <TabsTrigger value="candidate" className="text-xs">Candidate 360 (প্রার্থী)</TabsTrigger>
          <TabsTrigger value="job" className="text-xs">Job Demands (চাকরি)</TabsTrigger>
          <TabsTrigger value="employer" className="text-xs">Employer (কোম্পানি)</TabsTrigger>
          <TabsTrigger value="screening" className="text-xs">Screening (বাছাই যাচাই)</TabsTrigger>
          <TabsTrigger value="interviews" className="text-xs">Interviews ({application.interviews?.length || 0})</TabsTrigger>
          <TabsTrigger value="selection" className="text-xs">Selection (নির্বাচন)</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">Documents ({application.documents?.length || 0})</TabsTrigger>
          <TabsTrigger value="finance" className="text-xs font-bold text-indigo-700 bg-indigo-50/50">Finance & Ledger (হিসাব)</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">Status History ({application.statusHistory?.length || 0})</TabsTrigger>
          <TabsTrigger value="notes" className="text-xs">Internal Notes</TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Case Milestones */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                Case Milestones (অগ্রগতি)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Applied Date</span>
                  <span className="font-semibold text-slate-800">{application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Screened At</span>
                  <span className="font-semibold text-slate-800">{application.screenedAt ? new Date(application.screenedAt).toLocaleDateString() : 'Pending'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Shortlisted At</span>
                  <span className="font-semibold text-slate-800">{application.shortlistedAt ? new Date(application.shortlistedAt).toLocaleDateString() : 'Pending'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Interviewed At</span>
                  <span className="font-semibold text-slate-800">{application.interviewedAt ? new Date(application.interviewedAt).toLocaleDateString() : 'Pending'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Selected At</span>
                  <span className="font-bold text-emerald-700">{application.selectedAt ? new Date(application.selectedAt).toLocaleDateString() : 'Not Selected'}</span>
                </div>
              </div>
            </div>

            {/* Match Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Matching Snapshot
              </h3>
              {match ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Overall Match Score</span>
                    <span className="text-base font-black text-emerald-700">{match.score}%</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    {match.criteria?.slice(0, 4).map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 truncate">{c.factor}</span>
                        <span className={c.matched ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                          {c.score}/{c.maxScore}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No match snapshot preserved.</p>
              )}
            </div>

            {/* Vacancy Quota Snapshot */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Job Vacancy Quota
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Total Demands</span>
                  <span className="font-bold text-slate-800">{application.job?.vacancyCount || application.job?.vacancies || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Filled Count</span>
                  <span className="font-bold text-slate-800">{application.job?.filledCount || 0}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Remaining Slots</span>
                  <span className="font-black text-emerald-700">
                    {application.job?.remainingVacancies ?? Math.max(0, (application.job?.vacancyCount || 0) - (application.job?.filledCount || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. CANDIDATE 360 TAB */}
        <TabsContent value="candidate" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              Candidate Profile & Skill Intelligence (প্রার্থী প্রোফাইল)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Full Name (English / বাংলা)</span>
                <p className="text-slate-900 font-bold mt-0.5">{application.applicant?.fullName} {application.applicant?.fullNameBn ? `(${application.applicant.fullNameBn})` : ''}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Candidate Category</span>
                <p className="text-slate-900 font-bold mt-0.5">{application.applicant?.candidateType || 'SKILLED'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Passport Number</span>
                <p className="text-slate-900 font-bold font-mono mt-0.5">{application.applicant?.passportNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Years of Experience</span>
                <p className="text-slate-900 font-bold mt-0.5">{application.applicant?.yearsOfExperience || application.applicant?.experienceYears || 0} years</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Phone & WhatsApp</span>
                <p className="text-slate-900 font-bold mt-0.5">{application.applicant?.phone}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Education</span>
                <p className="text-slate-900 font-bold mt-0.5">{application.applicant?.education || 'Secondary / SSC'}</p>
              </div>
            </div>

            {/* Skills */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block mb-2">Registered Skills & Trade Capabilities</span>
              <div className="flex items-center gap-2 flex-wrap">
                {application.applicant?.candidateSkills?.map((cs: any) => (
                  <span key={cs.id} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium border border-slate-200">
                    {cs.skill?.name} ({cs.proficiencyLevel || 'INTERMEDIATE'})
                  </span>
                ))}
                {(!application.applicant?.candidateSkills || application.applicant.candidateSkills.length === 0) && (
                  <span className="text-xs text-slate-400 italic">No skills catalogued</span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Button variant="outline" size="sm" asChild className="text-xs text-indigo-600">
                <Link href={`/admin/applicants/${application.applicant?.id}`}>
                  Open Full Candidate 360° View →
                </Link>
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* 3. JOB TAB */}
        <TabsContent value="job" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Job Demand Specifications (চাকরির চাহিদা ও সুযোগ-সুবিধা)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Position Title</span>
                <p className="text-slate-900 font-bold mt-0.5">{application.job?.title}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Job Code</span>
                <p className="text-slate-900 font-bold font-mono mt-0.5">{application.job?.jobCode}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Destination Country</span>
                <p className="text-slate-900 font-bold mt-0.5">{application.job?.country?.name}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Salary Range</span>
                <p className="text-slate-900 font-bold mt-0.5">
                  {application.job?.salaryMin} - {application.job?.salaryMax} {application.job?.currency} / {application.job?.salaryPeriod || 'MONTH'}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 4. EMPLOYER TAB */}
        <TabsContent value="employer" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Overseas Employer Information (নিয়োগকারী কোম্পানি)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Company Name</span>
                <p className="text-slate-900 font-bold mt-0.5">{application.employer?.companyName || application.job?.employer?.companyName || 'Verified Employer'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Verification Status</span>
                <p className="text-emerald-700 font-bold mt-0.5">✓ VERIFIED EMPLOYER</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 5. SCREENING TAB */}
        <TabsContent value="screening" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                  Recruiter Screening Checklist (১৩-পয়েন্ট যাচাইকরণ চেকলিস্ট)
                </h3>
                <p className="text-xs text-slate-500">
                  প্রার্থীর বয়স, পাসপোর্ট, শিক্ষাগত যোগ্যতা, কাজের অভিজ্ঞতা ও ভিসা ছাড়পত্র যাচাই করুন।
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={screeningOverall}
                  onChange={(e) => setScreeningOverall(e.target.value)}
                  className="text-xs font-bold p-1.5 rounded-lg border border-slate-200 bg-slate-50"
                >
                  <option value="PASS">Overall: PASS (সফল)</option>
                  <option value="FAIL">Overall: FAIL (অনুপযুক্ত)</option>
                  <option value="PENDING">Overall: PENDING (অপেক্ষমান)</option>
                </select>

                <Button
                  size="sm"
                  onClick={handleSaveScreening}
                  disabled={isSavingScreening}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  {isSavingScreening ? 'Saving...' : 'Save Decision (সিদ্ধান্ত সংরক্ষণ)'}
                </Button>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {SCREENING_CRITERIA.map((criterion) => {
                const current = screeningChecklist[criterion.key] || { status: 'PENDING', notes: '' };
                return (
                  <div
                    key={criterion.key}
                    className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800">{criterion.label}</div>
                      <div className="text-[11px] text-slate-500">{criterion.desc}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={current.status}
                        onChange={(e) => {
                          const val = e.target.value;
                          setScreeningChecklist((prev) => ({
                            ...prev,
                            [criterion.key]: { ...prev[criterion.key], status: val },
                          }));
                        }}
                        className={`text-xs font-semibold rounded-lg px-2 py-1 border ${
                          current.status === 'PASS'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : current.status === 'FAIL'
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="PASS">PASS</option>
                        <option value="FAIL">FAIL</option>
                        <option value="PENDING">PENDING</option>
                        <option value="NOT_REQUIRED">N/A</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Evaluator Notes */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Screening Evaluator Remarks (যাচাইকারীর মন্তব্য)
              </label>
              <textarea
                value={screeningNotes}
                onChange={(e) => setScreeningNotes(e.target.value)}
                rows={2}
                placeholder="Candidate documents verified against original passport..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                id="autoShortlist"
                checked={autoShortlist}
                onChange={(e) => setAutoShortlist(e.target.checked)}
                className="rounded border-slate-300"
              />
              <label htmlFor="autoShortlist" className="font-medium cursor-pointer">
                Auto-shortlist candidate if overall screening result is PASS
              </label>
            </div>
          </div>
        </TabsContent>

        {/* 6. INTERVIEWS TAB */}
        <TabsContent value="interviews" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-indigo-600" />
                  Scheduled & Conducted Interviews (সাক্ষাৎকার রেকর্ড)
                </h3>
              </div>
              <Button
                size="sm"
                onClick={() => setIsInterviewModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Schedule Interview
              </Button>
            </div>

            {(!application.interviews || application.interviews.length === 0) ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                কোনো ইন্টারভিউ নির্ধারিত নেই। নতুন সাক্ষাৎকার নির্ধারণ করতে উপরে &quot;Schedule Interview&quot; ক্লিক করুন।
              </div>
            ) : (
              <div className="space-y-3">
                {application.interviews.map((iv: any) => (
                  <div
                    key={iv.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{iv.interviewType} Interview</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          iv.result === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : iv.result === 'FAIL'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          Result: {iv.result || iv.status}
                        </span>
                        {iv.score !== null && iv.score !== undefined && (
                          <span className="font-bold text-slate-700">Score: {iv.score}/100</span>
                        )}
                      </div>
                      <div className="text-slate-500 flex items-center gap-2">
                        <span>Date: {new Date(iv.scheduledAt).toLocaleString()}</span>
                        {iv.interviewer && <span>• Interviewer: {iv.interviewer}</span>}
                      </div>
                      {iv.meetingLink && (
                        <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline block">
                          Meeting Link: {iv.meetingLink}
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedInterviewForScore(iv);
                          setIsScorecardModalOpen(true);
                        }}
                        className="text-xs bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-medium"
                      >
                        <Award className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                        Scorecard Evaluation
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 7. SELECTION TAB */}
        <TabsContent value="selection" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Recruitment Selection Record (চূড়ান্ত নির্বাচন রেকর্ড)
            </h3>
            {isSelected ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Candidate Successfully Selected for Overseas Employment
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-emerald-800 pt-2 border-t border-emerald-200">
                  <div>
                    <span className="text-emerald-700 font-medium">Selected Position:</span>
                    <p className="font-bold">{application.selectedPosition || application.job?.title}</p>
                  </div>
                  <div>
                    <span className="text-emerald-700 font-medium">Selection Date:</span>
                    <p className="font-bold">{new Date(application.selectedAt).toLocaleDateString()}</p>
                  </div>
                  {application.selectionNotes && (
                    <div className="col-span-2">
                      <span className="text-emerald-700 font-medium">Selection Notes:</span>
                      <p className="font-semibold">{application.selectionNotes}</p>
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-emerald-800 font-medium">
                    {application.processingCase ? (
                      <span>Processing Case Active: <strong className="font-mono">{application.processingCase.processingCode}</strong> ({application.processingCase.currentStage})</span>
                    ) : (
                      <span>✓ Candidate Selected. Ready for Post-Selection Processing Workflow.</span>
                    )}
                  </div>
                  {application.processingCase ? (
                    <Link href={`/staff/processing/${application.processingCase.id}`}>
                      <Button size="sm" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                        Open Processing Workflow →
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleStartProcessing}
                      disabled={isSubmittingAction}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    >
                      Start Processing File
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500 text-xs space-y-3">
                <p>এই প্রার্থী এখনো চূড়ান্তভাবে নির্বাচিত হননি (Candidate not yet selected)。</p>
                <Button
                  size="sm"
                  onClick={() => setIsSelectModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Select Candidate Now
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 8. DOCUMENTS TAB */}
        <TabsContent value="documents" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Candidate Compliance Documents (কাগজপত্র ও পাসপোর্ট)
            </h3>
            {(!application.documents || application.documents.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No documents submitted yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {application.documents.map((doc: any) => (
                  <div key={doc.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{doc.fileName}</div>
                      <div className="text-[11px] text-slate-500">{doc.documentType?.name || 'Document'}</div>
                    </div>
                    <span className="font-semibold text-slate-600">{doc.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* FINANCE & LEDGER TAB */}
        <TabsContent value="finance" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  Application Financial Health & Candidate Invoicing
                </h3>
                <p className="text-xs text-slate-500">
                  Itemized invoices, recorded payments, receipts and candidate ledger double-entry tracking.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/staff/invoices?applicantId=${application.applicantId}`}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Manage Invoices &rarr;
                </Link>
              </div>
            </div>

            {/* Quick Invoicing Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="text-[11px] text-slate-500 font-medium">Candidate Account</div>
                <div className="text-sm font-bold text-slate-800 mt-1">{application.applicant?.fullName}</div>
                <div className="text-[10px] text-indigo-600 font-mono">{application.applicant?.trackingNo}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="text-[11px] text-slate-500 font-medium">Demand / Employer</div>
                <div className="text-sm font-bold text-slate-800 mt-1">{application.job?.title}</div>
                <div className="text-[10px] text-slate-500">{application.job?.employer?.companyName}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="text-[11px] text-slate-500 font-medium">Processing Status</div>
                <div className="text-sm font-bold text-emerald-700 mt-1">{application.status}</div>
                <div className="text-[10px] text-slate-500">RL-1892 Standard Billing</div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 9. STATUS HISTORY TAB */}
        <TabsContent value="history" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Immutable Status Transition History (স্ট্যাটাস পরিবর্তনের ইতিহাস)
            </h3>
            <div className="space-y-3">
              {application.statusHistory?.map((h: any, i: number) => (
                <div key={h.id || i} className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {h.fromStatus || h.fromStage || 'START'} ➔ {h.toStatus || h.toStage}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(h.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-600">{h.notes || 'Status updated'}</div>
                  <div className="text-[10px] text-slate-400">Changed by: {h.changedBy?.name || h.changedByRole || 'Staff Officer'}</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 10. NOTES TAB */}
        <TabsContent value="notes" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Recruiter Internal Notes (অভ্যন্তরীণ নোট)
            </h3>
            <p className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-200">
              {application.internalNotes || application.notes || 'No internal notes entered.'}
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL: Shortlist Candidate */}
      <Modal
        isOpen={isShortlistModalOpen}
        onClose={() => setIsShortlistModalOpen(false)}
        title="Shortlist Candidate for Interview (প্রার্থী শর্টলিস্টিং)"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to shortlist <strong>{application.applicant?.fullName}</strong> for the position of <strong>{application.job?.title}</strong>?
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Shortlist Note (মন্তব্য)</label>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              rows={2}
              className="w-full text-xs p-2 rounded-lg border border-slate-200"
              placeholder="Candidate qualifies for employer interview..."
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsShortlistModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleShortlist}
              disabled={isSubmittingAction}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
            >
              {isSubmittingAction ? 'Processing...' : 'Confirm Shortlist'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Schedule Interview */}
      <Modal
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        title="Schedule Candidate Interview (সাক্ষাৎকার নির্ধারণ)"
        maxWidth="md"
      >
        <form onSubmit={handleScheduleInterview} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Interview Type (ধরণ) *</label>
            <select
              value={interviewForm.interviewType}
              onChange={(e) => setInterviewForm({ ...interviewForm, interviewType: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
            >
              <option value="ONLINE">ONLINE (ভিডিও কল / Zoom / Meet)</option>
              <option value="IN_PERSON">IN_PERSON (সরাসরি অফিসে)</option>
              <option value="PHONE">PHONE (টেলিফোন ইন্টারভিউ)</option>
              <option value="EMPLOYER_INTERVIEW">EMPLOYER_INTERVIEW (নিয়োগকারী কোম্পানির সাথে)</option>
              <option value="TECHNICAL">TECHNICAL (কারিগরি পরীক্ষা)</option>
              <option value="FINAL">FINAL (চূড়ান্ত ইন্টারভিউ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Date & Time (তারিখ ও সময়) *</label>
            <input
              type="datetime-local"
              required
              value={interviewForm.scheduledAt}
              onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Interviewer Name (সাক্ষাৎকার গ্রহণকারী)</label>
            <input
              type="text"
              value={interviewForm.interviewerName}
              onChange={(e) => setInterviewForm({ ...interviewForm, interviewerName: e.target.value })}
              placeholder="e.g. Overseas Technical Evaluator"
              className="w-full text-xs p-2 rounded-lg border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Link / Location</label>
            <input
              type="text"
              value={interviewForm.meetingLink}
              onChange={(e) => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })}
              placeholder="https://meet.google.com/... or Office Floor 3"
              className="w-full text-xs p-2 rounded-lg border border-slate-200"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsInterviewModalOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingAction}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              {isSubmittingAction ? 'Scheduling...' : 'Schedule Interview'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Interview Scorecard Evaluation */}
      <Modal
        isOpen={isScorecardModalOpen}
        onClose={() => setIsScorecardModalOpen(false)}
        title="Structured Interview Scorecard (ইন্টারভিউ স্কোরকার্ড মূল্যায়ন)"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitScorecard} className="space-y-4">
          <p className="text-xs text-slate-500">
            প্রত্যেকটি মূল্যায়নের জন্য ১ থেকে ১০ এর মধ্যে স্কোর প্রদান করুন।
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { key: 'technicalSkill', label: '1. Technical Skill (কারিগরি দক্ষতা)' },
              { key: 'experience', label: '2. Work Experience (কাজের অভিজ্ঞতা)' },
              { key: 'communication', label: '3. Communication (যোগাযোগ দক্ষতা)' },
              { key: 'language', label: '4. Language Proficiency (ভাষা জ্ঞান)' },
              { key: 'behaviour', label: '5. Professional Behaviour (আচরণ ও শৃঙ্খলা)' },
              { key: 'jobUnderstanding', label: '6. Job Understanding (কাজের ধারণা)' },
              { key: 'overallImpression', label: '7. Overall Impression (সার্বিক মূল্যায়ন)' },
            ].map((dim) => (
              <div key={dim.key} className="space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>{dim.label}</span>
                  <span className="text-indigo-600 font-black">{(scorecardForm as any)[dim.key]}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={(scorecardForm as any)[dim.key]}
                  onChange={(e) => setScorecardForm({ ...scorecardForm, [dim.key]: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-600"
                />
              </div>
            ))}

            {/* Decision Result */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block font-bold text-slate-700">Final Interview Result (চূড়ান্ত ফলাফল) *</label>
              <select
                value={scorecardForm.result}
                onChange={(e) => setScorecardForm({ ...scorecardForm, result: e.target.value })}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 font-bold bg-white"
              >
                <option value="PASS">PASS (উত্তীর্ণ)</option>
                <option value="FAIL">FAIL (অনুপযুক্ত)</option>
                <option value="PENDING">PENDING (অপেক্ষমান)</option>
                <option value="NO_SHOW">NO_SHOW (অনুপস্থিত)</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block font-bold text-slate-700">Feedback & Remarks (মন্তব্য)</label>
              <textarea
                value={scorecardForm.feedback}
                onChange={(e) => setScorecardForm({ ...scorecardForm, feedback: e.target.value })}
                rows={2}
                placeholder="Candidate performed exceptionally in practical trade test..."
                className="w-full p-2 text-xs rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsScorecardModalOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingAction}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {isSubmittingAction ? 'Saving...' : 'Submit Evaluation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Select Candidate */}
      <Modal
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        title="Confirm Candidate Selection (চূড়ান্ত প্রার্থী নির্বাচন)"
        maxWidth="md"
      >
        <form onSubmit={handleSelectCandidate} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
            <p className="font-bold">⚠️ Notice on Vacancy Quota:</p>
            <p>
              Selecting this candidate will allocate 1 vacancy from the job quota and transition the candidate into Phase 6 post-selection processing.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Selected Position Title</label>
            <input
              type="text"
              value={selectionForm.selectedPosition}
              onChange={(e) => setSelectionForm({ ...selectionForm, selectedPosition: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Selection Notes</label>
            <textarea
              value={selectionForm.selectionNotes}
              onChange={(e) => setSelectionForm({ ...selectionForm, selectionNotes: e.target.value })}
              rows={2}
              placeholder="Candidate selected after client final review..."
              className="w-full text-xs p-2 rounded-lg border border-slate-200"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsSelectModalOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingAction}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSubmittingAction ? 'Selecting...' : 'Confirm Selection'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Reject Application */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Application (আবেদন বাতিল / প্রত্যাখ্যান)"
        maxWidth="md"
      >
        <form onSubmit={handleRejectCandidate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason (কারণ) *</label>
            <select
              value={rejectionForm.rejectionReason}
              onChange={(e) => setRejectionForm({ ...rejectionForm, rejectionReason: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
            >
              <option value="SKILL_MISMATCH">SKILL_MISMATCH (দক্ষতার অসামঞ্জস্যতা)</option>
              <option value="INSUFFICIENT_EXPERIENCE">INSUFFICIENT_EXPERIENCE (অভিজ্ঞতা কম)</option>
              <option value="AGE_NOT_ELIGIBLE">AGE_NOT_ELIGIBLE (বয়সসীমা অতিক্রম)</option>
              <option value="PASSPORT_ISSUE">PASSPORT_ISSUE (পাসপোর্টের মেয়াদজনিত সমস্যা)</option>
              <option value="DOCUMENT_ISSUE">DOCUMENT_ISSUE (কাগজপত্র অসম্পূর্ণ)</option>
              <option value="LANGUAGE_REQUIREMENT">LANGUAGE_REQUIREMENT (ভাষা জ্ঞানের ঘাটতি)</option>
              <option value="INTERVIEW_FAILED">INTERVIEW_FAILED (ইন্টারভিউতে অনুত্তীর্ণ)</option>
              <option value="EMPLOYER_REJECTED">EMPLOYER_REJECTED (নিয়োগকর্তা কর্তৃক বাতিল)</option>
              <option value="VACANCY_FILLED">VACANCY_FILLED (কোটা পূর্ণ হয়ে গেছে)</option>
              <option value="CANDIDATE_UNAVAILABLE">CANDIDATE_UNAVAILABLE (প্রার্থী অনুপলব্ধ)</option>
              <option value="OTHER">OTHER (অন্যান্য কারণ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Internal Notes (অভ্যন্তরীণ নোট - প্রার্থী দেখতে পাবে না)</label>
            <textarea
              value={rejectionForm.internalNotes}
              onChange={(e) => setRejectionForm({ ...rejectionForm, internalNotes: e.target.value })}
              rows={2}
              placeholder="Candidate failed trade practical exam..."
              className="w-full text-xs p-2 rounded-lg border border-slate-200"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingAction}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
            >
              {isSubmittingAction ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Withdraw Application */}
      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        title="Withdraw Application (আবেদন প্রত্যাহার)"
        maxWidth="md"
      >
        <form onSubmit={handleWithdrawApplication} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Withdrawal Reason (প্রত্যাহারের কারণ) *</label>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              required
              rows={2}
              placeholder="Candidate secured domestic employment / personal reason..."
              className="w-full text-xs p-2 rounded-lg border border-slate-200"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsWithdrawModalOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingAction}
              className="bg-slate-800 hover:bg-slate-900 text-white font-medium"
            >
              {isSubmittingAction ? 'Withdrawing...' : 'Confirm Withdrawal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
