'use client';

import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  FileText,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

export default function StaffMedicalPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('ALL');
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields for editing
  const [formResult, setFormResult] = useState('PENDING');
  const [formCenter, setFormCenter] = useState('');
  const [formGamca, setFormGamca] = useState('');
  const [formExamDate, setFormExamDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formRemarks, setFormRemarks] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (resultFilter !== 'ALL') params.set('result', resultFilter);

      const res = await fetch(`/api/post-selection/medical?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load medical records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [resultFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecords();
  };

  const openEditModal = (rec: any) => {
    setEditingRecord(rec);
    setFormResult(rec.result || 'PENDING');
    setFormCenter(rec.medicalCenterName || '');
    setFormGamca(rec.gamcaNumber || '');
    setFormExamDate(rec.examinationDate ? rec.examinationDate.substring(0, 10) : '');
    setFormExpiryDate(rec.fitnessExpiryDate ? rec.fitnessExpiryDate.substring(0, 10) : '');
    setFormRemarks(rec.remarks || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/post-selection/medical', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRecord.id,
          medicalCenterName: formCenter,
          gamcaNumber: formGamca,
          result: formResult,
          examinationDate: formExamDate ? formExamDate : null,
          fitnessExpiryDate: formExpiryDate ? formExpiryDate : null,
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
      alert('Network error while updating medical record');
    } finally {
      setIsSaving(false);
    }
  };

  const stats = {
    total: records.length,
    passed: records.filter((r) => r.result === 'PASSED').length,
    pending: records.filter((r) => r.result === 'PENDING' || r.result === 'SCHEDULED').length,
    failed: records.filter((r) => r.result === 'FAILED').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">
              Post-Selection Operations
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Medical Examination & GAMCA Processing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage pre-departure clinical fitness tests, GCC GAMCA slips, and fitness certifications.
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
          <span className="text-xs text-slate-500 font-medium block">Total Medical Cases</span>
          <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
        </div>
        <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-xs bg-emerald-50/20">
          <span className="text-xs text-emerald-700 font-medium block">Passed & Fit</span>
          <span className="text-2xl font-bold text-emerald-700">{stats.passed}</span>
        </div>
        <div className="p-4 bg-white border border-amber-200 rounded-xl shadow-xs bg-amber-50/20">
          <span className="text-xs text-amber-700 font-medium block">Pending / Scheduled</span>
          <span className="text-2xl font-bold text-amber-700">{stats.pending}</span>
        </div>
        <div className="p-4 bg-white border border-rose-200 rounded-xl shadow-xs bg-rose-50/20">
          <span className="text-xs text-rose-700 font-medium block">Unfit / Retest</span>
          <span className="text-2xl font-bold text-rose-700">{stats.failed}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search candidate, GAMCA slip, center..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-600 font-medium">Result:</span>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Results</option>
            <option value="PENDING">PENDING</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="PASSED">PASSED</option>
            <option value="FAILED">FAILED</option>
            <option value="RETEST_REQUIRED">RETEST_REQUIRED</option>
          </select>
        </div>
      </div>

      {/* Table of Records */}
      {loading ? (
        <LoadingState text="Loading medical records..." />
      ) : records.length === 0 ? (
        <EmptyState
          title="No Medical Records Found"
          description="There are currently no candidate medical records matching your filter criteria."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Candidate / Code</th>
                  <th className="py-3 px-4">Job & Country</th>
                  <th className="py-3 px-4">Medical Center</th>
                  <th className="py-3 px-4">GAMCA Slip No</th>
                  <th className="py-3 px-4">Exam Date</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{rec.applicant?.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {rec.applicant?.applicantNumber} • {rec.applicant?.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">
                        {rec.application?.job?.title || 'Direct Processing'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {rec.application?.job?.country?.name || 'Overseas'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{rec.medicalCenterName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-slate-700">
                        {rec.gamcaNumber || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {rec.examinationDate ? (
                        <span className="text-slate-600">
                          {new Date(rec.examinationDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not scheduled</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.result === 'PASSED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : rec.result === 'FAILED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {rec.result}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(rec)}
                        className="text-xs h-7 px-2.5"
                      >
                        Update Result
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Update Medical Record</h3>
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
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medical Center Name</label>
                <input
                  type="text"
                  value={formCenter}
                  onChange={(e) => setFormCenter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GAMCA Slip / Report No</label>
                  <input
                    type="text"
                    value={formGamca}
                    onChange={(e) => setFormGamca(e.target.value)}
                    placeholder="e.g. GAMCA-892120"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medical Result Status</label>
                  <select
                    value={formResult}
                    onChange={(e) => setFormResult(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="PASSED">PASSED</option>
                    <option value="FAILED">FAILED</option>
                    <option value="RETEST_REQUIRED">RETEST_REQUIRED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Examination Date</label>
                  <input
                    type="date"
                    value={formExamDate}
                    onChange={(e) => setFormExamDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fitness Expiry Date</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Doctor / Officer Remarks</label>
                <textarea
                  rows={2}
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Notes on clinical test, chest X-Ray, blood test..."
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
                  {isSaving ? 'Saving...' : 'Save Medical Result'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
