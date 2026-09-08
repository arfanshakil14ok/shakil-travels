'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ArrowLeft,
  RefreshCw,
  Download,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  PieChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function FinancialReportPage() {
  const { error } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [preset, setPreset] = useState('THIS_YEAR');
  const [loading, setLoading] = useState(true);

  const fetchFinancials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/financial?preset=${preset}`);
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      } else {
        error(resData.error || 'Failed to load financial report');
      }
    } catch {
      error('Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  }, [preset, error]);

  useEffect(() => {
    fetchFinancials();
  }, [fetchFinancials]);

  const totals = data?.totals || {
    totalBilled: 0,
    totalPaid: 0,
    totalDue: 0,
    totalCollected: 0,
    totalRefunded: 0,
    netRevenue: 0,
  };

  const aging = data?.aging || {
    currentDue: 0,
    overdue1to30: 0,
    overdue31to60: 0,
    overdue60plus: 0,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/reports"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Intelligence Hub
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-primary" />
            Financial Revenue & Aging Receivables Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise accounting summary: billed recruitment fees, verified payment receipts, and collection aging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="text-xs bg-card border border-border rounded-lg p-2 font-medium"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
          >
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="THIS_QUARTER">This Quarter</option>
            <option value="THIS_YEAR">This Year</option>
            <option value="ALL_TIME">All Time</option>
          </select>

          <Button variant="outline" size="sm" onClick={fetchFinancials} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <a href={`/api/reports/export?type=financial&preset=${preset}`} download>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1.5" />
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Total Invoiced</span>
          <div className="text-2xl font-bold text-foreground">
            ৳{Number(totals.totalBilled).toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground">{data?.invoiceCount || 0} invoices issued</span>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Verified Receipts</span>
          <div className="text-2xl font-bold text-emerald-600">
            ৳{Number(totals.totalCollected).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">{data?.paymentCount || 0} payments confirmed</span>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Outstanding Receivables</span>
          <div className="text-2xl font-bold text-amber-600">
            ৳{Number(totals.totalDue).toLocaleString()}
          </div>
          <span className="text-[11px] text-amber-600 font-medium">Pending collection</span>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Net Revenue</span>
          <div className="text-2xl font-bold text-primary">
            ৳{Number(totals.netRevenue).toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground">After candidate refunds</span>
        </div>
      </div>

      {/* Aging Receivables Breakdown */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          Accounts Receivable Aging Schedule
        </h3>
        <p className="text-xs text-muted-foreground">
          Categorization of outstanding balances by overdue duration to optimize collection efforts.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-muted/20">
            <span className="text-xs text-muted-foreground font-medium block mb-1">Current (Not Overdue)</span>
            <div className="text-xl font-bold text-foreground">
              ৳{Number(aging.currentDue).toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">Standard Terms</span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
            <span className="text-xs text-amber-800 dark:text-amber-300 font-medium block mb-1">1 – 30 Days Overdue</span>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-400">
              ৳{Number(aging.overdue1to30).toLocaleString()}
            </div>
            <span className="text-[10px] text-amber-700">Follow-up Notice</span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-orange-50/40 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
            <span className="text-xs text-orange-800 dark:text-orange-300 font-medium block mb-1">31 – 60 Days Overdue</span>
            <div className="text-xl font-bold text-orange-700 dark:text-orange-400">
              ৳{Number(aging.overdue31to60).toLocaleString()}
            </div>
            <span className="text-[10px] text-orange-700">Urgent Collection</span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900">
            <span className="text-xs text-rose-800 dark:text-rose-300 font-medium block mb-1">60+ Days Overdue</span>
            <div className="text-xl font-bold text-rose-700 dark:text-rose-400">
              ৳{Number(aging.overdue60plus).toLocaleString()}
            </div>
            <span className="text-[10px] text-rose-700">High Risk / Recovery</span>
          </div>
        </div>
      </div>

      {/* Payment Method Distribution */}
      {data?.paymentMethods && data.paymentMethods.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            Collections by Payment Channel
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.paymentMethods.map((pm: any) => (
              <div key={pm.method} className="p-3.5 rounded-xl border border-border bg-muted/20">
                <span className="text-xs text-muted-foreground font-semibold block mb-1">
                  {pm.method}
                </span>
                <div className="text-base font-bold text-foreground">
                  ৳{Number(pm.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
