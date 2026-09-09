'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Printer,
  Building2,
  Calendar,
  CreditCard,
  ExternalLink,
  PhoneCall,
  Clock,
  Ban,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function InvoiceVerifyPage({
  params,
}: {
  params?: { invoiceNumber?: string };
}) {
  const routeParams = useParams();
  const invoiceNumber =
    (routeParams?.invoiceNumber as string) || params?.invoiceNumber || '';
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyInvoice() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/invoices/verify/${encodeURIComponent(invoiceNumber)}`);
        const result = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Invoice not found in official registry');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to verify invoice');
      } finally {
        setLoading(false);
      }
    }

    if (invoiceNumber) {
      verifyInvoice();
    }
  }, [invoiceNumber]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-14 h-14 rounded-2xl bg-white shadow-lg border border-slate-200 flex items-center justify-center mb-4">
          <Clock className="w-7 h-7 text-primary-600 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Verifying Invoice Authenticity...</h2>
        <p className="text-xs text-slate-500 mt-1 font-mono">{decodeURIComponent(invoiceNumber)}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-4 text-rose-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-slate-900">Verification Unsuccessful</h1>
        <p className="text-sm text-slate-600 max-w-md text-center mt-2">
          {error || 'The requested invoice could not be verified in the SHAKIL GLOBAL MANPOWER database.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link href="/">
            <Button variant="outline" className="text-xs">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Home
            </Button>
          </Link>
          <Link href="/contact">
            <Button className="bg-primary-600 text-white text-xs">
              <PhoneCall className="w-4 h-4 mr-1.5" /> Contact Accounts Department
            </Button>
          </Link>
        </div>
        <div className="mt-8 text-[11px] text-slate-400 font-mono">
          Query: {decodeURIComponent(invoiceNumber)}
        </div>
      </div>
    );
  }

  const isVoid = data.status === 'VOID';
  const isPaid = data.status === 'PAID';
  const isPartial = data.status === 'PARTIALLY_PAID';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Verification Certificate Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-none">
          {/* Header Banner */}
          <div className="bg-navy-950 text-white p-6 sm:p-8 border-b border-navy-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    OFFICIAL VERIFIED INVOICE
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-2 tracking-tight">
                  {data.agencyName}
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Government Approved Recruiting Agency • License No: {data.agencyLicense}
                </p>
              </div>

              <div className="sm:text-right">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Invoice Number
                </div>
                <div className="font-mono text-base font-bold text-gold-400 mt-0.5">
                  {data.invoiceNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div
            className={`p-4 border-b flex items-center justify-between ${
              isVoid
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : isPaid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : isPartial
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-sky-50 border-sky-200 text-sky-900'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {isVoid ? (
                <Ban className="w-4 h-4 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
              <span>
                {isVoid
                  ? 'Invoice has been VOIDED by Agency Accounts'
                  : isPaid
                  ? 'Payment Completed in Full'
                  : isPartial
                  ? 'Partially Paid — Balance Outstanding'
                  : 'Invoice Issued — Awaiting Payment'}
              </span>
            </div>

            <Badge
              variant={isPaid ? 'success' : isPartial ? 'gold' : isVoid ? 'error' : 'info'}
            >
              {data.status.replace(/_/g, ' ')}
            </Badge>
          </div>

          {/* Core Invoice Summary */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Key Figures Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                  Total Payable
                </span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {data.currency} {data.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block">
                  Paid Amount
                </span>
                <div className="text-xl font-bold text-emerald-700 mt-1">
                  {data.currency} {data.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 block">
                  Due Balance
                </span>
                <div className="text-xl font-bold text-rose-600 mt-1">
                  {data.currency} {data.dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Candidate / Billed To Details */}
            <div className="border-t border-slate-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Billed To
                </span>
                <div className="text-sm font-bold text-slate-900">{data.billedTo}</div>
                {data.targetJob && (
                  <div className="text-slate-600 mt-1">
                    Job Demand: <strong className="text-slate-800">{data.targetJob}</strong>
                  </div>
                )}
              </div>

              <div className="space-y-1 text-slate-600 sm:text-right">
                <div>
                  <span className="font-medium text-slate-400">Issue Date:</span>{' '}
                  <strong className="text-slate-800">
                    {new Date(data.issueDate).toLocaleDateString()}
                  </strong>
                </div>
                <div>
                  <span className="font-medium text-slate-400">Due Date:</span>{' '}
                  <strong className="text-slate-800">
                    {new Date(data.dueDate).toLocaleDateString()}
                  </strong>
                </div>
                <div>
                  <span className="font-medium text-slate-400">Currency:</span>{' '}
                  <strong className="text-slate-800">{data.currency}</strong>
                </div>
              </div>
            </div>

            {/* Billed Services Overview */}
            {data.services && data.services.length > 0 && (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Authorized Recruitment & Processing Services ({data.services.length})
                </h3>
                <div className="space-y-2">
                  {data.services.map((srv: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                    >
                      <span className="font-medium text-slate-800">
                        {srv.description}
                        {srv.serviceCode && (
                          <span className="ml-2 font-mono text-[10px] text-slate-400">
                            [{srv.serviceCode}]
                          </span>
                        )}
                      </span>
                      <span className="text-slate-500 font-semibold">Qty: {srv.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Official Verification Stamp & Advisory */}
            <div className="border-t border-slate-100 pt-6">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Central Registry Verification Guarantee</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-900/90">
                  This invoice is officially verified by the SHAKIL GLOBAL MANPOWER Central Database under Government Recruiting License <strong>RL-1892</strong>. Any payment voucher or transaction matching these parameters is legally recorded.
                </p>
                <div className="text-[10px] text-emerald-800/80 font-mono pt-1">
                  Verification Timestamp: {new Date(data.verifiedAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-3 justify-between items-center print:hidden">
              <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 font-medium">
                shakilglobal.com
              </Link>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
                className="text-xs border-slate-300"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print Verification Record
              </Button>
            </div>
          </div>
        </div>

        {/* Security and Anti-Fraud Notice */}
        <div className="text-center mt-6 text-[11px] text-slate-400 max-w-lg mx-auto print:hidden">
          BMET License RL-1892 • SHAKIL GLOBAL MANPOWER • For inquiries or reporting fraudulent payment requests, please email accounts@shakilglobal.com.
        </div>
      </div>
    </div>
  );
}
