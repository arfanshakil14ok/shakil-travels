'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Search,
  Plus,
  Download,
  Filter,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  Landmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/accounts/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
        status: statusFilter,
      });

      const res = await fetch(`/api/invoices?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data.items || []);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCount(data.data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchStats();
    fetchInvoices();
  }, [fetchInvoices]);

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = (status === 'ISSUED' || status === 'PARTIALLY_PAID') && new Date(dueDate) < new Date();
    if (isOverdue) {
      return <Badge variant="error">Overdue</Badge>;
    }
    switch (status) {
      case 'PAID':
        return <Badge variant="success">Paid in Full</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="gold">Partially Paid</Badge>;
      case 'ISSUED':
        return <Badge variant="info">Issued (Unpaid)</Badge>;
      case 'DRAFT':
        return <Badge variant="neutral">Draft</Badge>;
      case 'VOID':
        return <Badge variant="neutral">Voided</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-primary-600" />
            Billing & Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage candidate and employer invoices, installment schedules, and receivables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/accounts">
            <Button variant="outline" className="border-slate-300 text-xs">
              <Landmark className="w-4 h-4 mr-1.5" />
              Accounts Overview
            </Button>
          </Link>
          <a href="/api/invoices/export" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-slate-300 text-xs">
              <Download className="w-4 h-4 mr-1.5" />
              Export CSV
            </Button>
          </a>
          <Link href="/admin/invoices/new">
            <Button className="bg-primary-600 hover:bg-primary-700 text-white text-xs">
              <Plus className="w-4 h-4 mr-1.5" />
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Financial KPIs Banner */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Billed</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">BDT {Number(stats.totalInvoiced).toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase text-emerald-600">Total Collected</span>
            <p className="text-2xl font-bold text-emerald-700 mt-1">BDT {Number(stats.totalCollected).toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase text-amber-600">Outstanding Due</span>
            <p className="text-2xl font-bold text-amber-700 mt-1">BDT {Number(stats.totalDue).toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase text-rose-600">Overdue Invoices</span>
            <p className="text-2xl font-bold text-rose-700 mt-1">
              {stats.overdueCount} <span className="text-xs font-normal text-slate-500">({Number(stats.overdueAmount).toLocaleString()} BDT)</span>
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search invoice number, candidate name, or customer #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-slate-50 border-slate-200 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Invoices</option>
            <option value="ISSUED">Issued (Unpaid)</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid in Full</option>
            <option value="DRAFT">Draft</option>
            <option value="VOID">Voided</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Invoice #</th>
              <th className="py-3.5 px-4">Bill To (Candidate / Customer)</th>
              <th className="py-3.5 px-4">Target Job</th>
              <th className="py-3.5 px-4">Issue & Due Date</th>
              <th className="py-3.5 px-4">Total Amount</th>
              <th className="py-3.5 px-4">Paid</th>
              <th className="py-3.5 px-4">Due Balance</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700">No invoices found</p>
                  <p className="text-slate-400 mt-1">Generate an invoice to start tracking payments.</p>
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-mono font-bold text-primary-700">
                    <Link href={`/admin/invoices/${inv.id}`} className="hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{inv.applicant?.fullName || 'Direct Customer'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {inv.applicant ? `ID: ${inv.applicant.applicantNumber}` : inv.customer?.name}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {inv.application?.job?.title || 'General Services'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    <div>Issued: {new Date(inv.invoiceDate || inv.issueDate || inv.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Upon receipt'}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {inv.currency} {Number(inv.totalAmount).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-600">
                    {inv.currency} {Number(inv.paidAmount).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-rose-600">
                    {inv.currency} {Number(inv.dueAmount).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(inv.status, inv.dueDate)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link href={`/admin/invoices/${inv.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing Page {page} of {totalPages} ({totalCount} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
