'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  User,
  Building2,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StaffInvoicesPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ totalPages: 1, total: 0 });

  // Create Invoice Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [candidatesList, setCandidatesList] = useState<any[]>([]);
  const [employersList, setEmployersList] = useState<any[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [formData, setFormData] = useState({
    recipientType: 'CANDIDATE',
    applicantId: '',
    employerId: '',
    customerName: '',
    customerPhone: '',
    title: 'Recruitment & Visa Processing Charges',
    currency: 'BDT',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [
      {
        feeType: 'PROCESSING_FEE',
        description: 'Agency Processing Fee & Documentation',
        quantity: 1,
        unitPrice: 50000,
      },
    ],
  });

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status !== 'ALL') params.set('status', status);
      params.set('page', page.toString());
      params.set('limit', '20');

      const res = await fetch(`/api/staff/invoices?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setInvoices(json.data);
        setSummary(json.summary || {});
        setPagination(json.pagination || { totalPages: 1, total: 0 });
      } else {
        setError(json.error || 'Failed to fetch invoices');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [status, page]);

  useEffect(() => {
    if (showCreateModal) {
      setLoadingRecipients(true);
      Promise.all([
        fetch('/api/applicants?limit=50').then((r) => r.json()).catch(() => ({})),
        fetch('/api/employers?limit=50').then((r) => r.json()).catch(() => ({})),
      ])
        .then(([cData, eData]) => {
          if (cData.success && cData.data?.items) {
            setCandidatesList(cData.data.items);
            if (!formData.applicantId && cData.data.items.length > 0) {
              setFormData((prev) => ({ ...prev, applicantId: cData.data.items[0].id }));
            }
          }
          if (eData.success && eData.data?.items) {
            setEmployersList(eData.data.items);
            if (!formData.employerId && eData.data.items.length > 0) {
              setFormData((prev) => ({ ...prev, employerId: eData.data.items[0].id }));
            }
          }
        })
        .finally(() => setLoadingRecipients(false));
    }
  }, [showCreateModal]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInvoices();
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/staff/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        fetchInvoices();
      } else {
        alert(json.error || 'Failed to create invoice');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating invoice');
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (amt: number | string | null | undefined) => {
    const val = Number(amt || 0);
    return `৳${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'PAID':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">PAID</span>;
      case 'PARTIALLY_PAID':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-yellow-950 text-yellow-300 border border-yellow-800">PARTIAL</span>;
      case 'OVERDUE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">OVERDUE</span>;
      case 'ISSUED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-950 text-sky-300 border border-sky-800">ISSUED</span>;
      case 'DRAFT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">DRAFT</span>;
      case 'VOID':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 text-slate-500 border border-slate-800">VOID</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">{st}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-400" />
            Invoices & Billing Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official agency tax invoices, candidate charges, payment tracking & double-entry ledger integration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchInvoices}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Total Invoiced (Filtered)</div>
          <div className="text-xl font-bold text-white mt-1">
            {formatCurrency(summary.totalInvoiced)}
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-emerald-400 font-medium">Total Paid (Filtered)</div>
          <div className="text-xl font-bold text-emerald-300 mt-1">
            {formatCurrency(summary.totalPaid)}
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-amber-400 font-medium">Total Due (Filtered)</div>
          <div className="text-xl font-bold text-amber-300 mt-1">
            {formatCurrency(summary.totalDue)}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search invoice #, candidate, tracking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </form>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
          {['ALL', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'DRAFT', 'VOID'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatus(st);
                setPage(1);
              }}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-lg border transition',
                status === st
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/60 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Job / Demand</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && invoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    No invoices found matching criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-mono font-medium text-indigo-300">
                      <Link href={`/staff/invoices/${inv.id}`} className="hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">
                        {inv.applicant?.fullName || inv.employer?.companyName || inv.recipientName || 'N/A'}
                      </div>
                      {inv.applicant?.trackingNo && (
                        <div className="text-[10px] text-indigo-400 font-mono">
                          {inv.applicant.trackingNo}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {inv.job?.title || 'General Services'}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-medium">
                      {formatCurrency(inv.paidAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-300">
                      {formatCurrency(inv.dueAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/staff/invoices/${inv.id}`}
                        className="px-2.5 py-1 bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-700/60 rounded text-[11px] font-medium transition"
                      >
                        View &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page <span className="font-semibold text-white">{page}</span> of{' '}
              <span className="font-semibold text-white">{pagination.totalPages}</span> ({pagination.total} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none rounded border border-slate-700"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none rounded border border-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                Generate New Official Invoice
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Recipient Type</label>
                <select
                  value={formData.recipientType}
                  onChange={(e) => setFormData({ ...formData, recipientType: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="CANDIDATE">Candidate / Applicant</option>
                  <option value="EMPLOYER">Overseas Employer</option>
                  <option value="OTHER">Other / Direct Customer</option>
                </select>
              </div>

              {formData.recipientType === 'CANDIDATE' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Select Candidate / Applicant <span className="text-rose-400">*</span>
                  </label>
                  {candidatesList.length > 0 ? (
                    <select
                      value={formData.applicantId}
                      onChange={(e) => setFormData({ ...formData, applicantId: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 font-medium"
                      required
                    >
                      <option value="">-- Choose Candidate --</option>
                      {candidatesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.applicantNumber || 'No ID'}) {c.phone ? `• ${c.phone}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Enter Candidate Tracking Number or Phone..."
                      value={formData.applicantId}
                      onChange={(e) => setFormData({ ...formData, applicantId: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    Invoice will be linked to the candidate&apos;s ledger and applicant portal.
                  </p>
                </div>
              )}

              {formData.recipientType === 'EMPLOYER' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Select Overseas Employer <span className="text-rose-400">*</span>
                  </label>
                  {employersList.length > 0 ? (
                    <select
                      value={formData.employerId}
                      onChange={(e) => setFormData({ ...formData, employerId: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 font-medium"
                      required
                    >
                      <option value="">-- Choose Employer --</option>
                      {employersList.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.companyName} {emp.country ? `(${emp.country.name})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Enter Employer Name or Company..."
                      value={formData.employerId}
                      onChange={(e) => setFormData({ ...formData, employerId: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              )}

              {formData.recipientType === 'OTHER' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Direct Client / Organization Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Client or Company Name..."
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +880 1712-345678"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Invoice Subject / Description</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                    <option value="SAR">SAR (ر.س)</option>
                    <option value="AED">AED (د.إ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                    Itemized Fees & Services ({formData.items.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        items: [
                          ...formData.items,
                          {
                            feeType: 'VISA_FEE',
                            description: 'Visa & Stamping Fee',
                            quantity: 1,
                            unitPrice: 20000,
                          },
                        ],
                      });
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    + Add Item Row
                  </button>
                </div>

                {formData.items.map((item, idx) => (
                  <div key={idx} className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 text-[11px]">Row #{idx + 1}</span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = formData.items.filter((_, i) => i !== idx);
                            setFormData({ ...formData, items: next });
                          }}
                          className="text-rose-400 hover:text-rose-300 text-[11px]"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Service details..."
                        value={item.description}
                        onChange={(e) => {
                          const items = [...formData.items];
                          items[idx].description = e.target.value;
                          setFormData({ ...formData, items });
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-400 text-[10px]">Fee Category</label>
                        <select
                          value={item.feeType}
                          onChange={(e) => {
                            const items = [...formData.items];
                            items[idx].feeType = e.target.value;
                            setFormData({ ...formData, items });
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-[11px]"
                        >
                          <option value="PROCESSING_FEE">Processing Fee</option>
                          <option value="MEDICAL_FEE">Medical Fee</option>
                          <option value="VISA_FEE">Visa & Stamping</option>
                          <option value="BMET_CLEARANCE_FEE">BMET Clearance</option>
                          <option value="AIR_TICKET_FEE">Air Ticket Fee</option>
                          <option value="SERVICE_CHARGE">Service Charge</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px]">Qty</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const items = [...formData.items];
                            items[idx].quantity = Math.max(1, Number(e.target.value));
                            setFormData({ ...formData, items });
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px]">Unit Price ({formData.currency})</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const items = [...formData.items];
                            items[idx].unitPrice = Number(e.target.value);
                            setFormData({ ...formData, items });
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-right font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-slate-800 rounded-lg flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Total Invoice Amount:</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {formData.currency}{' '}
                  {formData.items
                    .reduce((sum, it) => sum + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0), 0)
                    .toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm"
                >
                  {creating ? 'Creating...' : 'Create Official Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
