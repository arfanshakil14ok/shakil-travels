'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Receipt,
  ArrowLeft,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Building2,
  User,
  Calendar,
  CreditCard,
} from 'lucide-react';

export default function StaffReceiptDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/staff/receipts/${id}`);
        const json = await res.json();
        if (json.success) {
          setReceipt(json.data);
        } else {
          setError(json.error || 'Failed to fetch receipt');
        }
      } catch (err: any) {
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReceipt();
  }, [id]);

  const formatCurrency = (amt: number | string | null | undefined) => {
    const val = Number(amt || 0);
    return `৳${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading && !receipt) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4"></div>
        <div className="h-96 bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="p-6 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-sm">
          {error || 'Receipt not found'}
        </div>
      </div>
    );
  }

  const applicant = receipt.applicant || {};
  const payment = receipt.payment || {};
  const invoice = receipt.invoice || {};

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-slate-100 print:p-0 print:m-0 print:bg-white print:text-black">
      {/* Top Header - Hidden when printing */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
        <div className="flex items-center gap-2">
          <Link
            href="/staff/finance"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Finance
          </Link>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Print Official Money Receipt
        </button>
      </div>

      {/* Official Money Receipt Paper Layout */}
      <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-xl space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Header / Brand */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-slate-900">
              SHAKIL GLOBAL RECRUITMENT
            </div>
            <div className="text-xs text-slate-600 font-semibold mt-0.5">
              Approved Overseas Manpower Recruiting Agency • Govt. License: <span className="text-indigo-700 font-bold">RL-1892</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Head Office: Dhaka, Bangladesh • Phone: +880-1700-000000 • Email: accounts@shakilglobal.com
            </div>
          </div>

          <div className="sm:text-right border-2 border-emerald-600 bg-emerald-50 text-emerald-900 px-4 py-2 rounded-xl">
            <div className="text-xs uppercase font-extrabold tracking-wider">OFFICIAL MONEY RECEIPT</div>
            <div className="text-sm font-mono font-bold">{receipt.receiptNumber}</div>
            <div className="text-[10px] text-emerald-700 font-medium">STATUS: {receipt.status}</div>
          </div>
        </div>

        {/* Receipt Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b border-slate-200 pb-6">
          <div>
            <div className="text-slate-500 uppercase font-semibold text-[10px]">Receipt Date</div>
            <div className="font-bold text-slate-900 mt-1">
              {new Date(receipt.receiptDate).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-slate-500 uppercase font-semibold text-[10px]">Payment Method</div>
            <div className="font-bold text-slate-900 mt-1">
              {payment.paymentMethod || 'BANK TRANSFER'}
            </div>
          </div>
          <div>
            <div className="text-slate-500 uppercase font-semibold text-[10px]">Payment Ref #</div>
            <div className="font-bold font-mono text-indigo-700 mt-1">
              {payment.paymentNumber || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-slate-500 uppercase font-semibold text-[10px]">Transaction ID</div>
            <div className="font-bold font-mono text-slate-700 mt-1">
              {payment.transactionId || 'CASH'}
            </div>
          </div>
        </div>

        {/* Received From Section */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">
            Received With Thanks From
          </div>
          <div className="text-xl font-bold text-slate-900">
            {receipt.receivedFrom || applicant.fullName || 'Candidate'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
            {applicant.trackingNo && (
              <div>Candidate Tracking No: <span className="font-mono font-bold text-slate-900">{applicant.trackingNo}</span></div>
            )}
            {applicant.passportNumber && (
              <div>Passport Number: <span className="font-mono font-bold text-slate-900">{applicant.passportNumber}</span></div>
            )}
            {applicant.phone && (
              <div>Contact Phone: <span className="font-semibold text-slate-900">{applicant.phone}</span></div>
            )}
          </div>
        </div>

        {/* Amount & Purpose Breakdown */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-sm font-bold text-emerald-900">
              Amount Received ({receipt.currency || 'BDT'}):
            </span>
            <span className="text-2xl font-extrabold text-emerald-700">
              {formatCurrency(receipt.amount)}
            </span>
          </div>

          <div className="text-xs space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-700">In Words (English): </span>
              <span className="font-medium italic text-slate-900">{receipt.amountInWords}</span>
            </div>
            {receipt.amountInWordsBn && (
              <div>
                <span className="font-bold text-slate-700">কথায় (বাংলা): </span>
                <span className="font-medium text-slate-900">{receipt.amountInWordsBn}</span>
              </div>
            )}
            {invoice.invoiceNumber && (
              <div className="pt-2 border-t border-slate-200 text-slate-600">
                <span className="font-bold">Against Invoice: </span>
                <span className="font-mono font-bold text-indigo-700">{invoice.invoiceNumber}</span>
                {invoice.totalAmount && (
                  <span className="ml-2">
                    (Grand Total: {formatCurrency(invoice.totalAmount)} • Remaining Due: {formatCurrency(invoice.dueAmount)})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Signatures & Seal */}
        <div className="grid grid-cols-2 gap-8 pt-12 border-t border-slate-300">
          <div className="text-center">
            <div className="border-t border-slate-400 w-48 mx-auto pt-1 text-xs font-semibold text-slate-700">
              Candidate / Payer Signature
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-slate-400 w-48 mx-auto pt-1 text-xs font-semibold text-slate-700">
              Authorized Accounts Officer
              <div className="text-[10px] text-slate-500 font-normal">
                Shakil Global Recruitment (RL-1892)
              </div>
            </div>
          </div>
        </div>

        {/* Security Stamp Notice */}
        <div className="text-[10px] text-slate-400 text-center border-t border-slate-200 pt-4">
          This is a computer generated official money receipt issued by Shakil Global Recruitment ERP System. Valid without manual signature when verified with verification QR code.
        </div>
      </div>
    </div>
  );
}
