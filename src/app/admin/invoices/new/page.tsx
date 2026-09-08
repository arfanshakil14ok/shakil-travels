'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Receipt,
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LineItemRow {
  id: string;
  serviceId?: string;
  serviceCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  lineTotal: number;
}

function InvoiceNewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultApplicantId = searchParams.get('applicantId') || '';
  const defaultApplicationId = searchParams.get('applicationId') || '';

  // Applicant selection
  const [applicantSearch, setApplicantSearch] = useState('');
  const [applicantResults, setApplicantResults] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);

  // Application selection
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState(defaultApplicationId);

  // Services catalog
  const [servicesCatalog, setServicesCatalog] = useState<any[]>([]);

  // Dates & Details
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState('BDT');
  const [notes, setNotes] = useState('Payment for overseas recruitment and immigration processing.');
  const [terms, setTerms] = useState('Initial installment due upon issuance. Final balance due upon visa stamping.');
  const [invoiceStatus, setInvoiceStatus] = useState<'ISSUED' | 'DRAFT'>('ISSUED');

  // Line items
  const [lineItems, setLineItems] = useState<LineItemRow[]>([
    {
      id: 'item-1',
      description: 'Overseas Recruitment & Placement Fee',
      quantity: 1,
      unitPrice: 50000,
      discount: 0,
      tax: 0,
      lineTotal: 50000,
    },
  ]);

  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [globalTax, setGlobalTax] = useState(0);
  const [adjustment, setAdjustment] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial load
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch('/api/services?isActive=true');
        const data = await res.json();
        if (data.success) {
          setServicesCatalog(data.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCatalog();
  }, []);

  // Preload applicant if query param provided
  useEffect(() => {
    if (defaultApplicantId) {
      fetch(`/api/applicants/${defaultApplicantId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setSelectedApplicant(data.data);
          }
        })
        .catch(console.error);
    }
  }, [defaultApplicantId]);

  // Load applicant applications when applicant selected
  useEffect(() => {
    if (selectedApplicant) {
      fetch(`/api/applications?applicantId=${selectedApplicant.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setApplications(data.data.items || []);
            if (data.data.items?.length > 0 && !selectedApplicationId) {
              setSelectedApplicationId(data.data.items[0].id);
            }
          }
        })
        .catch(console.error);
    } else {
      setApplications([]);
    }
  }, [selectedApplicant, selectedApplicationId]);

  const handleApplicantSearch = async (term: string) => {
    setApplicantSearch(term);
    if (term.length < 2) {
      setApplicantResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/applicants?search=${encodeURIComponent(term)}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setApplicantResults(data.data.items || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateLineItem = (index: number, field: keyof LineItemRow, value: any) => {
    setLineItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      if (field === 'serviceId') {
        const s = servicesCatalog.find((srv) => srv.id === value);
        if (s) {
          item.serviceCode = s.code;
          item.description = s.name;
          item.unitPrice = Number(s.defaultAmount);
        }
      }

      // Recalculate line total: (qty * price) - discount + tax
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const disc = Number(item.discount) || 0;
      const tax = Number(item.tax) || 0;
      item.lineTotal = Math.max(0, qty * price - disc + tax);

      next[index] = item;
      return next;
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: 'Visa & Processing Fee',
        quantity: 1,
        unitPrice: 20000,
        discount: 0,
        tax: 0,
        lineTotal: 20000,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  const totalAmount = Math.max(0, subtotal - Number(globalDiscount) + Number(globalTax) + Number(adjustment));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) {
      setError('Please select a customer or candidate to bill.');
      return;
    }
    if (lineItems.length === 0) {
      setError('Please add at least one line item.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        applicantId: selectedApplicant.id,
        applicationId: selectedApplicationId || undefined,
        issueDate,
        dueDate,
        currency,
        items: lineItems.map((item) => ({
          serviceId: item.serviceId || undefined,
          serviceCode: item.serviceCode || undefined,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount) || 0,
          tax: Number(item.tax) || 0,
        })),
        discount: Number(globalDiscount) || 0,
        tax: Number(globalTax) || 0,
        adjustment: Number(adjustment) || 0,
        status: invoiceStatus,
        notes: notes || undefined,
        terms: terms || undefined,
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/admin/invoices/${data.data.id}`);
      } else {
        setError(data.error || 'Failed to create invoice');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/invoices" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 font-medium mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-primary-600" />
            Generate New Invoice
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create an official candidate recruitment invoice with itemized services and payment terms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setInvoiceStatus('DRAFT')}
            className={`text-xs ${invoiceStatus === 'DRAFT' ? 'border-primary-600 text-primary-700 bg-primary-50' : ''}`}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={() => setInvoiceStatus('ISSUED')}
            className={`text-xs ${invoiceStatus === 'ISSUED' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Issue Officially
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bill To & Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer / Candidate Selection */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            1. Bill To (Candidate / Customer) <span className="text-rose-500">*</span>
          </h2>

          {selectedApplicant ? (
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-primary-900 text-sm block">{selectedApplicant.fullName}</span>
                <span className="text-primary-700">
                  Candidate ID: {selectedApplicant.applicantNumber} • Phone: {selectedApplicant.phone}
                </span>
                {selectedApplicant.passportNumber && (
                  <span className="block text-slate-500 mt-0.5">Passport: {selectedApplicant.passportNumber}</span>
                )}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedApplicant(null)} className="text-xs text-rose-600">
                Change
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search candidate name, phone or passport..."
                value={applicantSearch}
                onChange={(e) => handleApplicantSearch(e.target.value)}
                className="pl-9 text-xs"
              />
              {applicantResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {applicantResults.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedApplicant(c);
                        setApplicantResults([]);
                      }}
                      className="p-2.5 text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      <div className="font-semibold text-slate-800">{c.fullName}</div>
                      <div className="text-slate-500">{c.applicantNumber} • {c.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Linked Application */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Link to Recruitment Application (Optional)
            </label>
            <select
              value={selectedApplicationId}
              onChange={(e) => setSelectedApplicationId(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            >
              <option value="">No linked application (General billing)</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.applicationNumber} — {app.job?.title} ({app.currentStatus})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Invoice Dates & Terms */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            2. Invoice Schedule & Currency
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Issue Date *</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Billing Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            >
              <option value="BDT">BDT — Bangladeshi Taka</option>
              <option value="USD">USD — US Dollar</option>
              <option value="SAR">SAR — Saudi Riyal</option>
              <option value="AED">AED — UAE Dirham</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Itemized Services Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            3. Itemized Recruitment Services & Fees
          </h2>
          <Button type="button" onClick={addLineItem} size="sm" variant="outline" className="text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Service Row
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <th className="p-2.5 w-48">Service Template</th>
                <th className="p-2.5">Description</th>
                <th className="p-2.5 w-20">Qty</th>
                <th className="p-2.5 w-28">Unit Price</th>
                <th className="p-2.5 w-24">Discount</th>
                <th className="p-2.5 w-28">Line Total</th>
                <th className="p-2.5 w-12 text-center">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-2">
                    <select
                      value={item.serviceId || ''}
                      onChange={(e) => updateLineItem(idx, 'serviceId', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded p-1.5"
                    >
                      <option value="">Custom Service...</option>
                      {servicesCatalog.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                      placeholder="Service details..."
                      className="w-full text-xs bg-white border border-slate-300 rounded p-1.5"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                      className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 text-center"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(idx, 'unitPrice', Number(e.target.value))}
                      className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 text-right font-medium"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      value={item.discount}
                      onChange={(e) => updateLineItem(idx, 'discount', Number(e.target.value))}
                      className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 text-right text-amber-700"
                    />
                  </td>
                  <td className="p-2 text-right font-bold text-slate-900">
                    {currency} {item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      disabled={lineItems.length <= 1}
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation & Terms Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice Terms & Milestones</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={2}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Internal Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">{currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Discount (Global):</span>
              <input
                type="number"
                min="0"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                className="w-24 text-right border border-slate-300 rounded px-2 py-0.5 text-xs bg-white"
              />
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Tax / VAT:</span>
              <input
                type="number"
                min="0"
                value={globalTax}
                onChange={(e) => setGlobalTax(Number(e.target.value))}
                className="w-24 text-right border border-slate-300 rounded px-2 py-0.5 text-xs bg-white"
              />
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Adjustment (+/-):</span>
              <input
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(Number(e.target.value))}
                className="w-24 text-right border border-slate-300 rounded px-2 py-0.5 text-xs bg-white"
              />
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Payable Amount:</span>
              <span className="text-primary-700">
                {currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Footer */}
      <div className="flex justify-end gap-3 pt-4">
        <Link href="/admin/invoices">
          <Button type="button" variant="outline">Cancel</Button>
        </Link>
        <Button
          type="submit"
          disabled={isSubmitting || !selectedApplicant}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6"
        >
          {isSubmitting ? 'Generating Invoice...' : invoiceStatus === 'ISSUED' ? 'Issue Invoice Now' : 'Save Invoice Draft'}
        </Button>
      </div>
    </form>
  );
}

export default function InvoiceNewPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading invoice builder...</div>}>
      <InvoiceNewContent />
    </Suspense>
  );
}
