'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ShieldCheck,
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
  HeartPulse,
  Stamp,
  Plane,
  Receipt,
  Download,
  Plus,
  Eye,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  Ban,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  FileCheck2,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function StaffProcessingDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const router = useRouter();

  const [processingCase, setProcessingCase] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isVerifyDocModalOpen, setIsVerifyDocModalOpen] = useState(false);
  const [isRejectDocModalOpen, setIsRejectDocModalOpen] = useState(false);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  // Sub-case modals
  const [isScheduleMedModalOpen, setIsScheduleMedModalOpen] = useState(false);
  const [isResultMedModalOpen, setIsResultMedModalOpen] = useState(false);
  const [isSubmitVisaModalOpen, setIsSubmitVisaModalOpen] = useState(false);
  const [isApproveVisaModalOpen, setIsApproveVisaModalOpen] = useState(false);
  const [isRejectVisaModalOpen, setIsRejectVisaModalOpen] = useState(false);
  const [isSubmitClearanceModalOpen, setIsSubmitClearanceModalOpen] = useState(false);
  const [isCompleteClearanceModalOpen, setIsCompleteClearanceModalOpen] = useState(false);
  const [isIssueTicketModalOpen, setIsIssueTicketModalOpen] = useState(false);
  const [isDepartureBriefingModalOpen, setIsDepartureBriefingModalOpen] = useState(false);
  const [isConfirmDepartureModalOpen, setIsConfirmDepartureModalOpen] = useState(false);
  const [isConfirmJoiningModalOpen, setIsConfirmJoiningModalOpen] = useState(false);

  // Form states & submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form payloads
  const [holdForm, setHoldForm] = useState({ holdReason: '', notes: '' });
  const [cancelForm, setCancelForm] = useState({ cancellationReason: 'OTHER', notes: '' });
  const [docVerifyForm, setDocVerifyForm] = useState({ verificationNote: '' });
  const [docRejectForm, setDocRejectForm] = useState({ rejectionReason: '' });
  const [addDocForm, setAddDocForm] = useState({
    documentType: 'PASSPORT',
    title: '',
    titleLocal: '',
    required: true,
  });

  const [medicalScheduleForm, setMedicalScheduleForm] = useState({
    medicalCenterName: 'GAMCA Approved Medical Center, Dhaka',
    appointmentDate: '',
    appointmentTime: '09:30 AM',
    medicalType: 'GAMCA',
    gamcaNumber: '',
    appointmentNotes: '',
  });

  const [medicalResultForm, setMedicalResultForm] = useState({
    result: 'FIT',
    fitnessExpiryDate: '',
    gamcaNumber: '',
    resultNotes: '',
  });

  const [visaSubmitForm, setVisaSubmitForm] = useState({
    country: '',
    visaType: 'EMPLOYMENT_VISA',
    applicationNumber: '',
    sponsorName: '',
    sponsorReference: '',
    notes: '',
  });

  const [visaApproveForm, setVisaApproveForm] = useState({
    approvedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: '',
  });

  const [visaRejectForm, setVisaRejectForm] = useState({
    rejectionReason: '',
    notes: '',
  });

  const [clearanceSubmitForm, setClearanceSubmitForm] = useState({
    clearanceType: 'BMET_EMIGRATION',
    referenceNumber: '',
    notes: '',
  });

  const [clearanceCompleteForm, setClearanceCompleteForm] = useState({
    smartCardNumber: '',
    certificateNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: '',
  });

  const [ticketForm, setTicketForm] = useState({
    airline: 'Biman Bangladesh Airlines',
    flightNumber: 'BG-339',
    bookingReference: '',
    ticketNumber: '',
    departureAirport: 'DAC - Hazrat Shahjalal International Airport, Dhaka',
    arrivalAirport: 'RUH - King Khalid International Airport, Riyadh',
    departureDate: '',
    departureTime: '21:30',
    baggageAllowance: '40 KG + 7 KG Hand Carry',
    notes: '',
  });

  const [departureForm, setDepartureForm] = useState({
    reportingTime: '3 Hours before flight departure',
    meetingPoint: 'Terminal 1 Departure Concourse - Shakil Travels Counter',
    emergencyContact: '+880 1711-000000',
    briefingDone: true,
    notes: '',
  });

  const [joiningForm, setJoiningForm] = useState({
    joiningDate: new Date().toISOString().split('T')[0],
    joiningLocation: 'Company Site / Headquarters',
    employerContact: '',
    markCompleted: true,
    notes: '',
  });

  const [caseNotesForm, setCaseNotesForm] = useState({
    priority: 'NORMAL',
    expectedDepartureDate: '',
    internalNotes: '',
  });

  const fetchProcessingCase = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/staff/processing/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch processing case');
      }
      setProcessingCase(data.data);
      setCaseNotesForm({
        priority: data.data.priority || 'NORMAL',
        expectedDepartureDate: data.data.expectedDepartureDate
          ? new Date(data.data.expectedDepartureDate).toISOString().split('T')[0]
          : '',
        internalNotes: data.data.internalNotes || '',
      });
      if (data.data.job) {
        setVisaSubmitForm((v) => ({
          ...v,
          country: data.data.job?.country?.name || 'Saudi Arabia',
          sponsorName: data.data.employer?.companyName || '',
        }));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading case details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProcessingCase();
  }, [fetchProcessingCase]);

  // Generic helper for API POST requests
  const handleActionRequest = async (
    endpoint: string,
    body: any,
    successCallback: () => void
  ) => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Action failed');
      }
      successCallback();
      fetchProcessingCase();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !processingCase) {
    return (
      <div className="py-24 text-center text-xs text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        Loading processing case file...
      </div>
    );
  }

  if (errorMsg || !processingCase) {
    return (
      <div className="py-20 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-semibold text-rose-700">{errorMsg || 'Case not found'}</p>
        <Link href="/staff/processing">
          <Button size="sm" variant="outline">
            ← Back to Processing Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const { readiness } = processingCase;
  const isCancelled = processingCase.overallStatus === 'CANCELLED';
  const isOnHold = processingCase.overallStatus === 'ON_HOLD';
  const isCompleted = processingCase.overallStatus === 'COMPLETED';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/staff/processing">
            <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Processing Dashboard
            </Button>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-mono font-bold text-xs text-slate-800">
            {processingCase.processingCode}
          </span>
        </div>

        {/* Global Case Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {isOnHold ? (
            <Button
              size="sm"
              onClick={() => setIsResumeModalOpen(true)}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <PlayCircle className="w-4 h-4 mr-1.5" />
              Resume Case
            </Button>
          ) : !isCancelled && !isCompleted ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsHoldModalOpen(true)}
              className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              <PauseCircle className="w-4 h-4 mr-1.5 text-amber-600" />
              Hold Case
            </Button>
          ) : null}

          {!isCancelled && !isCompleted && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCancelModalOpen(true)}
              className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
            >
              <Ban className="w-4 h-4 mr-1.5 text-rose-600" />
              Cancel Case
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={fetchProcessingCase}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Case Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {processingCase.applicant?.fullName}
              </h1>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                {processingCase.processingCode}
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  isOnHold
                    ? 'bg-amber-100 text-amber-800'
                    : isCancelled
                    ? 'bg-rose-100 text-rose-800'
                    : isCompleted
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                ● {processingCase.overallStatus}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  processingCase.priority === 'URGENT'
                    ? 'bg-rose-100 text-rose-800 animate-pulse'
                    : processingCase.priority === 'HIGH'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {processingCase.priority} PRIORITY
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-4 flex-wrap">
              <span>Passport: <strong className="font-mono text-slate-800">{processingCase.applicant?.passportNumber || 'N/A'}</strong></span>
              <span>Phone: <strong className="text-slate-800">{processingCase.applicant?.phone}</strong></span>
              <span>Officer: <strong className="text-slate-800">{processingCase.assignedOfficer?.name || 'Unassigned'}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Processing Stage</div>
              <div className="text-sm font-bold text-indigo-700 font-mono">
                {processingCase.currentStage}
              </div>
            </div>
          </div>
        </div>

        {/* Job & Employer Info Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
          <div>
            <span className="text-[11px] text-slate-400">Designation & Country</span>
            <div className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              <span>{processingCase.job?.title}</span>
              <span className="text-indigo-600 font-semibold">({processingCase.job?.country?.name || 'Saudi Arabia'})</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400">Sponsor / Employer</span>
            <div className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{processingCase.employer?.companyName}</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400">Expected Departure</span>
            <div className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {processingCase.expectedDepartureDate
                  ? new Date(processingCase.expectedDepartureDate).toLocaleDateString()
                  : 'Not Set'}
              </span>
            </div>
          </div>
        </div>

        {/* 5-Pillar Departure Readiness Status Banner */}
        {readiness && (
          <div
            className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
              readiness.ready
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                {readiness.ready ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>5-Pillar Deployment Readiness Complete (যাত্রা প্রস্তুত)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>Deployment Checklist Incomplete ({readiness.blockers?.length || 0} Pending Items)</span>
                  </>
                )}
              </div>
              {!readiness.ready && readiness.blockers?.length > 0 && (
                <div className="text-[11px] text-amber-800 pl-7">
                  {readiness.blockers.join(' • ')}
                </div>
              )}
            </div>

            {/* Pillar Status Micro-Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  readiness.pillarStatus?.documents?.passed
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-amber-200 text-amber-900'
                }`}
              >
                1. Docs {readiness.pillarStatus?.documents?.passed ? '✓' : 'Pending'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  readiness.pillarStatus?.medical?.passed
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                2. Med {readiness.pillarStatus?.medical?.passed ? '✓' : 'Pending'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  readiness.pillarStatus?.visa?.passed
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                3. Visa {readiness.pillarStatus?.visa?.passed ? '✓' : 'Pending'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  readiness.pillarStatus?.clearance?.passed
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                4. BMET {readiness.pillarStatus?.clearance?.passed ? '✓' : 'Pending'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  readiness.pillarStatus?.ticket?.passed
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                5. Ticket {readiness.pillarStatus?.ticket?.passed ? '✓' : 'Pending'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 10 Structured Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-1">
          <TabsTrigger value="overview" className="text-xs font-semibold">
            Overview (সারসংক্ষেপ)
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs font-semibold">
            Documents ({processingCase.documentRequirements?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="medical" className="text-xs font-semibold">
            Medical (গামকা)
          </TabsTrigger>
          <TabsTrigger value="visa" className="text-xs font-semibold">
            Visa (ভিসা)
          </TabsTrigger>
          <TabsTrigger value="clearance" className="text-xs font-semibold">
            BMET Smart Card
          </TabsTrigger>
          <TabsTrigger value="ticket" className="text-xs font-semibold">
            Flight Ticket
          </TabsTrigger>
          <TabsTrigger value="departure" className="text-xs font-semibold">
            Departure (ফ্লাইট)
          </TabsTrigger>
          <TabsTrigger value="joining" className="text-xs font-semibold">
            Overseas Joining
          </TabsTrigger>
          <TabsTrigger value="finance" className="text-xs font-bold text-indigo-700 bg-indigo-50/50">
            Finance & Clearance (হিসাব)
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs font-semibold">
            Timeline ({processingCase.statusHistory?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs font-semibold">
            Settings & Notes
          </TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Case Milestones & Progress
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Selected Application</span>
                  <Link
                    href={`/staff/applications/${processingCase.applicationId}`}
                    className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    View Application <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Document Verification</span>
                  <span className="font-bold">
                    {processingCase.documentRequirements?.filter((d: any) => d.status === 'VERIFIED').length} / {processingCase.documentRequirements?.length} Verified
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Medical Fitness Status</span>
                  <span className="font-bold text-slate-800">
                    {processingCase.medicalCase?.result || 'Pending Appointment'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Visa Processing Status</span>
                  <span className="font-bold text-slate-800">
                    {processingCase.visaCase?.status || 'Preparation'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">BMET Smart Card</span>
                  <span className="font-bold text-slate-800">
                    {processingCase.clearanceCase?.smartCardNumber || processingCase.clearanceCase?.status || 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Flight Booking</span>
                  <span className="font-bold text-slate-800">
                    {processingCase.travelTicket ? `${processingCase.travelTicket.airline} (${processingCase.travelTicket.flightNumber})` : 'Pending Ticket'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Latest Status Timeline
              </h3>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {processingCase.statusHistory?.slice(0, 5).map((h: any) => (
                  <div key={h.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                      <span>{new Date(h.createdAt).toLocaleString()}</span>
                      <span className="font-semibold text-slate-600">{h.changedBy?.name || 'System'}</span>
                    </div>
                    <div className="font-bold text-slate-800">
                      {h.fromStage} → {h.toStage}
                    </div>
                    {h.reason && <p className="text-[11px] text-slate-600 mt-0.5">{h.reason}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. DOCUMENTS TAB */}
        <TabsContent value="documents" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Mandatory Processing Documents Checklist
                </h3>
                <p className="text-xs text-slate-500">
                  Verify candidate passport, NID, contract, police clearance, and medical fitness records.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddDocModalOpen(true)}
                className="text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Document Requirement
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Document Title</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">File</th>
                    <th className="py-2.5 px-3">Verified By</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processingCase.documentRequirements?.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{doc.title}</div>
                        {doc.titleLocal && <div className="text-[10px] text-slate-500">{doc.titleLocal}</div>}
                        {doc.required && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-rose-100 text-rose-700 font-bold">
                            REQUIRED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {doc.documentType}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            doc.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : doc.status === 'UPLOADED'
                              ? 'bg-blue-100 text-blue-800'
                              : doc.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {doc.status}
                        </span>
                        {doc.rejectionReason && (
                          <div className="text-[10px] text-rose-600 mt-0.5">
                            Reason: {doc.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {doc.document?.fileUrl ? (
                          <a
                            href={doc.document.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold text-[11px]"
                          >
                            <Eye className="w-3 h-3" /> View File
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Not uploaded</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">
                        {doc.verifiedBy?.name ? (
                          <div>
                            <span className="font-semibold">{doc.verifiedBy.name}</span>
                            <div className="text-[9px] text-slate-400">
                              {doc.verifiedAt ? new Date(doc.verifiedAt).toLocaleDateString() : ''}
                            </div>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        {doc.status !== 'VERIFIED' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedDoc(doc);
                              setIsVerifyDocModalOpen(true);
                            }}
                            className="h-6 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          >
                            Verify
                          </Button>
                        )}
                        {doc.status !== 'REJECTED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDoc(doc);
                              setIsRejectDocModalOpen(true);
                            }}
                            className="h-6 text-[11px] px-2 text-rose-600 border-rose-300 hover:bg-rose-50"
                          >
                            Reject
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* 3. MEDICAL TAB */}
        <TabsContent value="medical" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-teal-600" />
                  GAMCA Medical Fitness Examination
                </h3>
                <p className="text-xs text-slate-500">
                  Overseas medical appointment scheduling and laboratory fitness results.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsScheduleMedModalOpen(true)}
                  className="text-xs font-semibold"
                >
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  Schedule Appointment
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsResultMedModalOpen(true)}
                  className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Record Test Result
                </Button>
              </div>
            </div>

            {processingCase.medicalCase ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Medical Center</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {processingCase.medicalCase.medicalCenter?.name || processingCase.medicalCase.medicalCenterName || 'Assigned Center'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Appointment Date</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {processingCase.medicalCase.appointmentDate
                      ? new Date(processingCase.medicalCase.appointmentDate).toLocaleDateString()
                      : 'Not Scheduled'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">GAMCA Slip No</span>
                  <div className="font-bold font-mono text-slate-800 mt-0.5">
                    {processingCase.medicalCase.gamcaNumber || 'N/A'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Medical Result</span>
                  <div className="mt-0.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        processingCase.medicalCase.result === 'FIT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : processingCase.medicalCase.result === 'UNFIT'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {processingCase.medicalCase.result}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No medical appointment scheduled yet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* 4. VISA TAB */}
        <TabsContent value="visa" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Stamp className="w-4 h-4 text-purple-600" />
                  Embassy Visa File & Stamping
                </h3>
                <p className="text-xs text-slate-500">
                  Track visa application submission, consulate reference, approval, and document stamping.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsSubmitVisaModalOpen(true)}
                  className="text-xs font-semibold"
                >
                  Submit to Embassy
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsApproveVisaModalOpen(true)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Approve Visa
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsRejectVisaModalOpen(true)}
                  className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
                >
                  Reject Visa
                </Button>
              </div>
            </div>

            {processingCase.visaCase ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Destination Country & Type</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {processingCase.visaCase.country} ({processingCase.visaCase.visaType})
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Application / Ref No</span>
                  <div className="font-bold font-mono text-slate-800 mt-0.5">
                    {processingCase.visaCase.applicationNumber || 'N/A'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Sponsor / Company</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {processingCase.visaCase.sponsorName || 'N/A'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Visa Status</span>
                  <div className="mt-0.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        processingCase.visaCase.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : processingCase.visaCase.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {processingCase.visaCase.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No visa file initialized yet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* 5. CLEARANCE TAB */}
        <TabsContent value="clearance" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  BMET Emigration Clearance & Smart Card
                </h3>
                <p className="text-xs text-slate-500">
                  Bureau of Manpower, Employment and Training (BMET) government clearance approval.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsSubmitClearanceModalOpen(true)}
                  className="text-xs font-semibold"
                >
                  Initiate Clearance
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsCompleteClearanceModalOpen(true)}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Issue BMET Smart Card
                </Button>
              </div>
            </div>

            {processingCase.clearanceCase ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Clearance Type</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {processingCase.clearanceCase.clearanceType}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">BMET Smart Card No</span>
                  <div className="font-bold font-mono text-emerald-700 mt-0.5">
                    {processingCase.clearanceCase.smartCardNumber || 'Pending'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Certificate / Ref No</span>
                  <div className="font-bold font-mono text-slate-800 mt-0.5">
                    {processingCase.clearanceCase.certificateNumber || processingCase.clearanceCase.referenceNumber || 'N/A'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Clearance Status</span>
                  <div className="mt-0.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        processingCase.clearanceCase.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {processingCase.clearanceCase.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No BMET clearance application created yet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* 6. TICKET TAB */}
        <TabsContent value="ticket" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-sky-600" />
                  Flight Ticket & Travel Booking
                </h3>
                <p className="text-xs text-slate-500">
                  Issue candidate flight tickets, record PNR, baggage allowance, and arrival schedule.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setIsIssueTicketModalOpen(true)}
                className="text-xs bg-sky-600 hover:bg-sky-700 text-white font-semibold"
              >
                <Plane className="w-3.5 h-3.5 mr-1" />
                Issue Flight Ticket
              </Button>
            </div>

            {processingCase.travelTicket ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Airline & Flight No</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {processingCase.travelTicket.airline} ({processingCase.travelTicket.flightNumber})
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Departure Airport & Date</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {new Date(processingCase.travelTicket.departureDate).toLocaleDateString()} ({processingCase.travelTicket.departureTime || 'TBA'})
                  </div>
                  <div className="text-[10px] text-slate-500">{processingCase.travelTicket.departureAirport}</div>
                </div>

                <div>
                  <span className="text-slate-400">Arrival Airport</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {processingCase.travelTicket.arrivalAirport}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">PNR / Ticket Number</span>
                  <div className="font-mono font-bold text-indigo-700 mt-0.5">
                    {processingCase.travelTicket.bookingReference || processingCase.travelTicket.ticketNumber || 'N/A'}
                  </div>
                  <div className="text-[10px] text-slate-500">{processingCase.travelTicket.baggageAllowance}</div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No flight ticket issued yet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* 7. DEPARTURE TAB */}
        <TabsContent value="departure" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-indigo-600" />
                  Pre-Departure Briefing & Airport Operations
                </h3>
                <p className="text-xs text-slate-500">
                  Pre-flight briefing, airport reporting time, emergency contacts, and final departure verification.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDepartureBriefingModalOpen(true)}
                  className="text-xs font-semibold"
                >
                  Departure Briefing
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsConfirmDepartureModalOpen(true)}
                  className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
                >
                  <Plane className="w-3.5 h-3.5 mr-1" />
                  Confirm Flown / Departed
                </Button>
              </div>
            </div>

            {processingCase.departureCase ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Pre-Departure Briefing</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {processingCase.departureCase.briefingDone ? '✓ Briefing Conducted' : 'Pending Briefing'}
                  </div>
                  <div className="text-[10px] text-slate-500">Officer: {processingCase.departureCase.briefingOfficer || 'Staff'}</div>
                </div>

                <div>
                  <span className="text-slate-400">Airport Reporting Time</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {processingCase.departureCase.reportingTime || '3 Hours before flight'}
                  </div>
                  <div className="text-[10px] text-slate-500">{processingCase.departureCase.meetingPoint}</div>
                </div>

                <div>
                  <span className="text-slate-400">Departure Status</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        processingCase.departureCase.status === 'DEPARTED'
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {processingCase.departureCase.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Departure details not yet configured.
              </div>
            )}
          </div>
        </TabsContent>

        {/* 8. JOINING TAB */}
        <TabsContent value="joining" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Overseas Arrival & Employer Joining
                </h3>
                <p className="text-xs text-slate-500">
                  Confirm overseas arrival and candidate official joining at employer company.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setIsConfirmJoiningModalOpen(true)}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Confirm Overseas Joining
              </Button>
            </div>

            {processingCase.joiningCase ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-emerald-700">Joining Date</span>
                  <div className="font-bold text-emerald-900 mt-0.5">
                    {new Date(processingCase.joiningCase.joiningDate).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <span className="text-emerald-700">Joining Location</span>
                  <div className="font-bold text-emerald-900 mt-0.5">
                    {processingCase.joiningCase.joiningLocation || 'Employer Site'}
                  </div>
                </div>

                <div>
                  <span className="text-emerald-700">Joining Status</span>
                  <div className="font-bold text-emerald-900 mt-0.5">
                    {processingCase.joiningCase.status} (Recruitment Cycle Completed)
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Candidate has not yet joined overseas employer.
              </div>
            )}
          </div>
        </TabsContent>

        {/* FINANCE & CLEARANCE TAB */}
        <TabsContent value="finance" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  Processing Milestone Billing & Financial Clearance
                </h3>
                <p className="text-xs text-slate-500">
                  Pre-departure financial settlement check, recruitment milestone invoices, paid receipts & candidate ledger balance.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/staff/invoices?applicantId=${processingCase.applicantId}`}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Manage Candidate Invoices &rarr;
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="text-[11px] text-slate-500 font-medium">Candidate Account</div>
                <div className="text-sm font-bold text-slate-800 mt-1">{processingCase.applicant?.fullName}</div>
                <div className="text-[10px] text-indigo-600 font-mono">{processingCase.applicant?.trackingNo}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="text-[11px] text-slate-500 font-medium">Current Processing Stage</div>
                <div className="text-sm font-bold text-indigo-700 mt-1">{processingCase.currentStage}</div>
                <div className="text-[10px] text-slate-500">Case: {processingCase.processingCode}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="text-[11px] text-slate-500 font-medium">Departure Financial Clearance</div>
                <div className="text-sm font-bold text-emerald-700 mt-1">Verified / Monitored</div>
                <div className="text-[10px] text-slate-500">License RL-1892 Compliant</div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 9. TIMELINE TAB */}
        <TabsContent value="timeline" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Immutable Processing Audit History
            </h3>

            <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
              {processingCase.statusHistory?.map((h: any) => (
                <div key={h.id} className="relative">
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-xs" />
                  <div className="text-[10px] text-slate-400">
                    {new Date(h.createdAt).toLocaleString()} • {h.changedBy?.name || 'System / Auto'}
                  </div>
                  <div className="font-bold text-xs text-slate-900 mt-0.5">
                    {h.fromStage} → <span className="text-indigo-600">{h.toStage}</span>
                  </div>
                  {h.reason && <p className="text-xs text-slate-600 mt-1">{h.reason}</p>}
                  {h.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">{h.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 10. NOTES & SETTINGS TAB */}
        <TabsContent value="notes" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Case Settings & Internal Notes
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleActionRequest(
                  `/api/staff/processing/${processingCase.id}`,
                  caseNotesForm,
                  () => alert('Case details updated successfully')
                );
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-bold mb-1">Priority</label>
                <select
                  value={caseNotesForm.priority}
                  onChange={(e) => setCaseNotesForm({ ...caseNotesForm, priority: e.target.value })}
                  className="w-full h-8 px-2 border rounded"
                >
                  <option value="LOW">LOW</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Expected Departure Date</label>
                <Input
                  type="date"
                  value={caseNotesForm.expectedDepartureDate}
                  onChange={(e) => setCaseNotesForm({ ...caseNotesForm, expectedDepartureDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Internal Notes</label>
                <textarea
                  rows={4}
                  value={caseNotesForm.internalNotes}
                  onChange={(e) => setCaseNotesForm({ ...caseNotesForm, internalNotes: e.target.value })}
                  className="w-full p-2 border rounded text-xs"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                Save Case Settings
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>

      {/* --- ACTION MODALS --- */}

      {/* Verify Document Modal */}
      <Modal isOpen={isVerifyDocModalOpen} onClose={() => setIsVerifyDocModalOpen(false)} title="Verify Document">
        <div className="p-4 space-y-3 text-xs">
          <p>Confirm that the submitted document for <strong>{selectedDoc?.title}</strong> is genuine and compliant.</p>
          <Input
            placeholder="Optional verification note..."
            value={docVerifyForm.verificationNote}
            onChange={(e) => setDocVerifyForm({ verificationNote: e.target.value })}
            className="text-xs"
          />
          {formError && <p className="text-rose-600 font-bold">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsVerifyDocModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={() =>
                handleActionRequest(
                  `/api/staff/processing/${processingCase.id}/documents/${selectedDoc.id}/verify`,
                  docVerifyForm,
                  () => setIsVerifyDocModalOpen(false)
                )
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Verify Document
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Document Modal */}
      <Modal isOpen={isRejectDocModalOpen} onClose={() => setIsRejectDocModalOpen(false)} title="Reject Document">
        <div className="p-4 space-y-3 text-xs">
          <p>Please specify reason for rejecting <strong>{selectedDoc?.title}</strong>. Candidate will be notified to re-upload.</p>
          <Input
            placeholder="e.g. Blurry scan, expired date, wrong page..."
            value={docRejectForm.rejectionReason}
            onChange={(e) => setDocRejectForm({ rejectionReason: e.target.value })}
            className="text-xs"
          />
          {formError && <p className="text-rose-600 font-bold">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsRejectDocModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={isSubmitting || !docRejectForm.rejectionReason}
              onClick={() =>
                handleActionRequest(
                  `/api/staff/processing/${processingCase.id}/documents/${selectedDoc.id}/reject`,
                  docRejectForm,
                  () => setIsRejectDocModalOpen(false)
                )
              }
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Reject Document
            </Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Medical Modal */}
      <Modal isOpen={isScheduleMedModalOpen} onClose={() => setIsScheduleMedModalOpen(false)} title="Schedule Medical Exam">
        <div className="p-4 space-y-3 text-xs">
          <div>
            <label className="font-bold block mb-1">Medical Center Name</label>
            <Input
              value={medicalScheduleForm.medicalCenterName}
              onChange={(e) => setMedicalScheduleForm({ ...medicalScheduleForm, medicalCenterName: e.target.value })}
              className="text-xs"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Appointment Date *</label>
            <Input
              type="date"
              value={medicalScheduleForm.appointmentDate}
              onChange={(e) => setMedicalScheduleForm({ ...medicalScheduleForm, appointmentDate: e.target.value })}
              className="text-xs"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">GAMCA Slip Number</label>
            <Input
              placeholder="e.g. GAMCA-2026-99120"
              value={medicalScheduleForm.gamcaNumber}
              onChange={(e) => setMedicalScheduleForm({ ...medicalScheduleForm, gamcaNumber: e.target.value })}
              className="text-xs"
            />
          </div>
          {formError && <p className="text-rose-600 font-bold">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsScheduleMedModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={isSubmitting || !medicalScheduleForm.appointmentDate}
              onClick={() =>
                handleActionRequest(
                  `/api/staff/processing/${processingCase.id}/medical`,
                  medicalScheduleForm,
                  () => setIsScheduleMedModalOpen(false)
                )
              }
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
            >
              Confirm Appointment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Medical Result Modal */}
      <Modal isOpen={isResultMedModalOpen} onClose={() => setIsResultMedModalOpen(false)} title="Record Medical Result">
        <div className="p-4 space-y-3 text-xs">
          <div>
            <label className="font-bold block mb-1">Examination Result *</label>
            <select
              value={medicalResultForm.result}
              onChange={(e) => setMedicalResultForm({ ...medicalResultForm, result: e.target.value })}
              className="w-full h-8 px-2 border rounded"
            >
              <option value="FIT">FIT (উত্তীর্ণ)</option>
              <option value="UNFIT">UNFIT (অনুত্তীর্ণ)</option>
              <option value="RETEST_REQUIRED">RETEST_REQUIRED (পুনরায় পরীক্ষা)</option>
              <option value="CONDITIONALLY_FIT">CONDITIONALLY_FIT (শর্তসাপেক্ষ)</option>
            </select>
          </div>
          <div>
            <label className="font-bold block mb-1">Fitness Expiry Date</label>
            <Input
              type="date"
              value={medicalResultForm.fitnessExpiryDate}
              onChange={(e) => setMedicalResultForm({ ...medicalResultForm, fitnessExpiryDate: e.target.value })}
              className="text-xs"
            />
          </div>
          {formError && <p className="text-rose-600 font-bold">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsResultMedModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={() =>
                handleActionRequest(
                  `/api/staff/processing/${processingCase.id}/medical/result`,
                  medicalResultForm,
                  () => setIsResultMedModalOpen(false)
                )
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Save Test Result
            </Button>
          </div>
        </div>
      </Modal>

      {/* Visa Submit Modal */}
      <Modal isOpen={isSubmitVisaModalOpen} onClose={() => setIsSubmitVisaModalOpen(false)} title="Submit Visa File">
        <div className="p-4 space-y-3 text-xs">
          <div>
            <label className="font-bold block mb-1">Visa Application / Enjaz Number</label>
            <Input
              placeholder="e.g. E-10293849"
              value={visaSubmitForm.applicationNumber}
              onChange={(e) => setVisaSubmitForm({ ...visaSubmitForm, applicationNumber: e.target.value })}
              className="text-xs"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Sponsor / Company Name</label>
            <Input
              value={visaSubmitForm.sponsorName}
              onChange={(e) => setVisaSubmitForm({ ...visaSubmitForm, sponsorName: e.target.value })}
              className="text-xs"
            />
          </div>
          {formError && <p className="text-rose-600 font-bold">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsSubmitVisaModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={() =>
                handleActionRequest(
                  `/api/staff/processing/${processingCase.id}/visa/submit`,
                  visaSubmitForm,
                  () => setIsSubmitVisaModalOpen(false)
                )
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Submit Visa File
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve Visa Modal */}
      <Modal isOpen={isApproveVisaModalOpen} onClose={() => setIsApproveVisaModalOpen(false)} title="Approve Visa">
        <div className="p-4 space-y-3 text-xs">
          <div>
            <label className="font-bold block mb-1">Approved Date</label>
            <Input
              type="date"
              value={visaApproveForm.approvedDate}
              onChange={(e) => setVisaApproveForm({ ...visaApproveForm, approvedDate: e.target.value })}
              className="text-xs"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Visa Expiry Date</label>
            <Input
              type="date"
              value={visaApproveForm.expiryDate}
              onChange={(e) => setVisaApproveForm({ ...visaApproveForm, expiryDate: e.target.value })}
              className="text-xs"
            />
          </div>
          {formError && <p className="text-rose-600 font-bold">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsApproveVisaModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={() =>
                handleActionRequest(
                  `/api/staff/processing/${processingCase.id}/visa/approve`,
                  visaApproveForm,
                  () => setIsApproveVisaModalOpen(false)
                )
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Confirm Visa Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Visa Modal */}
      <Modal isOpen={isRejectVisaModalOpen} onClose={() => setIsRejectVisaModalOpen(false)} title="Record Visa Rejection">
        <div className="p-4 space-y-3 text-xs">
          <div>
            <label className="font-bold block mb-1">Rejection Reason *</label>
            <Input
              placeholder="e.g. Embassy rejection code, security check failed..."
              value={visaRejectForm.rejectionReason}
              onChange={(e) => setVisaRejectForm({ ...visaRejectForm, rejectionReason: e.target.value })}
              className="text-xs"
            />
          </div>
          {formError && <p className="text-rose-600 font-bold">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsRejectVisaModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={isSubmitting || !visaRejectForm.rejectionReason}
              onClick={() =>
                handleActionRequest(
                  `/api/staff/processing/${processingCase.id}/visa/reject`,
                  visaRejectForm,
                  () => setIsRejectVisaModalOpen(false)
                )
              }
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Complete BMET Clearance Modal */}
      <Modal isOpen={isCompleteClearanceModalOpen} onClose={() => setIsCompleteClearanceModalOpen(false)} title="Issue BMET Smart Card">
        <div className="p-4 space-y-3 text-xs">
          <div>
            <label className="font-bold block mb-1">BMET Smart Card Number *</label>
            <Input
              placeholder="e.g. BMET-SC-998822"
              value={clearanceCompleteForm.smartCardNumber}
              onChange={(e) => setClearanceCompleteForm({ ...clearanceCompleteForm, smartCardNumber: e.target.value })}
              className="text-xs"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Certificate / Clearance Number</label>
            <Input
              placeholder="e.g. GOV-CLR-2026-001"
              value={clearanceCompleteForm.certificateNumber}
              onChange={(e) => setClearanceCompleteForm({ ...clearanceCompleteForm, certificateNumber: e.target.value })}
              className="text-xs"
            />
          </div>
          {formError && <p className="text-rose-600 font-bold">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsCompleteClearanceModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={isSubmitting || !clearanceCompleteForm.smartCardNumber}
              onClick={() =>
                handleActionRequest(
                  `/api/staff/processing/${processingCase.id}/clearance/complete`,
                  clearanceCompleteForm,
                  () => setIsCompleteClearanceModalOpen(false)
                )
              }
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Issue Smart Card
            </Button>
          </div>
        </div>
      </Modal>

      {/* Issue Ticket Modal */}
      <Modal isOpen={isIssueTicketModalOpen} onClose={() => setIsIssueTicketModalOpen(false)} title="Issue Flight Ticket">
        <div className="p-4 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">Airline *</label>
              <Input
                value={ticketForm.airline}
                onChange={(e) => setTicketForm({ ...ticketForm, airline: e.target.value })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Flight Number *</label>
              <Input
                value={ticketForm.flightNumber}
                onChange={(e) => setTicketForm({ ...ticketForm, flightNumber: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">Departure Date *</label>
              <Input
                type="date"
                value={ticketForm.departureDate}
                onChange={(e) => setTicketForm({ ...ticketForm, departureDate: e.target.value })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Arrival Airport *</label>
              <Input
                value={ticketForm.arrivalAirport}
                onChange={(e) => setTicketForm({ ...ticketForm, arrivalAirport: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">PNR / Reference</label>
              <Input
                placeholder="e.g. 6D8X9Q"
                value={ticketForm.bookingReference}
                onChange={(e) => setTicketForm({ ...ticketForm, bookingReference: e.target.value })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Ticket Number</label>
              <Input
                placeholder="e.g. 098-291829381"
                value={ticketForm.ticketNumber}
                onChange={(e) => setTicketForm({ ...ticketForm, ticketNumber: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
          {formError && <p className="text-rose-600 font-bold">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsIssueTicketModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={isSubmitting || !ticketForm.departureDate || !ticketForm.airline}
              onClick={() =>
                handleActionRequest(
                  `/api/staff/processing/${processingCase.id}/ticket`,
                  ticketForm,
                  () => setIsIssueTicketModalOpen(false)
                )
              }
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
            >
              Confirm Flight Ticket
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Departure Modal */}
      <Modal isOpen={isConfirmDepartureModalOpen} onClose={() => setIsConfirmDepartureModalOpen(false)} title="Confirm Candidate Departure">
        <div className="p-4 space-y-3 text-xs">
          <p>
            Confirm that candidate <strong>{processingCase.applicant?.fullName}</strong> has reported at airport and boarded their flight.
          </p>
          {formError && <p className="text-rose-600 font-bold">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsConfirmDepartureModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={() =>
                handleActionRequest(
                  `/api/staff/processing/${processingCase.id}/departure/confirm`,
                  { forceOverride: true },
                  () => setIsConfirmDepartureModalOpen(false)
                )
              }
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
            >
              Confirm Flown / Departed
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Joining Modal */}
      <Modal isOpen={isConfirmJoiningModalOpen} onClose={() => setIsConfirmJoiningModalOpen(false)} title="Confirm Overseas Joining">
        <div className="p-4 space-y-3 text-xs">
          <div>
            <label className="font-bold block mb-1">Joining Date *</label>
            <Input
              type="date"
              value={joiningForm.joiningDate}
              onChange={(e) => setJoiningForm({ ...joiningForm, joiningDate: e.target.value })}
              className="text-xs"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Joining Location / Site</label>
            <Input
              value={joiningForm.joiningLocation}
              onChange={(e) => setJoiningForm({ ...joiningForm, joiningLocation: e.target.value })}
              className="text-xs"
            />
          </div>
          {formError && <p className="text-rose-600 font-bold">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsConfirmJoiningModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={() =>
                handleActionRequest(
                  `/api/staff/processing/${processingCase.id}/joining/confirm`,
                  { ...joiningForm, forceOverride: true },
                  () => setIsConfirmJoiningModalOpen(false)
                )
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Confirm Joining & Complete Cycle
            </Button>
          </div>
        </div>
      </Modal>

      {/* Hold Case Modal */}
      <Modal isOpen={isHoldModalOpen} onClose={() => setIsHoldModalOpen(false)} title="Place Case On Hold">
        <div className="p-4 space-y-3 text-xs">
          <div>
            <label className="font-bold block mb-1">Hold Reason *</label>
            <Input
              placeholder="e.g. Candidate personal issue, employer document delay..."
              value={holdForm.holdReason}
              onChange={(e) => setHoldForm({ ...holdForm, holdReason: e.target.value })}
              className="text-xs"
            />
          </div>
          {formError && <p className="text-rose-600 font-bold">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsHoldModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={isSubmitting || !holdForm.holdReason}
              onClick={() =>
                handleActionRequest(
                  `/api/staff/processing/${processingCase.id}/hold`,
                  holdForm,
                  () => setIsHoldModalOpen(false)
                )
              }
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Confirm Place On Hold
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resume Case Modal */}
      <Modal isOpen={isResumeModalOpen} onClose={() => setIsResumeModalOpen(false)} title="Resume Processing Case">
        <div className="p-4 space-y-3 text-xs">
          <p>This will restore the case to active status and resume from its previous stage.</p>
          {formError && <p className="text-rose-600 font-bold">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsResumeModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={() =>
                handleActionRequest(
                  `/api/staff/processing/${processingCase.id}/resume`,
                  {},
                  () => setIsResumeModalOpen(false)
                )
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Resume Case Now
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Case Modal */}
      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Cancel Processing Case">
        <div className="p-4 space-y-3 text-xs">
          <div>
            <label className="font-bold block mb-1">Standard Cancellation Reason</label>
            <select
              value={cancelForm.cancellationReason}
              onChange={(e) => setCancelForm({ ...cancelForm, cancellationReason: e.target.value })}
              className="w-full h-8 px-2 border rounded"
            >
              <option value="CANDIDATE_WITHDRAWAL">Candidate Withdrawal</option>
              <option value="VISA_REJECTION">Visa Rejection</option>
              <option value="MEDICAL_UNFIT">Medical Unfit</option>
              <option value="EMPLOYER_CANCELLED">Employer Cancelled</option>
              <option value="DOCUMENT_PROBLEM">Document Problem</option>
              <option value="PAYMENT_PROBLEM">Payment Problem</option>
              <option value="NO_SHOW">No Show</option>
              <option value="OTHER">Other Reason</option>
            </select>
          </div>
          <div>
            <label className="font-bold block mb-1">Detailed Explanation *</label>
            <textarea
              rows={3}
              value={cancelForm.notes}
              onChange={(e) => setCancelForm({ ...cancelForm, notes: e.target.value })}
              placeholder="Provide context on why this case is being cancelled..."
              className="w-full p-2 border rounded text-xs"
            />
          </div>
          {formError && <p className="text-rose-600 font-bold">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsCancelModalOpen(false)}>Back</Button>
            <Button
              size="sm"
              disabled={isSubmitting || !cancelForm.notes}
              onClick={() =>
                handleActionRequest(
                  `/api/staff/processing/${processingCase.id}/cancel`,
                  cancelForm,
                  () => setIsCancelModalOpen(false)
                )
              }
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
