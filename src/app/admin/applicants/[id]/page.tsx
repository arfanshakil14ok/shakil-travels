'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Activity,
  Eye,
  Download,
  FileCheck,
  CreditCard,
  Receipt,
  Printer,
  FileSpreadsheet,
  Check,
  X,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { AuditLogDetailDialog } from '@/components/admin/audit-log-detail-dialog';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

export default function ApplicantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error } = useToast();
  const id = params?.id as string;

  const [applicant, setApplicant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Notes state
  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Status changer state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Activity Timeline state
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [viewingActivityLog, setViewingActivityLog] = useState<any | null>(null);

  // Document Verification / Rejection Modal State
  const [selectedDocForReject, setSelectedDocForReject] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingDocAction, setIsSubmittingDocAction] = useState(false);

  // Assign Job Modal State
  const [isAssignJobModalOpen, setIsAssignJobModalOpen] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobPriority, setJobPriority] = useState('MEDIUM');
  const [jobStage, setJobStage] = useState('SUBMITTED');
  const [jobNotes, setJobNotes] = useState('');
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);

  // Application Status Modal State
  const [selectedAppForStatus, setSelectedAppForStatus] = useState<any | null>(null);
  const [targetAppStatus, setTargetAppStatus] = useState('');
  const [appStatusNotes, setAppStatusNotes] = useState('');
  const [isSubmittingAppStatus, setIsSubmittingAppStatus] = useState(false);

  // Create Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceItemDesc, setInvoiceItemDesc] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);

  // Record Payment Modal State
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const fetchApplicant = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/applicants/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load applicant details');
      }
      setApplicant(data.data);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id, error]);

  const fetchActivityLogs = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoadingActivity(true);
      const res = await fetch(`/api/audit-logs?applicantId=${id}&pageSize=50`);
      const data = await res.json();
      if (data.success) {
        setActivityLogs(data.data.logs || []);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingActivity(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplicant();
    fetchActivityLogs();
  }, [fetchApplicant, fetchActivityLogs]);

  // Load available jobs for assignment
  const loadAvailableJobs = async () => {
    try {
      setIsLoadingJobs(true);
      const res = await fetch('/api/jobs?status=PUBLISHED&limit=50');
      const data = await res.json();
      if (data.success) {
        setAvailableJobs(data.data.items || []);
        if (data.data.items?.length > 0 && !selectedJobId) {
          setSelectedJobId(data.data.items[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Status changer
  const handleStatusChange = async (newStatus: string) => {
    if (!applicant || newStatus === applicant.status) return;
    try {
      setIsUpdatingStatus(true);
      const res = await fetch(`/api/applicants/${applicant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }
      success(`Status updated to ${newStatus}`);
      setApplicant((prev: any) => ({ ...prev, status: newStatus }));
      fetchActivityLogs();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Add internal note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      setIsSubmittingNote(true);
      const res = await fetch(`/api/applicants/${applicant.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add note');
      }
      success('Confidential staff note added');
      setNoteText('');
      setApplicant((prev: any) => ({
        ...prev,
        notes: [data.data, ...(prev.notes || [])],
      }));
      fetchActivityLogs();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Delete applicant
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/applicants/${applicant.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete applicant');
      }
      success('Applicant record processed');
      router.push('/admin/applicants');
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Document Verification
  const handleVerifyDocument = async (docId: string) => {
    try {
      setIsSubmittingDocAction(true);
      const res = await fetch(`/api/documents/${docId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VERIFIED' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to verify document');
      }
      success('Document marked as VERIFIED and candidate notified');
      fetchApplicant();
      fetchActivityLogs();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmittingDocAction(false);
    }
  };

  // Document Rejection
  const handleRejectDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForReject) return;
    if (!rejectReason.trim()) {
      error('A rejection reason is required so the candidate can rectify the issue.');
      return;
    }

    try {
      setIsSubmittingDocAction(true);
      const res = await fetch(`/api/documents/${selectedDocForReject.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason: rejectReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject document');
      }
      success('Document marked as REJECTED with feedback sent to candidate');
      setSelectedDocForReject(null);
      setRejectReason('');
      fetchApplicant();
      fetchActivityLogs();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmittingDocAction(false);
    }
  };

  // Assign Job Application
  const handleAssignJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) {
      error('Please select a target overseas job opening.');
      return;
    }

    try {
      setIsSubmittingJob(true);
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: applicant.id,
          jobId: selectedJobId,
          priority: jobPriority,
          appliedStage: jobStage,
          notes: jobNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to assign job application');
      }
      success(`Candidate successfully assigned to job (${data.data.applicationNumber})`);
      setIsAssignJobModalOpen(false);
      setJobNotes('');
      fetchApplicant();
      fetchActivityLogs();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmittingJob(false);
    }
  };

  // Update Application Stage
  const handleUpdateAppStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForStatus || !targetAppStatus) return;

    try {
      setIsSubmittingAppStatus(true);
      const res = await fetch(`/api/applications/${selectedAppForStatus.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStatus: targetAppStatus,
          notes: appStatusNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update application stage');
      }
      success(`Recruitment stage transitioned to ${targetAppStatus.replace(/_/g, ' ')}`);
      setSelectedAppForStatus(null);
      setAppStatusNotes('');
      fetchApplicant();
      fetchActivityLogs();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmittingAppStatus(false);
    }
  };

  // Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(invoiceAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      error('Please enter a valid invoice amount.');
      return;
    }
    if (!invoiceItemDesc.trim()) {
      error('Please specify a description for the invoice line item.');
      return;
    }

    try {
      setIsSubmittingInvoice(true);
      const dueDate = invoiceDueDate
        ? new Date(invoiceDueDate).toISOString()
        : new Date(Date.now() + 14 * 86400000).toISOString();

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: applicant.id,
          customerId: applicant.customer?.id,
          dueDate,
          items: [
            {
              description: invoiceItemDesc.trim(),
              quantity: 1,
              unitPrice: amountNum,
            },
          ],
          notes: invoiceNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to issue invoice');
      }
      success(`Invoice ${data.data.invoiceNumber} created and linked to candidate portal`);
      setIsInvoiceModalOpen(false);
      setInvoiceItemDesc('');
      setInvoiceAmount('');
      setInvoiceDueDate('');
      setInvoiceNotes('');
      fetchApplicant();
      fetchActivityLogs();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  // Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      error('Please enter a valid payment amount.');
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const res = await fetch(`/api/invoices/${selectedInvoiceForPayment.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          paymentMethod,
          referenceNumber: paymentRef.trim() || undefined,
          notes: paymentNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record payment');
      }
      success(`Payment ${data.data.paymentNumber} recorded. Receipt #${data.data.receiptNumber} generated.`);
      setSelectedInvoiceForPayment(null);
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentNotes('');
      fetchApplicant();
      fetchActivityLogs();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-navy-900 mb-3" />
        <p className="text-sm">Loading 360° candidate ERP profile...</p>
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Candidate Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested applicant profile does not exist or has been removed.
        </p>
        <Link href="/admin/applicants">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Applicants
          </Button>
        </Link>
      </div>
    );
  }

  // Passport alert check (< 6 months)
  let isPassportExpiringSoon = false;
  let passportDaysRemaining: number | null = null;
  if (applicant.passportExpiry) {
    const expiry = new Date(applicant.passportExpiry);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    passportDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (passportDaysRemaining <= 180) {
      isPassportExpiringSoon = true;
    }
  }

  // Financial calculations
  const invoices = applicant.invoices || [];
  const totalBilled = invoices.reduce((sum: number, inv: any) => sum + Number(inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum: number, inv: any) => sum + Number(inv.paidAmount || 0), 0);
  const totalDue = invoices.reduce((sum: number, inv: any) => sum + Number(inv.dueAmount || 0), 0);

  const getStatusBadgeVariant = (st: string): 'success' | 'navy' | 'gold' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (st) {
      case 'ACTIVE':
      case 'VERIFIED':
      case 'PAID':
      case 'COMPLETED':
        return 'success';
      case 'SHORTLISTED':
      case 'PARTIALLY_PAID':
        return 'navy';
      case 'PLACED':
      case 'DEPARTED':
        return 'gold';
      case 'ON_HOLD':
      case 'PROFILE_INCOMPLETE':
      case 'UPLOADED':
      case 'UNDER_REVIEW':
      case 'PENDING':
        return 'warning';
      case 'BLACKLISTED':
      case 'INACTIVE':
      case 'REJECTED':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/applicants">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
          </Link>
          <ProfileAvatar
            name={applicant.fullName}
            photoUrl={applicant.profilePhoto}
            size="lg"
            className="w-14 h-14 ring-2 ring-emerald-500/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                {applicant.applicantNumber}
              </span>
              <Badge variant={getStatusBadgeVariant(applicant.status)}>
                {applicant.status.replace('_', ' ')}
              </Badge>
              {applicant.customer?.id && (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                  Customer ID: {applicant.customer.id.slice(0, 8)}...
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              {applicant.fullName}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-44">
            <Select
              options={[
                { value: 'NEW', label: 'Status: New' },
                { value: 'PROFILE_INCOMPLETE', label: 'Status: Incomplete' },
                { value: 'ACTIVE', label: 'Status: Active Pool' },
                { value: 'SHORTLISTED', label: 'Status: Shortlisted' },
                { value: 'ON_HOLD', label: 'Status: On Hold' },
                { value: 'PLACED', label: 'Status: Placed' },
                { value: 'DEPARTED', label: 'Status: Departed' },
                { value: 'INACTIVE', label: 'Status: Inactive' },
                { value: 'BLACKLISTED', label: 'Status: Blacklisted' },
              ]}
              value={applicant.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdatingStatus}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadAvailableJobs();
              setIsAssignJobModalOpen(true);
            }}
            leftIcon={<Briefcase className="w-3.5 h-3.5 text-navy-900" />}
          >
            Assign Job
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInvoiceModalOpen(true)}
            leftIcon={<Receipt className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Create Invoice
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
          >
            Remove
          </Button>
        </div>
      </div>

      {/* Passport Expiry Warning Alert */}
      {isPassportExpiringSoon && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-semibold text-sm text-amber-950">
              Passport Validity Alert
            </h4>
            <p className="mt-0.5">
              Candidate passport ({applicant.passportNumber || 'N/A'}) expires on{' '}
              <span className="font-semibold">{formatDate(applicant.passportExpiry)}</span> (
              {passportDaysRemaining !== null && passportDaysRemaining > 0
                ? `${passportDaysRemaining} days remaining`
                : 'Expired'}
              ). International migration protocols require at least 6 months validity.
            </p>
          </div>
        </div>
      )}

      {/* 360 Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Bio, Preferences, Experience, Matching, Documents, Applications, Invoices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Personal Details */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-navy-900">
                <User className="w-4 h-4 text-emerald-600" />
                <CardTitle>Personal Bio-Data & Contact</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Full Name</span>
                <span className="text-slate-800 font-semibold text-sm">{applicant.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Primary Phone</span>
                <span className="text-slate-800 font-semibold text-sm flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {applicant.phone}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Father&apos;s Name</span>
                <span className="text-slate-700">{applicant.fatherName || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Mother&apos;s Name</span>
                <span className="text-slate-700">{applicant.motherName || 'Not specified'}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Date of Birth / Gender</span>
                <span className="text-slate-700">
                  {applicant.dateOfBirth ? formatDate(applicant.dateOfBirth) : 'N/A'} (
                  {applicant.gender || 'MALE'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Email Address</span>
                <span className="text-slate-700">{applicant.email || 'None provided'}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">District & Upazila</span>
                <span className="text-slate-700">
                  {applicant.district ? `${applicant.district}${applicant.upazila ? `, ${applicant.upazila}` : ''}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Detailed Address</span>
                <span className="text-slate-700">{applicant.address || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card: Passport & Target Preferences */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-navy-900">
                <Globe className="w-4 h-4 text-blue-600" />
                <CardTitle>Travel Documents & Migration Preferences</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Passport Available</span>
                <span className="font-semibold text-slate-800">
                  {applicant.passportAvailable ? 'Yes - In Possession' : 'No / In Process'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Passport Number</span>
                <span className="font-mono text-sm font-bold text-slate-800">
                  {applicant.passportNumber || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Passport Expiry</span>
                <span className="text-slate-700">
                  {applicant.passportExpiry ? formatDate(applicant.passportExpiry) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Nationality</span>
                <span className="text-slate-700">{applicant.nationality}</span>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block font-medium">Target Destination</span>
                  <span className="text-sm font-semibold text-navy-900 flex items-center gap-2 mt-0.5">
                    {applicant.preferredCountry?.flag && (
                      <span className="text-base">{applicant.preferredCountry.flag}</span>
                    )}
                    {applicant.preferredCountry?.name || 'Any Global Destination'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Target Trade Category</span>
                  <span className="text-sm font-semibold text-navy-900 flex items-center gap-1.5 mt-0.5">
                    <Briefcase className="w-4 h-4 text-slate-500" />
                    {applicant.preferredJobCategory?.name || 'Open to Trades'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Uploaded Documents & Verification (CRITICAL ERP WORKFLOW) */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-navy-900">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <CardTitle>Candidate Documents & Official Verification</CardTitle>
                </div>
                <Badge variant="neutral" size="sm">
                  {applicant.documents?.length || 0} Submitted
                </Badge>
              </div>
              <CardDescription>
                Candidate uploads from portal are securely stored in private disk storage. Review, verify authenticity, or reject with feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {!applicant.documents || applicant.documents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No documents have been uploaded by this candidate yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {applicant.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">
                            {doc.documentType?.name || doc.fileName}
                          </span>
                          <Badge variant={getStatusBadgeVariant(doc.status)} size="sm">
                            {doc.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                          <span>{doc.fileName}</span>
                          <span>•</span>
                          <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span>Uploaded: {formatDate(doc.createdAt)}</span>
                          {doc.verifiedBy && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700">Verified by: {doc.verifiedBy.name}</span>
                            </>
                          )}
                        </div>

                        {doc.rejectionReason && (
                          <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
                            <span className="font-bold">Rejection Reason:</span> {doc.rejectionReason}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                            View / Download
                          </Button>
                        </a>

                        {doc.status !== 'VERIFIED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleVerifyDocument(doc.id)}
                            isLoading={isSubmittingDocAction}
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                          >
                            Verify
                          </Button>
                        )}

                        {doc.status !== 'REJECTED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDocForReject(doc);
                              setRejectReason('');
                            }}
                            leftIcon={<X className="w-3.5 h-3.5 text-rose-600" />}
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Applications & Recruitment Workflow Progression */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-navy-900">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <CardTitle>Recruitment Applications & Processing Pipeline</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    loadAvailableJobs();
                    setIsAssignJobModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-600" />}
                >
                  Assign to Job
                </Button>
              </div>
              <CardDescription>
                Manage active overseas recruitment files, interviews, and visa status progression
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {!applicant.applications || applicant.applications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No applications recorded for this applicant. Click &quot;Assign to Job&quot; above to initiate a file.
                </div>
              ) : (
                <div className="space-y-3">
                  {applicant.applications.map((app: any) => (
                    <div
                      key={app.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">
                            {app.job?.title || 'Overseas Vacancy'}
                          </span>
                          <Badge variant="primary" size="sm">
                            {app.currentStage?.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="neutral" size="sm">
                            {app.priority}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="font-mono font-semibold text-slate-700">
                            {app.applicationCode || app.applicationNumber}
                          </span>
                          <span>•</span>
                          <span>{app.job?.country?.name || 'International'}</span>
                          <span>•</span>
                          <span>Employer: {app.job?.employer?.companyName || 'Registered Employer'}</span>
                          <span>•</span>
                          <span>Initiated: {formatDate(app.createdAt)}</span>
                        </div>

                        {app.statusHistory && app.statusHistory.length > 0 && (
                          <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              Latest Event: {app.statusHistory[0].toStage?.replace(/_/g, ' ')} ({formatDate(app.statusHistory[0].createdAt)})
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAppForStatus(app);
                            setTargetAppStatus(app.currentStage || 'UNDER_REVIEW');
                            setAppStatusNotes('');
                          }}
                          leftIcon={<Clock className="w-3.5 h-3.5 text-navy-900" />}
                        >
                          Update Stage
                        </Button>

                        <Link href={`/admin/applications/${app.id}`}>
                          <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3 h-3" />}>
                            File Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Invoices & Financial Account Management */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-navy-900">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <CardTitle>Invoices & Financial Management</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInvoiceModalOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-600" />}
                >
                  Create Invoice
                </Button>
              </div>
              <CardDescription>
                All billing is linked directly to this applicant and customer record. Automatically reflected in candidate portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Financial KPI Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-[11px] text-slate-500 block font-medium">Total Invoiced</span>
                  <span className="text-lg font-bold text-slate-900">
                    ৳{totalBilled.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block font-medium">Paid Amount</span>
                  <span className="text-lg font-bold text-emerald-700">
                    ৳{totalPaid.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block font-medium">Outstanding Balance</span>
                  <span className="text-lg font-bold text-amber-700">
                    ৳{totalDue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Invoices List */}
              {!applicant.invoices || applicant.invoices.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No invoices issued for this applicant yet. Click &quot;Create Invoice&quot; to issue a bill.
                </div>
              ) : (
                <div className="space-y-3">
                  {applicant.invoices.map((inv: any) => (
                    <div
                      key={inv.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {inv.invoiceNumber}
                          </span>
                          <Badge variant={getStatusBadgeVariant(inv.status)} size="sm">
                            {inv.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Date: {formatDate(inv.invoiceDate)}
                          {inv.dueDate && ` • Due: ${formatDate(inv.dueDate)}`}
                        </div>
                        {inv.items && inv.items.length > 0 && (
                          <div className="text-xs text-slate-700 font-medium mt-1">
                            Items: {inv.items.map((it: any) => it.description).join(', ')}
                          </div>
                        )}
                        <div className="text-xs mt-1.5 flex items-center gap-3">
                          <span className="font-bold text-slate-900">Total: ৳{Number(inv.totalAmount).toLocaleString()}</span>
                          <span className="text-emerald-700 font-medium">Paid: ৳{Number(inv.paidAmount).toLocaleString()}</span>
                          <span className="text-amber-700 font-medium">Due: ৳{Number(inv.dueAmount).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/admin/invoices/${inv.id}`}>
                          <Button variant="outline" size="sm" leftIcon={<Printer className="w-3.5 h-3.5" />}>
                            Print A4
                          </Button>
                        </Link>

                        {inv.status !== 'PAID' && inv.status !== 'VOID' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoiceForPayment(inv);
                              setPaymentAmount(String(inv.dueAmount));
                              setPaymentRef('');
                              setPaymentNotes('');
                            }}
                            leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                          >
                            Record Payment
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: CRM, Notes & Quick Info */}
        <div className="space-y-6">
          {/* Card: CRM & Office Handling */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-navy-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <CardTitle>CRM & Office Handling</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Assigned Officer</span>
                <span className="text-slate-800 font-semibold">
                  {applicant.assignedStaff ? (
                    `${applicant.assignedStaff.name} (${applicant.assignedStaff.email})`
                  ) : (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Lead Acquisition Source</span>
                <span className="text-slate-700 font-medium">
                  {applicant.source || 'PORTAL_REGISTRATION'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">CRM Customer Record</span>
                <span className="font-mono text-[11px] text-slate-600">
                  {applicant.customer?.id ? `Linked ID: ${applicant.customer.id.slice(0, 16)}...` : 'Synchronized'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block font-medium">Account Created</span>
                <span className="text-slate-700">{formatDate(applicant.createdAt, true)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card: Internal Staff Notes */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-navy-900">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <CardTitle>Internal Staff Notes</CardTitle>
                </div>
                <Badge variant="neutral" size="sm">
                  Staff Only
                </Badge>
              </div>
              <CardDescription>Confidential operational logs and interview remarks</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2.5">
                <Textarea
                  placeholder="Record call summary, medical review, or recruitment remarks..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  isLoading={isSubmittingNote}
                  disabled={!noteText.trim()}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="w-full"
                >
                  Save Internal Note
                </Button>
              </form>

              {/* Notes List */}
              <div className="space-y-3 pt-2 max-h-80 overflow-y-auto pr-1">
                {!applicant.notes || applicant.notes.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No notes recorded yet.
                  </p>
                ) : (
                  applicant.notes.map((note: any) => (
                    <div
                      key={note.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1"
                    >
                      <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {note.note}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                        <span className="font-semibold text-slate-600">
                          {note.createdBy?.name || 'Staff Member'}
                        </span>
                        <span>{formatDate(note.createdAt, true)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Candidate Unified Activity & Audit Trail */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-navy-900">
              <Activity className="w-4 h-4 text-purple-600" />
              <CardTitle>Unified Applicant Activity & Audit Trail</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActivityLogs}
              disabled={isLoadingActivity}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingActivity ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
          <CardDescription>
            Complete chronological audit trail of registrations, document submissions &amp; verifications, job status progressions, invoice generations, and payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 text-xs">
          {isLoadingActivity && activityLogs.length === 0 ? (
            <p className="text-slate-400 text-center py-6">Loading activity logs...</p>
          ) : activityLogs.length === 0 ? (
            <p className="text-slate-400 text-center py-6">No activity records logged for this candidate yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold font-mono text-slate-900 text-xs">
                        {log.action}
                      </span>
                      <Badge
                        variant={log.actorType === 'APPLICANT' ? 'success' : log.actorType === 'STAFF' ? 'navy' : 'neutral'}
                        size="sm"
                      >
                        {log.actorType || 'STAFF'}
                      </Badge>
                      <Badge variant="neutral" size="sm">
                        {log.entity}
                      </Badge>
                    </div>
                    <p className="text-slate-600 text-xs truncate max-w-xl">
                      {log.description || log.action.replace(/_/g, ' ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-slate-400 text-[11px] font-mono">
                    <span>{formatDate(log.createdAt, true)}</span>
                    <button
                      type="button"
                      onClick={() => setViewingActivityLog(log)}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: Document Rejection Dialog */}
      <Modal
        isOpen={!!selectedDocForReject}
        onClose={() => setSelectedDocForReject(null)}
        title="Reject Candidate Document"
        description={`Rejecting: ${selectedDocForReject?.documentType?.name || selectedDocForReject?.fileName}`}
      >
        <form onSubmit={handleRejectDocument} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Rejection (Visible to Candidate) *
            </label>
            <Textarea
              placeholder="e.g. Passport page is blurry, or expiry date does not meet the 6-month validity requirement..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              required
              className="text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedDocForReject(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingDocAction}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Assign Job / New Application Dialog */}
      <Modal
        isOpen={isAssignJobModalOpen}
        onClose={() => setIsAssignJobModalOpen(false)}
        title="Assign Candidate to Job Vacancy"
        description={`Create a recruitment file for ${applicant.fullName} (${applicant.applicantNumber})`}
      >
        <form onSubmit={handleAssignJob} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Overseas Job Vacancy *
            </label>
            {isLoadingJobs ? (
              <p className="text-xs text-slate-400 py-2">Loading active jobs...</p>
            ) : availableJobs.length === 0 ? (
              <p className="text-xs text-rose-500 py-2">No active published jobs found in system.</p>
            ) : (
              <Select
                options={availableJobs.map((j) => ({
                  value: j.id,
                  label: `${j.title} (${j.country?.name || 'Any'} - ${j.currency} ${Number(j.salaryMin).toLocaleString()})`,
                }))}
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <Select
                options={[
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'URGENT', label: 'Urgent' },
                ]}
                value={jobPriority}
                onChange={(e) => setJobPriority(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Pipeline Stage
              </label>
              <Select
                options={[
                  { value: 'SUBMITTED', label: 'Submitted / New' },
                  { value: 'UNDER_REVIEW', label: 'Under Review' },
                  { value: 'DOCUMENT_VERIFICATION', label: 'Document Verification' },
                  { value: 'INTERVIEW', label: 'Interview Scheduled' },
                  { value: 'SELECTED', label: 'Selected' },
                  { value: 'VISA_PROCESSING', label: 'Visa Processing' },
                ]}
                value={jobStage}
                onChange={(e) => setJobStage(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Processing Remarks / Notes
            </label>
            <Textarea
              placeholder="e.g. Candidate selected through client trade test..."
              value={jobNotes}
              onChange={(e) => setJobNotes(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignJobModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingJob}
              disabled={!selectedJobId || availableJobs.length === 0}
            >
              Initiate Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Update Application Stage Dialog */}
      <Modal
        isOpen={!!selectedAppForStatus}
        onClose={() => setSelectedAppForStatus(null)}
        title="Update Recruitment Stage"
        description={`Application: ${selectedAppForStatus?.applicationCode || selectedAppForStatus?.applicationNumber} (${selectedAppForStatus?.job?.title})`}
      >
        <form onSubmit={handleUpdateAppStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Target Stage *
            </label>
            <Select
              options={[
                { value: 'SUBMITTED', label: '1. Submitted' },
                { value: 'UNDER_REVIEW', label: '2. Under Review' },
                { value: 'DOCUMENT_VERIFICATION', label: '3. Document Verification' },
                { value: 'INTERVIEW', label: '4. Interview' },
                { value: 'SELECTED', label: '5. Selected by Employer' },
                { value: 'MEDICAL_PASSED', label: '6. Medical Passed' },
                { value: 'VISA_PROCESSING', label: '7. Visa Processing' },
                { value: 'VISA_STAMPED', label: '8. Visa Stamped' },
                { value: 'TICKET_CONFIRMED', label: '9. Flight Confirmed' },
                { value: 'DEPLOYED', label: '10. Deployed Overseas' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
              value={targetAppStatus}
              onChange={(e) => setTargetAppStatus(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transition Notes (Recorded in Audit History)
            </label>
            <Textarea
              placeholder="e.g. Visa stamping approval received from embassy..."
              value={appStatusNotes}
              onChange={(e) => setAppStatusNotes(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedAppForStatus(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingAppStatus}
            >
              Save Stage
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Create Invoice Dialog */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Create Service Invoice"
        description={`Issue an official invoice to ${applicant.fullName} (${applicant.applicantNumber})`}
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Service / Fee Description *
            </label>
            <Input
              placeholder="e.g. Overseas Recruitment & Visa Processing Fee"
              value={invoiceItemDesc}
              onChange={(e) => setInvoiceItemDesc(e.target.value)}
              required
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (BDT) *
              </label>
              <Input
                type="number"
                placeholder="e.g. 150000"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                required
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Date
              </label>
              <Input
                type="date"
                value={invoiceDueDate}
                onChange={(e) => setInvoiceDueDate(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / Terms
            </label>
            <Textarea
              placeholder="Payment terms, bank details, or stage conditions..."
              value={invoiceNotes}
              onChange={(e) => setInvoiceNotes(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInvoiceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingInvoice}
            >
              Issue Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: Record Payment Dialog */}
      <Modal
        isOpen={!!selectedInvoiceForPayment}
        onClose={() => setSelectedInvoiceForPayment(null)}
        title="Record Payment Receipt"
        description={`Recording payment against invoice ${selectedInvoiceForPayment?.invoiceNumber} (Due: ৳${Number(selectedInvoiceForPayment?.dueAmount).toLocaleString()})`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Amount (BDT) *
              </label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <Select
                options={[
                  { value: 'CASH', label: 'Cash at Counter' },
                  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                  { value: 'MOBILE_BANKING', label: 'bKash / Nagad' },
                  { value: 'CHEQUE', label: 'Bank Cheque' },
                ]}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bank / Transaction Reference Number
            </label>
            <Input
              placeholder="e.g. TXN-998822 / Bank Deposit Slip #..."
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Remarks
            </label>
            <Textarea
              placeholder="e.g. First installment paid at Netrokona main branch..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedInvoiceForPayment(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingPayment}
            >
              Confirm Payment & Generate Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Audit Log Detail Dialog */}
      <AuditLogDetailDialog
        isOpen={!!viewingActivityLog}
        onClose={() => setViewingActivityLog(null)}
        log={viewingActivityLog}
      />

      {/* Confirmation Dialog for Removal */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Remove Applicant Record"
        message={`Are you sure you want to remove ${applicant.fullName} (${applicant.applicantNumber})? If active applications exist, status will be safely archived to INACTIVE.`}
        confirmText="Confirm Deletion"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
