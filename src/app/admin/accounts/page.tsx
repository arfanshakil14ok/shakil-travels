'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Landmark,
  Receipt,
  CreditCard,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Calendar,
  CheckCircle2,
  DollarSign,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AccountsDashboardPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [overdueInvoices, setOverdueInvoices] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccountsData = async () => {
    setLoading(true);
    try {
      const [statsRes, overdueRes, paymentsRes] = await Promise.all([
        fetch('/api/accounts/stats'),
        fetch('/api/invoices?isOverdue=true&limit=5'),
        fetch('/api/payments?limit=5'),
      ]);

      const [statsData, overdueData, paymentsData] = await Promise.all([
        statsRes.json(),
        overdueRes.json(),
        paymentsRes.json(),
      ]);

      if (statsData.success) setStats(statsData.data);
      if (overdueData.success) setOverdueInvoices(overdueData.data?.items || []);
      if (paymentsData.success) setRecentPayments(paymentsData.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountsData();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-7 h-7 text-primary-600" />
            Financial & Accounts Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time accounts receivable, cash inflows, debtor aging, and customer ledgers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/invoices/new">
            <Button className="bg-primary-600 hover:bg-primary-700 text-white text-xs">
              <Plus className="w-4 h-4 mr-1.5" />
              New Invoice
            </Button>
          </Link>
          <Link href="/admin/accounts/ledger">
            <Button variant="outline" className="border-slate-300 text-xs">
              <Wallet className="w-4 h-4 mr-1.5" />
              Customer Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
            <p className="text-2xl font-black text-slate-900">BDT {Number(stats.totalInvoiced).toLocaleString()}</p>
            <span className="text-[11px] text-slate-400 block">{stats.invoiceCount} official invoices generated</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Collected</span>
            <p className="text-2xl font-black text-emerald-700">BDT {Number(stats.totalCollected).toLocaleString()}</p>
            <span className="text-[11px] text-emerald-600 font-medium block">
              {stats.breakdown?.paidCount} paid in full, {stats.breakdown?.partiallyPaidCount} installments
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Outstanding Due</span>
            <p className="text-2xl font-black text-amber-700">BDT {Number(stats.totalDue).toLocaleString()}</p>
            <span className="text-[11px] text-slate-400 block">Pending collection from candidates</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Overdue Debt</span>
            <p className="text-2xl font-black text-rose-700">BDT {Number(stats.overdueAmount).toLocaleString()}</p>
            <span className="text-[11px] text-rose-600 font-medium block">
              {stats.overdueCount} invoices past due date
            </span>
          </div>

          {/* Second row stats */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Today&apos;s Collection</span>
            <p className="text-xl font-bold text-slate-900 mt-1">BDT {Number(stats.todayCollected).toLocaleString()}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">This Month&apos;s Inflow</span>
            <p className="text-xl font-bold text-primary-700 mt-1">BDT {Number(stats.monthCollected).toLocaleString()}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Refunds Processed</span>
            <p className="text-xl font-bold text-slate-700 mt-1">BDT {Number(stats.totalRefunded).toLocaleString()}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Collection Efficiency</span>
            <p className="text-xl font-bold text-emerald-700 mt-1">
              {Number(stats.totalInvoiced) > 0
                ? `${Math.round((Number(stats.totalCollected) / Number(stats.totalInvoiced)) * 100)}%`
                : '0%'}
            </p>
          </div>
        </div>
      )}

      {/* Overdue Alert Queue & Recent Collections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overdue Queue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Overdue Receivables Queue
              </h2>
            </div>
            <Link href="/admin/invoices?isOverdue=true" className="text-xs text-primary-600 font-medium hover:underline flex items-center">
              View All ({stats?.overdueCount || 0}) <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading overdue invoices...</div>
          ) : overdueInvoices.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <span className="font-semibold text-slate-700">No Overdue Invoices</span>
              <span>All candidate accounts are current or paid in full.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {overdueInvoices.map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{inv.applicant?.fullName || 'Customer'}</div>
                    <div className="text-slate-500 font-mono text-[10px]">
                      {inv.invoiceNumber} • Due Date: {new Date(inv.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-600 block">
                      BDT {Number(inv.dueAmount).toLocaleString()}
                    </span>
                    <Link href={`/admin/invoices/${inv.id}`}>
                      <span className="text-[11px] text-primary-600 hover:underline">Collect Payment</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments Stream */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent Payment Collections
              </h2>
            </div>
            <Link href="/admin/payments" className="text-xs text-primary-600 font-medium hover:underline flex items-center">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading payments...</div>
          ) : recentPayments.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No payments recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentPayments.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{p.invoice?.applicant?.fullName || 'Candidate'}</div>
                    <div className="text-slate-500 font-mono text-[10px]">
                      Receipt: {p.receiptNumber} • {p.paymentMethod.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700 block">
                      BDT {Number(p.amount).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/accounts/ledger" className="block group">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-400 transition-all">
            <Wallet className="w-6 h-6 text-primary-600 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-slate-900 text-sm">Customer Ledgers</h3>
            <p className="text-xs text-slate-500 mt-1">
              View running debit/credit statements and closing balances per applicant.
            </p>
          </div>
        </Link>

        <Link href="/admin/services" className="block group">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-400 transition-all">
            <BriefcaseBusiness className="w-6 h-6 text-primary-600 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-slate-900 text-sm">Service Catalog</h3>
            <p className="text-xs text-slate-500 mt-1">
              Manage standardized recruitment, visa processing, and medical fees.
            </p>
          </div>
        </Link>

        <Link href="/admin/accounts/reports" className="block group">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-400 transition-all">
            <ChartNoAxesCombined className="w-6 h-6 text-primary-600 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-slate-900 text-sm">Financial Reports</h3>
            <p className="text-xs text-slate-500 mt-1">
              Revenue distribution by service, payment method shares, and aging brackets.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
