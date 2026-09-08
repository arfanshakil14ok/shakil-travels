'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Stamp,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Building2,
  FileCheck2,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Printer,
  ShieldCheck,
  CreditCard,
  FileText,
  MapPin,
  CalendarDays,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { VISA_STATUSES } from '@/lib/validations/visa';

export default function VisaApplicationDetailPage() {
  const { id } = useParams() as { id: string };
  const { success, error } = useToast();

  const [visaApp, setVisaApp] = useState<any | null>(null);
  const [readiness, setReadiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Status Change Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({
    toStatus: '',
    reason: '',
    notes: '',
    referenceNumber: '',
    submissionDate: '',
    visaExpiryDate: '',
    rejectionReason: '',
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Appointment Modal
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [apptForm, setApptForm] = useState({
    appointmentType: 'BIOMETRICS',
    appointmentDate: '',
    location: '',
    reference: '',
    notes: '',
  });
  const [schedulingAppt, setSchedulingAppt] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, readRes] = await Promise.all([
        fetch(`/api/visa/applications/${id}`),
        fetch(`/api/visa/applications/${id}/readiness`),
      ]);

      const appData = await appRes.json();
      const readData = await readRes.json();

      if (appData.success) {
        setVisaApp(appData.data);
        setStatusForm((prev) => ({
          ...prev,
          toStatus: appData.data.status,
          referenceNumber: appData.data.referenceNumber || '',
          submissionDate: appData.data.submissionDate ? appData.data.submissionDate.split('T')[0] : '',
          visaExpiryDate: appData.data.visaExpiryDate ? appData.data.visaExpiryDate.split('T')[0] : '',
        }));
      } else {
        error(appData.error || 'Failed to load visa case');
      }

      if (readData.success) {
        setReadiness(readData.data);
      }
    } catch (err: any) {
      error(err.message || 'Error fetching visa case');
    } finally {
      setLoading(false);
    }
  }, [id, error]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/visa/applications/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusForm),
      });
      const data = await res.json();
      if (data.success) {
        success(data.message || 'Status updated successfully');
        setIsStatusModalOpen(false);
        fetchDetails();
      } else {
        error(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      error(err.message || 'Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleApptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptForm.appointmentDate) {
      error('Please select appointment date and time');
      return;
    }
    setSchedulingAppt(true);
    try {
      const res = await fetch(`/api/visa/applications/${id}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apptForm),
      });
      const data = await res.json();
      if (data.success) {
        success('Appointment scheduled successfully');
        setIsApptModalOpen(false);
        setApptForm({ appointmentType: 'BIOMETRICS', appointmentDate: '', location: '', reference: '', notes: '' });
        fetchDetails();
      } else {
        error(data.error || 'Failed to schedule appointment');
      }
    } catch (err: any) {
      error(err.message || 'Error scheduling appointment');
    } finally {
      setSchedulingAppt(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return <Badge variant="success">{status}</Badge>;
      case 'REJECTED':
      case 'WITHDRAWN':
        return <Badge variant="danger">{status}</Badge>;
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'BIOMETRICS':
      case 'MEDICAL':
        return <Badge variant="primary">{status.replace(/_/g, ' ')}</Badge>;
      case 'DOCUMENT_PENDING':
      case 'ADDITIONAL_DOCUMENT_REQUESTED':
        return <Badge variant="warning">{status.replace(/_/g, ' ')}</Badge>;
      default:
        return <Badge variant="secondary">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  if (loading || !visaApp) {
    return (
      <div className="p-12 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-600" />
        Loading visa case file...
      </div>
    );
  }

  const { applicant, application, country, assignedStaff, statusHistory, appointments } = visaApp;
  const employer = application?.job?.employer;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back and Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/admin/visa/applications" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Visa Applications
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="flex items-center gap-1.5">
            <Printer className="w-4 h-4" />
            Print File
          </Button>
          <Button size="sm" onClick={() => setIsStatusModalOpen(true)} className="flex items-center gap-1.5">
            <Stamp className="w-4 h-4" />
            Update Status
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsApptModalOpen(true)} className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" />
            Add Appointment
          </Button>
        </div>
      </div>

      {/* Main Status Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-bold text-primary-700">
              {visaApp.visaApplicationNumber}
            </span>
            {getStatusBadge(visaApp.status)}
            <Badge variant="outline">{visaApp.visaType.replace(/_/g, ' ')}</Badge>
          </div>
          <div className="text-sm text-slate-600 mt-1 flex flex-wrap gap-4">
            <span><strong>Destination:</strong> {country.name} ({country.code})</span>
            {visaApp.referenceNumber && <span><strong>Ref:</strong> {visaApp.referenceNumber}</span>}
            {assignedStaff && <span><strong>Officer:</strong> {assignedStaff.name}</span>}
          </div>
        </div>

        {/* Departure Readiness Badge */}
        {readiness && (
          <div className={`p-3 rounded-lg border text-right ${readiness.isReadyForDeparture ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Departure Readiness</div>
            <div className={`text-base font-bold ${readiness.isReadyForDeparture ? 'text-emerald-700' : 'text-amber-700'}`}>
              {readiness.status === 'READY' ? 'READY FOR DEPARTURE' : 'NOT READY'} ({readiness.completionPercentage}%)
            </div>
            <div className="text-[11px] text-slate-500">
              {readiness.passedChecks} of {readiness.totalChecks} checks verified
            </div>
          </div>
        )}
      </div>

      {/* Grid: Details & Departure Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate & Job Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-primary-600" />
                Candidate & Employment Placement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                  <div className="font-semibold text-slate-800">{applicant.fullName}</div>
                  <div className="text-xs text-slate-600 font-mono">ID: {applicant.applicantNumber}</div>
                  <div className="text-xs text-slate-600">Phone: {applicant.phone}</div>
                  <div className="text-xs text-slate-600 font-mono">
                    Passport: {applicant.passportNumber || 'N/A'} (Exp: {applicant.passportExpiry ? new Date(applicant.passportExpiry).toLocaleDateString() : 'N/A'})
                  </div>
                  <Link href={`/admin/applicants`} className="text-xs text-primary-600 hover:underline inline-block mt-1">
                    View Candidate Profile →
                  </Link>
                </div>

                <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                  <div className="font-semibold text-slate-800">{application?.job?.title || 'General Position'}</div>
                  <div className="text-xs text-slate-600">Employer: {employer?.companyName || 'Foreign Employer'}</div>
                  <div className="text-xs text-slate-600 font-mono">Application: {application?.applicationCode}</div>
                  <div className="text-xs text-slate-600">Recruitment Stage: <Badge size="sm">{application?.currentStage}</Badge></div>
                  <Link href={`/admin/applications/${application?.id}`} className="text-xs text-primary-600 hover:underline inline-block mt-1">
                    View Full Application File →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Departure Readiness Checklist */}
          {readiness && (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary-600" />
                  Departure Readiness Checklist (8 Dimensions)
                </CardTitle>
                <Badge variant={readiness.isReadyForDeparture ? 'success' : 'warning'}>
                  {readiness.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {readiness.items.map((item: any) => (
                    <div key={item.id} className="p-3 border rounded-lg flex items-start justify-between bg-white text-xs">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800">{item.name}</div>
                        <div className="text-slate-500">{item.statusText}</div>
                        {item.details && <div className="text-[11px] text-slate-400 font-mono">{item.details}</div>}
                      </div>
                      <div>
                        {item.isReady ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {readiness.warnings.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                    <div className="font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Mandatory Attention Items:
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 pl-1">
                      {readiness.warnings.map((w: string, idx: number) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Appointments */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-600" />
                Scheduled Embassy & Biometric Appointments
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setIsApptModalOpen(true)} className="text-xs flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Schedule
              </Button>
            </CardHeader>
            <CardContent>
              {appointments && appointments.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {appointments.map((appt: any) => (
                    <div key={appt.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          <Badge size="sm">{appt.appointmentType.replace(/_/g, ' ')}</Badge>
                          <span>{new Date(appt.appointmentDate).toLocaleString()}</span>
                        </div>
                        <div className="text-slate-500 mt-1">
                          {appt.location && <span>Location: {appt.location} | </span>}
                          {appt.reference && <span>Ref: {appt.reference} | </span>}
                          <span>Status: {appt.status}</span>
                        </div>
                        {appt.notes && <div className="text-slate-400 italic mt-0.5">{appt.notes}</div>}
                      </div>
                      <Badge variant={appt.status === 'ATTENDED' ? 'success' : appt.status === 'CANCELLED' ? 'danger' : 'outline'}>
                        {appt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No appointments scheduled yet. Click Schedule to add biometrics, medical, or embassy interviews.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Timeline & Financial Connection */}
        <div className="space-y-6">
          {/* Status Timeline History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-primary-600" />
                Visa Progression Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {statusHistory && statusHistory.length > 0 ? (
                  statusHistory.map((hist: any) => (
                    <div key={hist.id} className="relative text-xs space-y-1">
                      <div className="absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full bg-primary-600 ring-4 ring-white" />
                      <div className="font-semibold text-slate-800">
                        {hist.newStatus.replace(/_/g, ' ')}
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        {new Date(hist.createdAt).toLocaleString()} by {hist.changedBy?.name || 'Staff'}
                      </div>
                      {hist.reason && <div className="text-slate-600 italic">"{hist.reason}"</div>}
                      {hist.notes && <div className="text-slate-500">{hist.notes}</div>}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-xs">No status history recorded.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Visa ↔ Accounting Connection (Phase 4 Integration) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Related Financial Invoices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {application?.invoices && application.invoices.length > 0 ? (
                application.invoices.map((inv: any) => (
                  <div key={inv.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <Link href={`/admin/invoices/${inv.id}`} className="font-mono font-bold text-primary-700 hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                      <Badge size="sm">{inv.status}</Badge>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total: ৳{Number(inv.totalAmount).toLocaleString()}</span>
                      <span className="font-semibold text-emerald-700">Paid: ৳{Number(inv.paidAmount).toLocaleString()}</span>
                    </div>
                    {Number(inv.dueAmount) > 0 && (
                      <div className="text-rose-600 font-semibold">Due: ৳{Number(inv.dueAmount).toLocaleString()}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-xs text-center py-4">
                  No invoices billed for this candidate yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Update Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Advance Visa Processing Status"
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Target Visa Status *</label>
            <select
              value={statusForm.toStatus}
              onChange={(e) => setStatusForm({ ...statusForm, toStatus: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800"
              required
            >
              {VISA_STATUSES.map((st) => (
                <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Transition Reason</label>
            <Input
              placeholder="e.g. MOFA approval received, biometrics passed, embassy stamped"
              value={statusForm.reason}
              onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Submission Date</label>
              <Input
                type="date"
                value={statusForm.submissionDate}
                onChange={(e) => setStatusForm({ ...statusForm, submissionDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Visa Expiry Date</label>
              <Input
                type="date"
                value={statusForm.visaExpiryDate}
                onChange={(e) => setStatusForm({ ...statusForm, visaExpiryDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Embassy / Visa Stamping Reference</label>
            <Input
              placeholder="e.g. VFS-2026-9912 or Visa Number"
              value={statusForm.referenceNumber}
              onChange={(e) => setStatusForm({ ...statusForm, referenceNumber: e.target.value })}
            />
          </div>

          {statusForm.toStatus === 'REJECTED' && (
            <div>
              <label className="block font-medium text-rose-700 mb-1">Rejection Reason *</label>
              <textarea
                rows={2}
                placeholder="Official embassy reason or rejection explanation..."
                value={statusForm.rejectionReason}
                onChange={(e) => setStatusForm({ ...statusForm, rejectionReason: e.target.value })}
                className="w-full border border-rose-300 rounded-lg p-2.5 text-slate-800"
                required
              />
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">Internal Notes</label>
            <textarea
              rows={2}
              placeholder="Internal processing remarks..."
              value={statusForm.notes}
              onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updatingStatus}>
              {updatingStatus ? 'Updating...' : 'Save & Advance Status'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Appointment Modal */}
      <Modal
        isOpen={isApptModalOpen}
        onClose={() => setIsApptModalOpen(false)}
        title="Schedule Visa Appointment"
      >
        <form onSubmit={handleApptSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Appointment Type *</label>
            <select
              value={apptForm.appointmentType}
              onChange={(e) => setApptForm({ ...apptForm, appointmentType: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800"
            >
              <option value="BIOMETRICS">Biometrics Center (VFS/Tashil/IOM)</option>
              <option value="EMBASSY">Embassy / Consulate Interview</option>
              <option value="MEDICAL">GAMCA / Authorized Medical Center</option>
              <option value="INTERVIEW">Agency Pre-Embassy Briefing</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Date & Time *</label>
            <Input
              type="datetime-local"
              value={apptForm.appointmentDate}
              onChange={(e) => setApptForm({ ...apptForm, appointmentDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Location / Center</label>
            <Input
              placeholder="e.g. VFS Global, Gulshan 1, Dhaka"
              value={apptForm.location}
              onChange={(e) => setApptForm({ ...apptForm, location: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Appointment Reference / Token</label>
            <Input
              placeholder="e.g. VFS-TOKEN-90234"
              value={apptForm.reference}
              onChange={(e) => setApptForm({ ...apptForm, reference: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Instructions for Candidate</label>
            <textarea
              rows={2}
              placeholder="e.g. Bring original passport, 2 passport size photos, and medical receipt..."
              value={apptForm.notes}
              onChange={(e) => setApptForm({ ...apptForm, notes: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsApptModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={schedulingAppt}>
              {schedulingAppt ? 'Scheduling...' : 'Confirm Appointment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
