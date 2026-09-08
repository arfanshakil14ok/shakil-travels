'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChartNoAxesCombined,
  ArrowLeft,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  BriefcaseBusiness,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FinancialReportsPage() {
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounts/reports');
      const data = await res.json();
      if (data.success) {
        setReportData(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <Link href="/admin/accounts" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 font-medium mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Accounts Overview
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ChartNoAxesCombined className="w-7 h-7 text-primary-600" />
            Executive Financial & Accounts Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Revenue breakdown by service stream, payment methods share, and accounts receivable debtor aging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()} variant="outline" className="border-slate-300 text-xs">
            <Printer className="w-4 h-4 mr-1.5" />
            Print Report
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 text-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-600" />
          Compiling financial reporting matrices...
        </div>
      ) : !reportData ? (
        <div className="py-24 text-center text-slate-500 text-sm">
          Failed to load financial reports.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Aging Analysis Cards */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Accounts Receivable Aging Analysis (Overdue Debtors)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase block">0 - 30 Days</span>
                <p className="text-xl font-bold text-emerald-900 mt-1">
                  BDT {Number(reportData.aging['0-30 days']).toLocaleString()}
                </p>
                <span className="text-[10px] text-emerald-600">Fresh invoices</span>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <span className="text-[11px] font-semibold text-amber-800 uppercase block">31 - 60 Days</span>
                <p className="text-xl font-bold text-amber-900 mt-1">
                  BDT {Number(reportData.aging['31-60 days']).toLocaleString()}
                </p>
                <span className="text-[10px] text-amber-600">Follow-up needed</span>
              </div>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <span className="text-[11px] font-semibold text-orange-800 uppercase block">61 - 90 Days</span>
                <p className="text-xl font-bold text-orange-900 mt-1">
                  BDT {Number(reportData.aging['61-90 days']).toLocaleString()}
                </p>
                <span className="text-[10px] text-orange-600">Urgent recovery</span>
              </div>

              <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                <span className="text-[11px] font-semibold text-rose-800 uppercase block">90+ Days (Critical)</span>
                <p className="text-xl font-bold text-rose-900 mt-1">
                  BDT {Number(reportData.aging['90+ days']).toLocaleString()}
                </p>
                <span className="text-[10px] text-rose-600">High default risk</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Stream by Service */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <BriefcaseBusiness className="w-4 h-4 text-primary-600" />
                Revenue Distribution by Service
              </h2>

              <div className="divide-y divide-slate-100 text-xs">
                {reportData.serviceRevenue.map((srv: any) => (
                  <div key={srv.code} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 block">{srv.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Code: {srv.code} • Billed: {srv.count} times
                      </span>
                    </div>
                    <div className="text-right font-bold text-slate-900 text-sm">
                      BDT {Number(srv.total).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inflows by Payment Method */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Collections by Payment Method
              </h2>

              <div className="divide-y divide-slate-100 text-xs">
                {reportData.paymentMethods.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">No payment data recorded yet.</div>
                ) : (
                  reportData.paymentMethods.map((pm: any) => (
                    <div key={pm.method} className="py-3 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {pm.method.replace(/_/g, ' ')}
                      </span>
                      <span className="font-bold text-emerald-700 text-sm">
                        BDT {Number(pm.amount).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
