'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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
  Edit,
  ExternalLink,
  Save,
  Copy,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { generateQrDataUrl, getInvoiceVerificationUrl } from '@/lib/qrcode';
import { BRAND } from '@/config/brand';
import { BrandMark } from '@/components/brand/brand-logo';

export default function InvoiceDetailPage({ params }: { params?: { id?: string } }) {
  const routeParams = useParams();
  const id = (routeParams?.id as string) || params?.id || '';
  const router = useRouter();
  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

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

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDueDate, setEditDueDate] = useState('');
  const [editTerms, setEditTerms] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      if (data.success) {
        setInvoice(data.data);
        setPaymentAmount(data.data.dueAmount.toString());
        if (data.data.dueDate) {
          setEditDueDate(new Date(data.data.dueDate).toISOString().split('T')[0]);
        }
        setEditTerms(data.data.terms || '');
        setEditNotes(data.data.notes || '');

        // Generate QR code encoding canonical public verification URL
        const verifyUrl = getInvoiceVerificationUrl(data.data.invoiceNumber);
        generateQrDataUrl(verifyUrl, { width: 300, margin: 1 })
          .then(setQrCodeUrl)
          .catch((err) => console.error('QR code generation error:', err));
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

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjAmount || !adjReason) return;
    setIsAdjusting(true);

    try {
      const res = await fetch(`/api/invoices/${id}/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: adjType,
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
      } else {
        alert(data.error || 'Adjustment failed');
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
      } else {
        alert(data.error || 'Failed to void invoice');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVoiding(false);
    }
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEdit(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueDate: editDueDate ? new Date(editDueDate).toISOString() : undefined,
          terms: editTerms,
          notes: editNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditModalOpen(false);
        fetchInvoice();
      } else {
        setEditError(data.error || 'Failed to update invoice');
      }
    } catch (err: any) {
      setEditError(err.message || 'Error updating invoice');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);

  const handleDuplicateInvoice = async () => {
    if (!confirm('Duplicate this invoice? A new draft invoice will be created with identical line items.')) return;
    setIsDuplicating(true);
    try {
      const res = await fetch(`/api/invoices/${id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        router.push(`/admin/invoices/${data.data.id}`);
      } else {
        alert(data.error || 'Failed to duplicate invoice');
      }
    } catch {
      alert('Error duplicating invoice');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (invoice.status === 'PAID' || invoice.status === 'PARTIALLY_PAID') {
      alert('পরিশোধিত ইনভয়েস মুছে ফেলা যাবে না / Paid invoices cannot be deleted. Please void the invoice instead.');
      return;
    }
    if (invoice.status !== 'DRAFT') {
      alert('শুধুমাত্র ড্রাফট ইনভয়েস মুছে ফেলা যাবে / Only draft invoices can be deleted. Please void issued invoices.');
      return;
    }
    if (!confirm(`Are you sure you want to delete draft invoice ${invoice.invoiceNumber}?`)) return;
    setIsDeletingInvoice(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/invoices');
      } else {
        alert(data.error || 'Failed to delete invoice');
      }
    } catch {
      alert('Failed to delete invoice');
    } finally {
      setIsDeletingInvoice(false);
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

  const verificationUrl = getInvoiceVerificationUrl(invoice.invoiceNumber);

  return (
    <div className="space-y-6 pb-20">
      {/* Action Bar (Hidden during Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link
          href="/admin/invoices"
          className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="text-xs border-slate-300 shadow-sm font-semibold hover:bg-slate-50"
          >
            <Printer className="w-4 h-4 mr-1.5 text-primary-600" />
            Print Invoice (A4)
          </Button>

          {invoice.status !== 'VOID' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs border-slate-300 text-slate-700"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Edit Details
            </Button>
          )}

          {invoice.status !== 'VOID' && Number(invoice.dueAmount) > 0 && (
            <Button
              onClick={() => {
                setPaymentAmount(invoice.dueAmount.toString());
                setIsPaymentModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
            >
              <CreditCard className="w-4 h-4 mr-1.5" />
              Record Payment
            </Button>
          )}

          {invoice.status !== 'VOID' && Number(invoice.paidAmount) > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsRefundModalOpen(true)}
              className="text-xs border-slate-300 text-amber-800 hover:bg-amber-50"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Process Refund
            </Button>
          )}

          {invoice.status !== 'VOID' && (
            <Button
              variant="outline"
              onClick={() => setIsAdjModalOpen(true)}
              className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
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

          <Button
            type="button"
            variant="outline"
            onClick={handleDuplicateInvoice}
            disabled={isDuplicating}
            className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            {isDuplicating ? 'Duplicating...' : 'Duplicate'}
          </Button>

          {invoice.status === 'DRAFT' && Number(invoice.paidAmount) === 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDeleteInvoice}
              disabled={isDeletingInvoice}
              className="text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
              Delete Draft
            </Button>
          )}
        </div>
      </div>

      {/* Printable Invoice Container (Optimized for A4) */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none text-slate-900">
        {/* Invoice Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900/10 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <BrandMark size="md" />
              <div>
                <div className="text-2xl font-black tracking-tight text-slate-950">
                  {BRAND.name}
                </div>
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  {BRAND.taglineEn}
                </div>
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-2 uppercase tracking-wider">
              Government Approved Recruiting Agency • License No: {BRAND.licenseNumber}
            </div>
            <div className="text-xs text-slate-600 mt-1 leading-relaxed font-bengali">
              {BRAND.addressBn}<br />
              <span className="font-sans">Phone: {BRAND.phone} • Email: {BRAND.accountsEmail} • Web: {BRAND.website}</span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900">INVOICE</h1>
            <div className="font-mono font-bold text-slate-950 text-base mt-1">
              {invoice.invoiceNumber}
            </div>
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

        {/* Bill To & Invoice Info */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Billed To
            </span>
            <div className="font-bold text-slate-950 text-sm">
              {invoice.applicant?.fullName || invoice.customer?.name || 'Direct Client'}
            </div>
            <div className="text-slate-600 mt-1 space-y-0.5">
              {invoice.applicant ? (
                <>
                  <div>Applicant ID: <span className="font-mono font-medium">{invoice.applicant.applicantNumber}</span></div>
                  <div>Phone: {invoice.applicant.phone}</div>
                  {invoice.applicant.passportNumber && (
                    <div>Passport Ref: <span className="font-mono">{invoice.applicant.passportNumber}</span></div>
                  )}
                  {invoice.applicant.address && <div>Address: {invoice.applicant.address}</div>}
                </>
              ) : (
                <div>Customer: {invoice.customer?.name}</div>
              )}
            </div>
          </div>

          <div className="text-right space-y-1.5 text-slate-600">
            <div>
              <span className="font-medium text-slate-400">Issue Date:</span>{' '}
              <strong className="text-slate-900">{new Date(invoice.invoiceDate || invoice.issueDate || invoice.createdAt).toLocaleDateString()}</strong>
            </div>
            <div>
              <span className="font-medium text-slate-400">Payment Due:</span>{' '}
              <strong className="text-slate-900">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon receipt'}</strong>
            </div>
            <div>
              <span className="font-medium text-slate-400">Billing Currency:</span>{' '}
              <strong className="text-slate-900">{invoice.currency || 'BDT'} (৳)</strong>
            </div>
            {invoice.application?.job && (
              <div className="pt-2 text-[11px] text-slate-700">
                Target Demand: <strong>{invoice.application.job.title}</strong>
                {invoice.application.job.country?.name && (
                  <span> ({invoice.application.job.country.name})</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900/20 font-bold text-slate-800 uppercase tracking-wider">
                <th className="py-3 px-1 w-8">#</th>
                <th className="py-3 px-2">Service Description</th>
                <th className="py-3 px-2 text-center w-16">Qty</th>
                <th className="py-3 px-2 text-right w-28">Unit Price</th>
                <th className="py-3 px-2 text-right w-24">Discount</th>
                <th className="py-3 px-2 text-right w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item: any, idx: number) => (
                <tr key={item.id} className="text-slate-800">
                  <td className="py-3 px-1 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 px-2 font-semibold text-slate-900">
                    {item.description}
                    {item.serviceCode && (
                      <span className="block text-[10px] text-slate-400 font-mono font-normal">
                        [{item.serviceCode}]
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center font-medium">{item.quantity}</td>
                  <td className="py-3 px-2 text-right">
                    {invoice.currency} {Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-2 text-right text-slate-500">
                    {Number(item.discount) > 0
                      ? `-${invoice.currency} ${Number(item.discount).toFixed(2)}`
                      : '—'}
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-slate-950">
                    {invoice.currency} {Number(item.lineTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary & Scannable QR Code */}
        <div className="border-t-2 border-slate-900/10 pt-6 flex flex-col sm:flex-row justify-between gap-6 text-xs">
          {/* Left Column: QR Code & Verification Advisory */}
          <div className="w-full sm:w-80 space-y-4">
            {/* Scannable QR Code */}
            {qrCodeUrl && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3.5">
                <img
                  src={qrCodeUrl}
                  alt={`QR Verification for ${invoice.invoiceNumber}`}
                  className="w-20 h-20 rounded-lg border border-white shadow-xs flex-shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-900 uppercase">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official Verified QR</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-tight">
                    Scan with any smartphone to confirm central database legitimacy.
                  </p>
                  <a
                    href={verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary-700 font-mono font-bold hover:underline inline-flex items-center gap-1 print:hidden"
                  >
                    Open Verification Page <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            )}

            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Payment Terms
              </span>
              <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] leading-relaxed">
                {invoice.terms || 'Payment due upon issuance. Official receipts issued against payments.'}
              </p>
            </div>

            {invoice.notes && (
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Invoice Notes
                </span>
                <p className="text-slate-500 text-[11px] whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column: Financial Totals */}
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">
                {invoice.currency} {Number(invoice.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Special Discount:</span>
                <span>
                  -{invoice.currency} {Number(invoice.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {Number(invoice.tax) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax / Duty:</span>
                <span>
                  +{invoice.currency} {Number(invoice.tax).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold text-slate-950 pt-2 border-t border-slate-200">
              <span>Total Payable:</span>
              <span>
                {invoice.currency} {Number(invoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between font-bold text-emerald-700">
              <span>Paid to Date:</span>
              <span>
                {invoice.currency} {Number(invoice.paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-base font-black text-rose-600 pt-2 border-t-2 border-slate-900/20">
              <span>Due Balance:</span>
              <span>
                {invoice.currency} {Number(invoice.dueAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Payments History Log */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Recorded Payment Receipts Log
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
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
                      <td className="p-2 text-slate-600">{p.receivedBy?.name || 'Accounts Officer'}</td>
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

        {/* Dual Signatures & Legal Verification Stamp */}
        <div className="mt-14 pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-600">
          <div>
            <div className="w-44 border-b border-slate-400 mx-auto mb-1"></div>
            <span className="font-medium">Customer / Candidate Signature</span>
          </div>
          <div>
            <div className="w-44 border-b border-slate-400 mx-auto mb-1"></div>
            <span className="font-medium">Authorized Accounts Officer</span>
            <div className="text-[10px] text-slate-400 mt-0.5">{BRAND.name} • {BRAND.licenseNumber}</div>
          </div>
        </div>

        {/* Legal Disclaimer Footer */}
        <div className="mt-10 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 leading-tight">
          This is a computer-generated invoice and is legally valid without physical signature if verified via official QR Code.<br />
          Government Approved Recruiting Agency {BRAND.licenseNumber} • Bureau of Manpower, Employment and Training (BMET) Approved.
        </div>
      </div>

      {/* Edit Invoice Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Invoice Details"
        description={`Updating schedule and notes for ${invoice.invoiceNumber}`}
        maxWidth="md"
      >
        <form onSubmit={handleUpdateInvoice} className="space-y-4">
          {editError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
              {editError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Due Date</label>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Terms</label>
            <input
              type="text"
              value={editTerms}
              onChange={(e) => setEditTerms(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Internal Notes</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingEdit} className="bg-primary-600 text-white text-xs">
              {isSavingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

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
              Refund Amount ({invoice.currency}) * (Max {invoice.currency} {Number(invoice.paidAmount).toLocaleString()})
            </label>
            <input
              type="number"
              step="any"
              min="1"
              max={Number(invoice.paidAmount)}
              required
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-full text-base font-bold text-amber-800 bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Refund Method *</label>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 font-medium"
            >
              <option value="BANK_TRANSFER">Bank Reversal</option>
              <option value="CASH">Direct Cash Refund</option>
              <option value="BKASH">bKash</option>
              <option value="CHEQUE">Payee Account Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Official Justification *</label>
            <textarea
              required
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. Visa rejection fee waiver per contract policy..."
              rows={3}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsRefundModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isRefunding} className="bg-amber-700 text-white text-xs">
              {isRefunding ? 'Processing...' : 'Issue Refund'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjustment Modal */}
      <Modal
        isOpen={isAdjModalOpen}
        onClose={() => setIsAdjModalOpen(false)}
        title="Adjust Invoice Balance"
        description="Apply billing adjustments, waivers or penalties."
        maxWidth="md"
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4">
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
