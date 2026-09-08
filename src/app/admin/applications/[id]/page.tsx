'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  ArrowLeft,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
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
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Status transition modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);

  // Staff assignment modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  // Document verification modal
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docVerifyStatus, setDocVerifyStatus] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // Schedule Interview modal
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [interviewType, setInterviewType] = useState('IN_PERSON');
  const [scheduledDate, setScheduledDate] = useState('');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  // Upload Document modal
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docNumber, setDocNumber] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const fetchApplicationDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${id}`);
      const data = await res.json();
      if (data.success) {
        setApplication(data.data);
        setTargetStatus(data.data.currentStatus);
        setSelectedStaffId(data.data.assignedToId || '');
      }
    } catch (err) {
      console.error('Failed to load application', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplicationDetails();
  }, [fetchApplicationDetails]);

  // Load staff users and doc types
  useEffect(() => {
    async function loadData() {
      try {
        const [staffRes, docTypeRes] = await Promise.all([
          fetch('/api/users?isActive=true&limit=50'),
          fetch('/api/document-types?isActive=true'),
        ]);
        const [staffData, docTypeData] = await Promise.all([staffRes.json(), docTypeRes.json()]);
        if (staffData.success) setStaffList(staffData.data?.items || []);
        if (docTypeData.success) {
          setDocTypes(docTypeData.data || []);
          if (docTypeData.data?.length > 0) setSelectedDocTypeId(docTypeData.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load aux data', err);
      }
    }
    loadData();
  }, []);

  const handleStatusTransition = async (forceOverride = false) => {
    setStatusError(null);
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
        setStatusError(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      setStatusError(err.message || 'Error updating status');
    }
  };

  const handleAssignStaff = async () => {
    try {
      const res = await fetch(`/api/applications/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedToId: selectedStaffId || null,
          internalNotes: assignNotes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAssignModalOpen(false);
        fetchApplicationDetails();
      }
    } catch (err) {
      console.error('Error assigning staff', err);
    }
  };

  const handleVerifyDocument = async () => {
    if (!selectedDoc) return;
    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: docVerifyStatus,
          rejectionReason: docVerifyStatus === 'REJECTED' ? rejectionReason : undefined,
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
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate) return;
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: application.applicantId,
          applicationId: application.id,
          interviewType,
          scheduledDate,
          location: location || undefined,
          meetingLink: meetingLink || undefined,
          notes: interviewNotes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsInterviewModalOpen(false);
        setInterviewNotes('');
        fetchApplicationDetails();
      }
    } catch (err) {
      console.error('Error scheduling interview', err);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !selectedDocTypeId) return;
    setIsUploadingDoc(true);

    try {
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('applicantId', application.applicantId);
      formData.append('applicationId', application.id);
      formData.append('documentTypeId', selectedDocTypeId);
      if (docNumber) formData.append('documentNumber', docNumber);

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
        Loading application case file...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="py-24 text-center text-slate-600">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900">Application Not Found</h2>
        <Link href="/admin/applications" className="text-primary-600 font-medium text-sm mt-2 inline-block">
          Return to Applications List
        </Link>
      </div>
    );
  }

  const { applicant, job, assignedTo, statusHistory, documents, interviews, invoices } = application;

  const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + Number(inv.totalAmount), 0);
  const totalPaid = invoices.reduce((sum: number, inv: any) => sum + Number(inv.paidAmount), 0);
  const totalDue = invoices.reduce((sum: number, inv: any) => sum + Number(inv.dueAmount), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <Link href="/admin/applications" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications
        </Link>
        <div className="text-xs text-slate-400">
          Created: {new Date(application.createdAt).toLocaleString()}
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-lg overflow-hidden shrink-0 border border-slate-300">
            {applicant.profilePhoto ? (
              <img src={applicant.profilePhoto} alt={applicant.fullName} className="w-full h-full object-cover" />
            ) : (
              applicant.fullName.substring(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{applicant.fullName}</h1>
              <Badge variant="navy">{application.applicationNumber}</Badge>
              <Badge variant="gold">{application.currentStatus.replace(/_/g, ' ')}</Badge>
            </div>
            <div className="text-sm text-slate-600 flex flex-wrap items-center gap-3 mt-1.5">
              <span>Candidate ID: <strong>{applicant.applicantNumber}</strong></span>
              <span>•</span>
              <span>Passport: <strong>{applicant.passportNumber || 'N/A'}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Target Job: <strong className="text-slate-900">{job.title}</strong> ({job.country.name})
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setIsStatusModalOpen(true)} className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs">
            <ArrowRightCircle className="w-4 h-4" /> Advance Stage
          </Button>
          <Button variant="outline" onClick={() => setIsAssignModalOpen(true)} className="flex items-center gap-1.5 text-xs border-slate-300">
            <UserPlus className="w-4 h-4" /> Assign Staff
          </Button>
          <Button variant="outline" onClick={() => setIsInterviewModalOpen(true)} className="flex items-center gap-1.5 text-xs border-slate-300">
            <CalendarCheck className="w-4 h-4" /> Schedule Interview
          </Button>
          <Link href={`/admin/invoices/new?applicantId=${applicant.id}&applicationId=${application.id}`}>
            <Button variant="outline" className="flex items-center gap-1.5 text-xs border-slate-300">
              <Receipt className="w-4 h-4" /> Generate Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-lg border border-slate-200">
          <TabsTrigger value="overview" className="text-xs font-semibold px-4 py-2">
            Overview & Profile
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs font-semibold px-4 py-2">
            Stage Timeline ({statusHistory.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs font-semibold px-4 py-2">
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="interviews" className="text-xs font-semibold px-4 py-2">
            Interviews ({interviews.length})
          </TabsTrigger>
          <TabsTrigger value="finance" className="text-xs font-semibold px-4 py-2">
            Financial Ledger ({invoices.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Candidate Specs */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-primary-600" /> Candidate Profile
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Phone</span>
                  <span className="font-semibold text-slate-800">{applicant.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email</span>
                  <span className="font-semibold text-slate-800">{applicant.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Passport Expiry</span>
                  <span className="font-semibold text-slate-800">
                    {applicant.passportExpiry ? new Date(applicant.passportExpiry).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Experience</span>
                  <span className="font-semibold text-slate-800">{applicant.yearsOfExperience || 0} Years</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Skills</span>
                  <span className="font-semibold text-slate-800">{applicant.skills || 'General Labor'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Current Address</span>
                  <span className="font-semibold text-slate-800">{applicant.address || applicant.district || 'Bangladesh'}</span>
                </div>
              </div>
            </div>

            {/* Target Job Specs */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <Briefcase className="w-4 h-4 text-primary-600" /> Target Job Demand
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Job Code</span>
                  <span className="font-semibold text-slate-800">{job.jobCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Employer</span>
                  <span className="font-semibold text-slate-800">{job.employer.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Destination</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    {job.country.flag && <span>{job.country.flag}</span>}
                    {job.country.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Monthly Salary</span>
                  <span className="font-semibold text-emerald-700">
                    {job.salaryAmount ? `${job.salaryCurrency} ${Number(job.salaryAmount).toLocaleString()}` : 'Negotiable'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Open Vacancies</span>
                  <span className="font-semibold text-slate-800">{job.vacancies} Positions</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Staff</span>
                  <span className="font-semibold text-primary-700">
                    {assignedTo ? assignedTo.name : 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Case Notes */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Internal Case Notes</h3>
            <p className="text-xs text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">
              {application.internalNotes || 'No internal case notes recorded yet.'}
            </p>
          </div>
        </TabsContent>

        {/* 2. STAGE TIMELINE TAB */}
        <TabsContent value="timeline" className="mt-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">
              Recruitment Stage Audit Trail
            </h3>

            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {statusHistory.map((hist: any) => (
                <div key={hist.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-primary-600 border-4 border-white shadow-sm" />
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                      {hist.fromStatus ? `${hist.fromStatus} → ` : ''}{hist.toStatus}
                    </span>
                    <span className="text-slate-400 font-normal">
                      {new Date(hist.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">{hist.notes}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Updated by: <strong>{hist.changedBy?.name || 'System'}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 3. DOCUMENTS TAB */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Candidate Documents</h3>
              <p className="text-xs text-slate-500">Official passports, medical certificates, police clearances and visas.</p>
            </div>
            <Button onClick={() => setIsUploadDocModalOpen(true)} size="sm" className="bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1.5 text-xs">
              <Upload className="w-3.5 h-3.5" /> Upload Document
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <th className="p-3.5">Document Type</th>
                  <th className="p-3.5">File Name</th>
                  <th className="p-3.5">Doc # / Expiry</th>
                  <th className="p-3.5">Verification</th>
                  <th className="p-3.5">Verified By</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No documents uploaded for this application yet.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-semibold text-slate-800">{doc.documentType.name}</td>
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
                          <Badge variant="success">Verified</Badge>
                        ) : doc.rejectionReason ? (
                          <div>
                            <Badge variant="error">Rejected</Badge>
                            <span className="block text-[10px] text-rose-600 mt-0.5">{doc.rejectionReason}</span>
                          </div>
                        ) : (
                          <Badge variant="warning">Pending Verification</Badge>
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
                            Verify / Reject
                          </Button>
                          <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Download className="w-3.5 h-3.5 text-slate-500" />
                            </Button>
                          </a>
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
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Candidate Interviews</h3>
              <p className="text-xs text-slate-500">Agency screening and foreign employer interviews.</p>
            </div>
            <Button onClick={() => setIsInterviewModalOpen(true)} size="sm" className="bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1.5 text-xs">
              <CalendarCheck className="w-3.5 h-3.5" /> Schedule Interview
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Interviewer</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Score & Outcome</th>
                  <th className="p-3.5">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No interviews scheduled for this application yet.
                    </td>
                  </tr>
                ) : (
                  interviews.map((int: any) => (
                    <tr key={int.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-semibold text-slate-800">
                        {new Date(int.scheduledDate).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-medium">{int.interviewType.replace(/_/g, ' ')}</td>
                      <td className="p-3.5 text-slate-600">{int.interviewer?.name || int.interviewerName || '—'}</td>
                      <td className="p-3.5">
                        <Badge variant={int.status === 'COMPLETED' ? 'success' : int.status === 'CANCELLED' ? 'error' : 'info'}>
                          {int.status}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        {int.outcome ? (
                          <div className="font-semibold">
                            <span className={int.outcome === 'PASSED' ? 'text-emerald-600' : 'text-rose-600'}>
                              {int.outcome}
                            </span>
                            {int.score !== null && <span className="text-slate-500 ml-1">({int.score}/100)</span>}
                          </div>
                        ) : (
                          <span className="text-slate-400">Awaiting Evaluation</span>
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
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Invoiced</span>
              <p className="text-xl font-bold text-slate-900 mt-1">BDT {totalInvoiced.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-emerald-600 font-semibold uppercase">Total Paid</span>
              <p className="text-xl font-bold text-emerald-700 mt-1">BDT {totalPaid.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-rose-600 font-semibold uppercase">Outstanding Due</span>
              <p className="text-xl font-bold text-rose-700 mt-1">BDT {totalDue.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Issue Date</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Total</th>
                  <th className="p-3.5">Paid</th>
                  <th className="p-3.5">Due</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No invoices issued for this application.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold font-mono text-primary-700">{inv.invoiceNumber}</td>
                      <td className="p-3.5">{new Date(inv.issueDate).toLocaleDateString()}</td>
                      <td className="p-3.5">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="p-3.5 font-semibold">BDT {Number(inv.totalAmount).toLocaleString()}</td>
                      <td className="p-3.5 text-emerald-600 font-semibold">BDT {Number(inv.paidAmount).toLocaleString()}</td>
                      <td className="p-3.5 text-rose-600 font-semibold">BDT {Number(inv.dueAmount).toLocaleString()}</td>
                      <td className="p-3.5">
                        <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'gold' : 'neutral'}>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <Link href={`/admin/invoices/${inv.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2">
                            View Invoice
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

      {/* Advance Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Transition Recruitment Stage"
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
                  onClick={() => handleStatusTransition(true)}
                  className="mt-2 text-rose-700 border-rose-300 hover:bg-rose-100 text-xs"
                >
                  Force Manager Quota Override
                </Button>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Stage</label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5"
            >
              {[
                'APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_PASSED',
                'SELECTED', 'OFFER_LETTER_ISSUED', 'CONTRACT_SIGNED', 'MEDICAL_PASSED',
                'VISA_SUBMITTED', 'VISA_STAMPED', 'TICKET_CONFIRMED', 'RECRUITMENT_COMPLETED',
                'REJECTED', 'CANCELLED'
              ].map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes</label>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Audit log transition remarks..."
              rows={3}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>Cancel</Button>
            <Button onClick={() => handleStatusTransition(false)} className="bg-primary-600 text-white">
              Confirm Move
            </Button>
          </div>
        </div>
      </Modal>

      {/* Staff Assignment Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Case Staff"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Staff Member</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5"
            >
              <option value="">Unassigned</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>{st.name} ({st.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assignment Note</label>
            <textarea
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="Instructions for the assigned officer..."
              rows={3}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignStaff} className="bg-primary-600 text-white">Save Assignment</Button>
          </div>
        </div>
      </Modal>

      {/* Document Verify Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title="Verify or Reject Document"
        description={selectedDoc ? `${selectedDoc.documentType.name}: ${selectedDoc.fileName}` : ''}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Decision</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  checked={docVerifyStatus === 'VERIFIED'}
                  onChange={() => setDocVerifyStatus('VERIFIED')}
                  className="text-primary-600"
                />
                <span className="font-semibold text-emerald-700">Approve & Verify</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  checked={docVerifyStatus === 'REJECTED'}
                  onChange={() => setDocVerifyStatus('REJECTED')}
                  className="text-rose-600"
                />
                <span className="font-semibold text-rose-700">Reject Document</span>
              </label>
            </div>
          </div>

          {docVerifyStatus === 'REJECTED' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Mandatory Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Scanned copy blurred, passport expired, or name mismatch..."
                rows={3}
                className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsVerifyModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleVerifyDocument}
              disabled={docVerifyStatus === 'REJECTED' && !rejectionReason.trim()}
              className={docVerifyStatus === 'VERIFIED' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}
            >
              Submit Decision
            </Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        title="Schedule Interview Session"
        maxWidth="md"
      >
        <form onSubmit={handleScheduleInterview} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Interview Type</label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5"
            >
              <option value="IN_PERSON">In-Person (Office)</option>
              <option value="ONLINE">Online Video Call</option>
              <option value="PHONE">Phone Interview</option>
              <option value="TECHNICAL">Technical Trade Test</option>
              <option value="CLIENT">Direct Employer Client</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Date & Time *</label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Location or Link</label>
            <input
              type="text"
              value={location || meetingLink}
              onChange={(e) => {
                setLocation(e.target.value);
                setMeetingLink(e.target.value);
              }}
              placeholder="e.g. Conference Room B or Zoom URL"
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Instructions / Notes</label>
            <textarea
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              placeholder="Candidate preparation notes..."
              rows={2}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsInterviewModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary-600 text-white">Schedule Interview</Button>
          </div>
        </form>
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadDocModalOpen}
        onClose={() => setIsUploadDocModalOpen(false)}
        title="Upload Candidate Document"
        maxWidth="md"
      >
        <form onSubmit={handleUploadDocument} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Document Type *</label>
            <select
              value={selectedDocTypeId}
              onChange={(e) => setSelectedDocTypeId(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5"
            >
              {docTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name} {dt.isRequired ? '(Required)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Document # (Optional)</label>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="e.g. Passport or Certificate Number"
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select File (PDF, JPG, PNG) *</label>
            <input
              type="file"
              onChange={(e) => e.target.files?.[0] && setDocFile(e.target.files[0])}
              required
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsUploadDocModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isUploadingDoc || !docFile} className="bg-primary-600 text-white">
              {isUploadingDoc ? 'Uploading...' : 'Save Document'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
