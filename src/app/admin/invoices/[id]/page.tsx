'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  ArrowLeft,
  Printer,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Ban,
  FileText,
  Building2,
  Calendar,
  User,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Refund Modal
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('BANK_TRANSFER');
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  // Adjustment Modal
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjType, setAdjType] = useState('DISCOUNT');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Void Modal
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      if (data.success) {
        setInvoice(data.data);
        setPaymentAmount(data.data.dueAmount.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    setIsRecordingPayment(true);
    setPaymentError(null);

    try {
      const res = await fetch(`/api/invoices/${id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          currency: invoice.currency,
          paymentMethod,
          referenceNumber: paymentRef || undefined,
          notes: paymentNotes || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsPaymentModalOpen(false);
        setPaymentRef('');
        setPaymentNotes('');
        fetchInvoice();
      } else {
        setPaymentError(data.error || 'Failed to record payment');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment recording failed');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundAmount || !refundReason) return;
    setIsRefunding(true);
    setRefundError(null);

    try {
      const res = await fetch(`/api/invoices/${id}/refunds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(refundAmount),
          currency: invoice.currency,
          reason: refundReason,
          refundMethod,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsRefundModalOpen(false);
        setRefundAmount('');
        setRefundReason('');
        fetchInvoice();
      } else {
        setRefundError(data.error || 'Failed to process refund');
      }
    } catch (err: any) {
      setRefundError(err.message || 'Error processing refund');
    } finally {
      setIsRefunding(false);
    }
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjAmount || !adjReason) return;
    setIsAdjusting(true);

    try {
      const res = await fetch(`/api/invoices/${id}/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustmentType: adjType,
          amount: Number(adjAmount),
          reason: adjReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAdjModalOpen(false);
        setAdjAmount('');
        setAdjReason('');
        fetchInvoice();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleVoidInvoice = async () => {
    setIsVoiding(true);
    try {
      const res = await fetch(`/api/invoices/${id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voidReason }),
      });
      const data = await res.json();
      if (data.success) {
        setIsVoidModalOpen(false);
        fetchInvoice();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVoiding(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-600" />
        Loading invoice statement...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="py-24 text-center text-slate-600">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-500" />
        <h2 className="text-xl font-bold">Invoice Not Found</h2>
        <Link href="/admin/invoices" className="text-primary-600 text-sm mt-2 inline-block">
          Return to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Action Bar (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link href="/admin/invoices" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="text-xs border-slate-300"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print / Download PDF
          </Button>

          {invoice.status !== 'VOID' && Number(invoice.dueAmount) > 0 && (
            <Button
              onClick={() => {
                setPaymentAmount(invoice.dueAmount.toString());
                setIsPaymentModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <CreditCard className="w-4 h-4 mr-1.5" />
              Record Payment
            </Button>
          )}

          {invoice.status !== 'VOID' && Number(invoice.paidAmount) > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsRefundModalOpen(true)}
              className="text-xs border-slate-300 text-amber-800"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Process Refund
            </Button>
          )}

          {invoice.status !== 'VOID' && (
            <Button
              variant="outline"
              onClick={() => setIsAdjModalOpen(true)}
              className="text-xs border-slate-300 text-slate-700"
            >
              Adjust Amount
            </Button>
          )}

          {invoice.status !== 'VOID' && (
            <Button
              variant="outline"
              onClick={() => setIsVoidModalOpen(true)}
              className="text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <Ban className="w-4 h-4 mr-1.5" />
              Void
            </Button>
          )}
        </div>
      </div>

      {/* Printable Invoice Card */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md max-w-4xl mx-auto print:shadow-none print:border-none print:p-0">
        {/* Invoice Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="text-xl font-black tracking-tight text-slate-950">
              SHAKIL GLOBAL RECRUITMENT
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Government Approved Recruiting Agency • License No: RL-1892
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Concord Tower, Level 7, Gulshan-2, Dhaka-1212, Bangladesh
            </div>
            <div className="text-xs text-slate-500">
              Phone: +880 2-9876543 • Email: accounts@shakilglobal.com
            </div>
          </div>

          <div className="text-left sm:text-right">
            <h1 className="text-2xl font-black uppercase tracking-wider text-primary-700">INVOICE</h1>
            <div className="font-mono font-bold text-slate-800 text-sm mt-1">{invoice.invoiceNumber}</div>
            <div className="mt-2">
              <Badge
                variant={
                  invoice.status === 'PAID'
                    ? 'success'
                    : invoice.status === 'PARTIALLY_PAID'
                    ? 'gold'
                    : invoice.status === 'VOID'
                    ? 'error'
                    : 'info'
                }
              >
                {invoice.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Bill To & Details */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-100 text-xs">
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed To</span>
            <div className="font-bold text-slate-900 text-sm">{invoice.applicant?.fullName || 'Direct Customer'}</div>
            <div className="text-slate-600 mt-1">
              {invoice.applicant ? (
                <>
                  <div>Applicant ID: {invoice.applicant.applicantNumber}</div>
                  <div>Passport: {invoice.applicant.passportNumber || 'N/A'}</div>
                  <div>Phone: {invoice.applicant.phone}</div>
                  {invoice.applicant.address && <div>Address: {invoice.applicant.address}</div>}
                </>
              ) : (
                <div>Customer: {invoice.customer?.name}</div>
              )}
            </div>
          </div>

          <div className="text-right space-y-1 text-slate-600">
            <div>
              <span className="font-medium text-slate-400">Issue Date:</span>{' '}
              <strong className="text-slate-800">{new Date(invoice.issueDate).toLocaleDateString()}</strong>
            </div>
            <div>
              <span className="font-medium text-slate-400">Payment Due:</span>{' '}
              <strong className="text-slate-800">{new Date(invoice.dueDate).toLocaleDateString()}</strong>
            </div>
            <div>
              <span className="font-medium text-slate-400">Currency:</span>{' '}
              <strong className="text-slate-800">{invoice.currency}</strong>
            </div>
            {invoice.application && (
              <div className="pt-2 text-[11px] text-slate-500">
                Job Demand: <strong>{invoice.application.job.title}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 font-bold text-slate-700 uppercase">
                <th className="py-2.5">#</th>
                <th className="py-2.5">Service Description</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Unit Price</th>
                <th className="py-2.5 text-right">Discount</th>
                <th className="py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item: any, idx: number) => (
                <tr key={item.id} className="text-slate-800">
                  <td className="py-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 font-semibold">
                    {item.description}
                    {item.serviceCode && <span className="block text-[10px] text-slate-400 font-mono">[{item.serviceCode}]</span>}
                  </td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">
                    {invoice.currency} {Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right text-slate-500">
                    {Number(item.discount) > 0 ? `-${invoice.currency} ${Number(item.discount).toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    {invoice.currency} {Number(item.lineTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary */}
        <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between gap-6 text-xs">
          <div className="max-w-xs space-y-2">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Payment Terms</span>
              <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 text-[11px]">
                {invoice.terms || 'Payment due upon issuance.'}
              </p>
            </div>
            {invoice.notes && (
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Notes</span>
                <p className="text-slate-500 text-[11px] whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">{invoice.currency} {Number(invoice.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Discount:</span>
                <span>-{invoice.currency} {Number(invoice.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {Number(invoice.tax) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax:</span>
                <span>+{invoice.currency} {Number(invoice.tax).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Payable:</span>
              <span>{invoice.currency} {Number(invoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-700">
              <span>Paid to Date:</span>
              <span>{invoice.currency} {Number(invoice.paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-base font-black text-rose-600 pt-2 border-t border-slate-200">
              <span>Due Balance:</span>
              <span>{invoice.currency} {Number(invoice.dueAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Payments History Table */}
        {invoice.payments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Payment Receipts Log
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="p-2">Receipt #</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Method</th>
                    <th className="p-2">Reference</th>
                    <th className="p-2">Received By</th>
                    <th className="p-2 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="p-2 font-mono font-bold text-primary-700">{p.receiptNumber}</td>
                      <td className="p-2">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="p-2 font-medium">{p.paymentMethod.replace(/_/g, ' ')}</td>
                      <td className="p-2 text-slate-500">{p.referenceNumber || '—'}</td>
                      <td className="p-2 text-slate-600">{p.receivedBy?.name || 'Accounts Staff'}</td>
                      <td className="p-2 text-right font-bold text-emerald-700">
                        {p.currency} {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-16 pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-500">
          <div>
            <div className="w-40 border-b border-slate-300 mx-auto mb-1"></div>
            <span>Customer / Candidate Signature</span>
          </div>
          <div>
            <div className="w-40 border-b border-slate-300 mx-auto mb-1"></div>
            <span>Authorized Accounts Officer</span>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Invoice Payment"
        description={`Posting payment for ${invoice.invoiceNumber} (Due: ${invoice.currency} ${Number(invoice.dueAmount).toLocaleString()})`}
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {paymentError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
              {paymentError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Payment Amount ({invoice.currency}) *
            </label>
            <input
              type="number"
              step="any"
              min="1"
              max={Number(invoice.dueAmount)}
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full text-base font-bold text-emerald-700 bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 font-medium"
            >
              <option value="BANK_TRANSFER">Bank Transfer (IBBL, City, Dutch-Bangla)</option>
              <option value="CASH">Direct Cash Payment</option>
              <option value="BKASH">bKash Merchant</option>
              <option value="NAGAD">Nagad</option>
              <option value="CHEQUE">Bank Cheque / Pay Order</option>
              <option value="ONLINE_PAYMENT">Online Gateway</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Bank / Gateway Reference Number
            </label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. TXN-892104 or Cheque # 10492"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Receipt Notes</label>
            <textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Optional notes for receipt voucher..."
              rows={2}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isRecordingPayment} className="bg-emerald-600 text-white text-xs">
              {isRecordingPayment ? 'Processing...' : 'Confirm & Issue Receipt'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Process Refund Modal */}
      <Modal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        title="Process Financial Refund"
        maxWidth="md"
      >
        <form onSubmit={handleProcessRefund} className="space-y-4">
          {refundError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
              {refundError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Refund Amount ({invoice.currency}) *
            </label>
            <input
              type="number"
              step="any"
              min="1"
              max={Number(invoice.paidAmount)}
              required
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder={`Max refundable: ${invoice.paidAmount}`}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reason for Refund *</label>
            <textarea
              required
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. Candidate medical unfitness or employer quota cancellation..."
              rows={3}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsRefundModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isRefunding} className="bg-amber-700 text-white text-xs">
              {isRefunding ? 'Refunding...' : 'Confirm Refund'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Financial Adjustment Modal */}
      <Modal
        isOpen={isAdjModalOpen}
        onClose={() => setIsAdjModalOpen(false)}
        title="Apply Financial Adjustment"
        maxWidth="md"
      >
        <form onSubmit={handleApplyAdjustment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Adjustment Type *</label>
            <select
              value={adjType}
              onChange={(e) => setAdjType(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            >
              <option value="DISCOUNT">Special Discount (Reduces Due)</option>
              <option value="WAIVER">Fee Waiver (Reduces Due)</option>
              <option value="SURCHARGE">Processing Surcharge (Increases Due)</option>
              <option value="PENALTY">Late Penalty (Increases Due)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount ({invoice.currency}) *</label>
            <input
              type="number"
              step="any"
              min="1"
              required
              value={adjAmount}
              onChange={(e) => setAdjAmount(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Audit Justification *</label>
            <textarea
              required
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              placeholder="Reason for financial change..."
              rows={3}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAdjModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isAdjusting} className="bg-primary-600 text-white text-xs">
              {isAdjusting ? 'Saving...' : 'Apply Adjustment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Void Modal */}
      <Modal
        isOpen={isVoidModalOpen}
        onClose={() => setIsVoidModalOpen(false)}
        title="Void Official Invoice"
        description={`Are you sure you want to void ${invoice.invoiceNumber}? This reverses outstanding due balances.`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Void Reason</label>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Duplicate invoice issued in error..."
              rows={3}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsVoidModalOpen(false)}>Cancel</Button>
            <Button onClick={handleVoidInvoice} disabled={isVoiding} className="bg-rose-600 text-white text-xs">
              {isVoiding ? 'Voiding...' : 'Confirm Void Invoice'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
