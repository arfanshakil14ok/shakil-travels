'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

export default function StaffClearancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields for editing
  const [formStatus, setFormStatus] = useState('SUBMITTED');
  const [formSmartCard, setFormSmartCard] = useState('');
  const [formCertNumber, setFormCertNumber] = useState('');
  const [formSubmissionDate, setFormSubmissionDate] = useState('');
  const [formApprovalDate, setFormApprovalDate] = useState('');
  const [formRemarks, setFormRemarks] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (typeFilter !== 'ALL') params.set('clearanceType', typeFilter);

      const res = await fetch(`/api/post-selection/clearance?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load clearance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecords();
  };

  const openEditModal = (rec: any) => {
    setEditingRecord(rec);
    setFormStatus(rec.status || 'SUBMITTED');
    setFormSmartCard(rec.smartCardNumber || '');
    setFormCertNumber(rec.certificateNumber || '');
    setFormSubmissionDate(rec.submissionDate ? rec.submissionDate.substring(0, 10) : '');
    setFormApprovalDate(rec.approvalDate ? rec.approvalDate.substring(0, 10) : '');
    setFormRemarks(rec.remarks || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/post-selection/clearance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRecord.id,
          status: formStatus,
          smartCardNumber: formSmartCard,
          certificateNumber: formCertNumber,
          submissionDate: formSubmissionDate ? formSubmissionDate : null,
          approvalDate: formApprovalDate ? formApprovalDate : null,
          remarks: formRemarks,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingRecord(null);
        loadRecords();
      } else {
        alert(data.error || 'Failed to update record');
      }
    } catch (err) {
      alert('Network error while updating clearance record');
    } finally {
      setIsSaving(false);
    }
  };

  const stats = {
    total: records.length,
    approved: records.filter((r) => r.status === 'APPROVED').length,
    inReview: records.filter((r) => r.status === 'IN_REVIEW' || r.status === 'SUBMITTED').length,
    pending: records.filter((r) => r.status === 'NOT_STARTED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              Post-Selection Operations
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            BMET Emigration Clearance & Smart Card
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Bureau of Manpower, Employment and Training (BMET) clearance, police verification, and Smart Cards.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadRecords}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Total Clearance Files</span>
          <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
        </div>
        <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-xs bg-emerald-50/20">
          <span className="text-xs text-emerald-700 font-medium block">Approved & Smart Card</span>
          <span className="text-2xl font-bold text-emerald-700">{stats.approved}</span>
        </div>
        <div className="p-4 bg-white border border-sky-200 rounded-xl shadow-xs bg-sky-50/20">
          <span className="text-xs text-sky-700 font-medium block">Submitted / In Review</span>
          <span className="text-2xl font-bold text-sky-700">{stats.inReview}</span>
        </div>
        <div className="p-4 bg-white border border-amber-200 rounded-xl shadow-xs bg-amber-50/20">
          <span className="text-xs text-amber-700 font-medium block">Not Started</span>
          <span className="text-2xl font-bold text-amber-700">{stats.pending}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search candidate, Smart Card No, cert..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-600 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Status</option>
              <option value="NOT_STARTED">NOT_STARTED</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-600 font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Types</option>
              <option value="BMET_EMIGRATION">BMET Emigration</option>
              <option value="POLICE_CLEARANCE">Police Clearance</option>
              <option value="EMBASSY_CLEARANCE">Embassy Clearance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState text="Loading clearance files..." />
      ) : records.length === 0 ? (
        <EmptyState
          title="No Clearance Records Found"
          description="There are currently no BMET emigration clearance records matching your criteria."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Clearance Type</th>
                  <th className="py-3 px-4">BMET Smart Card No</th>
                  <th className="py-3 px-4">Certificate No</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{rec.applicant?.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {rec.applicant?.applicantNumber} • {rec.applicant?.passportNumber || 'No Passport'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">{rec.clearanceType}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900">
                        {rec.smartCardNumber || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-600">
                        {rec.certificateNumber || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {rec.submissionDate ? (
                        <span className="text-slate-600">
                          {new Date(rec.submissionDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not submitted</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : rec.status === 'IN_REVIEW' || rec.status === 'SUBMITTED'
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : rec.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(rec)}
                        className="text-xs h-7 px-2.5"
                      >
                        Update Clearance
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Clearance Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Update Emigration Clearance</h3>
                <p className="text-xs text-slate-500">
                  Candidate: {editingRecord.applicant?.fullName} ({editingRecord.applicant?.applicantNumber})
                </p>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clearance Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="NOT_STARTED">NOT_STARTED</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="IN_REVIEW">IN_REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">BMET Smart Card Number</label>
                  <input
                    type="text"
                    value={formSmartCard}
                    onChange={(e) => setFormSmartCard(e.target.value)}
                    placeholder="e.g. BMET-SC-892102"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clearance Certificate / Document Number</label>
                <input
                  type="text"
                  value={formCertNumber}
                  onChange={(e) => setFormCertNumber(e.target.value)}
                  placeholder="e.g. BMET-CERT-2026-784"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Submission Date</label>
                  <input
                    type="date"
                    value={formSubmissionDate}
                    onChange={(e) => setFormSubmissionDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Approval Date</label>
                  <input
                    type="date"
                    value={formApprovalDate}
                    onChange={(e) => setFormApprovalDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Officer Remarks / Notes</label>
                <textarea
                  rows={2}
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Notes on Ministry approval, biometric slip, immigration compliance..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRecord(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Clearance'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
