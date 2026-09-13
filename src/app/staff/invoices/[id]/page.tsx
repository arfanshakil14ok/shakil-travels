'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  DollarSign,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  PlusCircle,
  Trash2,
  Building2,
  User,
  ShieldCheck,
  Receipt as ReceiptIcon,
  Ban,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StaffInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'BANK_TRANSFER',
    bankName: '',
    transactionId: '',
    payerName: '',
    notes: '',
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/invoices/${id}`);
      const json = await res.json();
      if (json.success) {
        setInvoice(json.data);
        setPaymentData((prev) => ({
          ...prev,
          amount: Number(json.data.dueAmount || 0),
          payerName: json.data.applicant?.fullName || json.data.recipientName || '',
        }));
      } else {
        setError(json.error || 'Failed to fetch invoice');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const handleIssueInvoice = async () => {
    if (!confirm('Are you sure you want to issue this invoice?')) return;
    try {
      const res = await fetch(`/api/staff/invoices/${id}/issue`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        fetchInvoice();
      } else {
        alert(json.error || 'Failed to issue invoice');
      }
    } catch (err: any) {
      alert(err.message || 'Error');
    }
  };

  const handleVoidInvoice = async () => {
    const reason = prompt('Please enter the reason for voiding this invoice:');
    if (!reason) return;
    try {
      const res = await fetch(`/api/staff/invoices/${id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (json.success) {
        fetchInvoice();
      } else {
        alert(json.error || 'Failed to void invoice');
      }
    } catch (err: any) {
      alert(err.message || 'Error');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPayment(true);
    try {
      const res = await fetch('/api/staff/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          applicantId: invoice.applicantId,
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          bankName: paymentData.bankName || undefined,
          transactionId: paymentData.transactionId || undefined,
          payerName: paymentData.payerName || undefined,
          notes: paymentData.notes || undefined,
          autoConfirm: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowPaymentModal(false);
        fetchInvoice();
      } else {
        alert(json.error || 'Failed to record payment');
      }
    } catch (err: any) {
      alert(err.message || 'Error recording payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const formatCurrency = (amt: number | string | null | undefined) => {
    const val = Number(amt || 0);
    return `৳${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loading && !invoice) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4"></div>
        <div className="h-96 bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="p-6 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-sm">
          {error || 'Invoice not found'}
        </div>
      </div>
    );
  }

  const items = invoice.items || [];
  const payments = invoice.payments || [];
  const receipts = invoice.receipts || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/staff/invoices"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Invoices
            </Link>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-white font-mono">
              {invoice.invoiceNumber}
            </h1>
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase',
                invoice.status === 'PAID'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : invoice.status === 'PARTIALLY_PAID'
                  ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                  : invoice.status === 'OVERDUE'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-sky-950 text-sky-300 border border-sky-800'
              )}
            >
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === 'DRAFT' && (
            <button
              onClick={handleIssueInvoice}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Issue Invoice
            </button>
          )}

          {invoice.status !== 'PAID' && invoice.status !== 'VOID' && invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
            >
              <CreditCard className="w-4 h-4" />
              Record Payment
            </button>
          )}

          {invoice.status !== 'VOID' && (
            <button
              onClick={handleVoidInvoice}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 rounded-lg border border-rose-800/80"
            >
              <Ban className="w-3.5 h-3.5" />
              Void
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Invoice Details Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
        {/* Company & Client Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-800 pb-6">
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-indigo-400">
              Agency & License Info
            </div>
            <div className="text-lg font-bold text-white mt-1">SHAKIL GLOBAL RECRUITMENT</div>
            <div className="text-xs text-slate-400 mt-0.5 font-medium">
              Recruitment License: <span className="text-slate-200">RL-1892</span>
            </div>
            <div className="text-xs text-slate-400">Dhaka, Bangladesh • info@shakilglobal.com</div>
          </div>

          <div className="md:text-right">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Billed To
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {invoice.applicant?.fullName || invoice.employer?.companyName || invoice.recipientName || 'Valued Client'}
            </div>
            {invoice.applicant && (
              <div className="text-xs text-slate-400 space-y-0.5">
                <div>Tracking No: <span className="text-indigo-300 font-mono">{invoice.applicant.trackingNo}</span></div>
                {invoice.applicant.passportNumber && (
                  <div>Passport: <span className="text-slate-200 font-mono">{invoice.applicant.passportNumber}</span></div>
                )}
                {invoice.applicant.phone && <div>Phone: {invoice.applicant.phone}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Key Dates & Associated Processing Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
          <div>
            <div className="text-slate-400">Issue Date</div>
            <div className="font-semibold text-white mt-0.5">
              {new Date(invoice.issueDate || invoice.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Due Date</div>
            <div className="font-semibold text-white mt-0.5">
              {new Date(invoice.dueDate).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Job / Position</div>
            <div className="font-semibold text-white mt-0.5">
              {invoice.job?.title || 'General Manpower'}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Processing Case</div>
            <div className="font-semibold text-indigo-300 mt-0.5">
              {invoice.processingCase?.processingCode || 'N/A'}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Invoice Line Items
          </div>
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/60 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Fee Type</th>
                  <th className="px-4 py-2.5 text-right">Qty</th>
                  <th className="px-4 py-2.5 text-right">Unit Price</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map((item: any, idx: number) => (
                  <tr key={item.id || idx}>
                    <td className="px-4 py-2.5 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-white">{item.description}</td>
                    <td className="px-4 py-2.5 text-slate-400">{item.feeType}</td>
                    <td className="px-4 py-2.5 text-right text-slate-300">{item.quantity}</td>
                    <td className="px-4 py-2.5 text-right text-slate-300">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-white">
                      {formatCurrency(item.totalAmount || item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Totals Summary Box */}
        <div className="flex justify-end pt-2">
          <div className="w-full sm:w-80 space-y-2 text-xs bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="text-white font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {Number(invoice.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount / Waiver:</span>
                <span>-{formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            {Number(invoice.taxAmount || 0) > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Tax / VAT:</span>
                <span className="text-white font-medium">{formatCurrency(invoice.taxAmount)}</span>
              </div>
            )}
            <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-sm text-white">
              <span>Grand Total:</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-medium">
              <span>Total Paid:</span>
              <span>{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="border-t border-slate-700 pt-2 flex justify-between font-extrabold text-sm text-amber-300">
              <span>Balance Due:</span>
              <span>{formatCurrency(invoice.dueAmount)}</span>
            </div>
          </div>
        </div>

        {/* Payment History & Receipts */}
        {payments.length > 0 && (
          <div className="space-y-3 border-t border-slate-800 pt-6">
            <div className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Recorded Payments & Issued Receipts
            </div>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/60 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Payment #</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5">Transaction Ref</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                    <th className="px-4 py-2.5 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2.5 font-mono text-indigo-300 font-medium">
                        {p.paymentNumber}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">{p.paymentMethod}</td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono">
                        {p.transactionId || 'N/A'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-400">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {p.receipt ? (
                          <Link
                            href={`/staff/receipts/${p.receipt.id}`}
                            className="px-2 py-0.5 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/60 rounded text-[11px] font-medium inline-flex items-center gap-1"
                          >
                            <ReceiptIcon className="w-3 h-3" />
                            {p.receipt.receiptNumber}
                          </Link>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Pending Receipt</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Record Payment
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Payment Amount (Remaining Due: {formatCurrency(invoice.dueAmount)})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={Number(invoice.dueAmount)}
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (EFT / RTGS)</option>
                  <option value="CASH">Cash Deposit</option>
                  <option value="BKASH">bKash Merchant / Personal</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="CHEQUE">Cheque / Pay Order</option>
                  <option value="POS_CARD">POS Debit / Credit Card</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bank / Channel Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Islami Bank, DBBL"
                    value={paymentData.bankName}
                    onChange={(e) => setPaymentData({ ...paymentData, bankName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Txn / Deposit Ref #</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN9872615"
                    value={paymentData.transactionId}
                    onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Payer Name</label>
                <input
                  type="text"
                  value={paymentData.payerName}
                  onChange={(e) => setPaymentData({ ...paymentData, payerName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg shadow-sm"
                >
                  {submittingPayment ? 'Processing...' : 'Confirm & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
