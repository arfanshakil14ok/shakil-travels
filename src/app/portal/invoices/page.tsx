'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  Download,
  Receipt,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PortalInvoicesPage() {
  const [data, setData] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFinances() {
      try {
        const [invRes, payRes] = await Promise.all([
          fetch('/api/portal/invoices'),
          fetch('/api/portal/payments'),
        ]);
        const invData = await invRes.json();
        const payData = await payRes.json();
        if (invData.success) setData(invData.data);
        if (payData.success) setPayments(payData.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadFinances();
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
        Loading billing & receipt ledger...
      </div>
    );
  }

  const summary = data?.summary || { totalBilled: 0, totalPaid: 0, totalDue: 0 };
  const invoices = data?.invoices || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-primary" />
          Financial Statement & Official Receipts
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review itemized recruitment service invoices, verified bank receipts, and current account balance.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground block mb-1 font-medium">Total Billed</span>
          <div className="text-2xl font-bold text-foreground">
            ৳{Number(summary.totalBilled).toLocaleString()}
          </div>
          <span className="text-[10px] text-muted-foreground">All issued invoices</span>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground block mb-1 font-medium">Total Paid</span>
          <div className="text-2xl font-bold text-emerald-600">
            ৳{Number(summary.totalPaid).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Confirmed receipts</span>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground block mb-1 font-medium">Outstanding Balance</span>
          <div className="text-2xl font-bold text-amber-600">
            ৳{Number(summary.totalDue).toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">Current balance due</span>
        </div>
      </div>

      {/* Invoices Section */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Issued Invoices
        </h3>

        {invoices.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No invoices have been issued to your candidate account yet.
          </p>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv: any) => (
              <div
                key={inv.id}
                className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">
                      {inv.invoiceNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'PARTIALLY_PAID'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Date: {new Date(inv.invoiceDate).toLocaleDateString()}
                    {inv.dueDate && ` • Due: ${new Date(inv.dueDate).toLocaleDateString()}`}
                  </div>
                  {inv.items && inv.items.length > 0 && (
                    <div className="text-xs text-foreground mt-2 font-medium">
                      Items: {inv.items.map((it: any) => it.description).join(', ')}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-bold text-foreground">
                    ৳{Number(inv.totalAmount).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Paid: ৳{Number(inv.paidAmount).toLocaleString()} | Due: ৳
                    {Number(inv.dueAmount).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Receipts Section */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-600" />
          Official Payment Receipts
        </h3>

        {payments.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No payments recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border font-semibold text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Receipt No</th>
                  <th className="px-4 py-3">Invoice Ref</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Payment Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono font-bold text-primary">
                      {pay.receiptNumber || pay.paymentNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {pay.invoice?.invoiceNumber || '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {pay.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(pay.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                      ৳{Number(pay.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
