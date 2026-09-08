'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  Download,
  Filter,
  Printer,
  CheckCircle2,
  Calendar,
  User,
  Clock,
  RefreshCw,
  Eye,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
        method: methodFilter,
      });

      const res = await fetch(`/api/payments?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.data.items || []);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCount(data.data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, methodFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const viewReceipt = async (paymentId: string) => {
    setLoadingReceipt(true);
    setIsReceiptModalOpen(true);
    try {
      const res = await fetch(`/api/payments/${paymentId}/receipt`);
      const data = await res.json();
      if (data.success) {
        setSelectedReceipt(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReceipt(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-primary-600" />
            Payments & Money Receipts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit log of all financial collections, bank transfers, and issued payment receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/invoices">
            <Button variant="outline" className="border-slate-300 text-xs">
              <Receipt className="w-4 h-4 mr-1.5" />
              Manage Invoices
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search payment #, receipt #, candidate, or reference..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-slate-50 border-slate-200 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="BKASH">bKash</option>
            <option value="NAGAD">Nagad</option>
            <option value="CHEQUE">Cheque / Pay Order</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Receipt #</th>
              <th className="py-3.5 px-4">Candidate / Customer</th>
              <th className="py-3.5 px-4">Invoice Ref</th>
              <th className="py-3.5 px-4">Payment Date</th>
              <th className="py-3.5 px-4">Method & Ref</th>
              <th className="py-3.5 px-4">Received By</th>
              <th className="py-3.5 px-4 text-right">Amount Paid</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                  Loading payment transactions...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700">No payment records found</p>
                  <p className="text-slate-400 mt-1">Record a payment from an invoice to generate receipts.</p>
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-mono font-bold text-primary-700">
                    <button
                      type="button"
                      onClick={() => viewReceipt(p.id)}
                      className="hover:underline flex items-center gap-1 text-primary-700 font-bold"
                    >
                      {p.receiptNumber}
                    </button>
                    <span className="block text-[10px] text-slate-400 font-mono">{p.paymentNumber}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">
                      {p.invoice?.applicant?.fullName || 'Direct Customer'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.invoice?.applicant ? `ID: ${p.invoice.applicant.applicantNumber}` : p.customer?.name}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    <Link href={`/admin/invoices/${p.invoiceId}`} className="hover:underline hover:text-primary-600">
                      {p.invoice?.invoiceNumber}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {new Date(p.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800">{p.paymentMethod.replace(/_/g, ' ')}</span>
                    {p.referenceNumber && (
                      <span className="block text-[10px] text-slate-400 font-mono">Ref: {p.referenceNumber}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {p.receivedBy?.name || 'Staff User'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-700 text-sm">
                    {p.currency} {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewReceipt(p.id)}
                      className="h-7 text-xs px-2"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" />
                      Receipt
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing Page {page} of {totalPages} ({totalCount} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Money Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Money Receipt"
        maxWidth="lg"
      >
        {loadingReceipt || !selectedReceipt ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
            Generating official receipt voucher...
          </div>
        ) : (
          <div className="space-y-6 text-xs" id="printable-receipt">
            {/* Agency Header */}
            <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
              <div>
                <div className="font-black text-slate-950 text-base">{selectedReceipt.organization.name}</div>
                <div className="text-[11px] text-slate-500">
                  License No: {selectedReceipt.organization.license} • {selectedReceipt.organization.address}
                </div>
                <div className="text-[11px] text-slate-500">Phone: {selectedReceipt.organization.phone}</div>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-700 uppercase tracking-wider text-sm block">MONEY RECEIPT</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceipt.receiptNumber}</span>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Received With Thanks From</span>
                <span className="font-bold text-slate-900 text-sm block">
                  {selectedReceipt.applicant?.fullName || 'Direct Customer'}
                </span>
                {selectedReceipt.applicant && (
                  <span className="text-slate-600 block">
                    ID: {selectedReceipt.applicant.applicantNumber} • Pass: {selectedReceipt.applicant.passportNumber || 'N/A'}
                  </span>
                )}
              </div>
              <div className="text-right space-y-1">
                <div>
                  <span className="text-slate-400">Receipt Date:</span>{' '}
                  <strong className="text-slate-800">{new Date(selectedReceipt.paymentDate).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Payment Mode:</span>{' '}
                  <strong className="text-slate-800">{selectedReceipt.paymentMethod.replace(/_/g, ' ')}</strong>
                </div>
                {selectedReceipt.referenceNumber && (
                  <div>
                    <span className="text-slate-400">Ref / Txn #:</span>{' '}
                    <strong className="text-slate-800 font-mono">{selectedReceipt.referenceNumber}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Amount Box */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-900 uppercase">Amount Received:</span>
                <p className="text-2xl font-black text-emerald-700">
                  {selectedReceipt.currency} {Number(selectedReceipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right text-xs text-slate-600">
                <span>Against Invoice: <strong>{selectedReceipt.invoice.invoiceNumber}</strong></span>
                <span className="block text-slate-500">
                  Remaining Due on Invoice: {selectedReceipt.currency} {Number(selectedReceipt.invoice.dueAmount).toLocaleString()}
                </span>
              </div>
            </div>

            {selectedReceipt.notes && (
              <div className="text-[11px] text-slate-500">
                <strong>Notes:</strong> {selectedReceipt.notes}
              </div>
            )}

            {/* Signature Block */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-[11px] text-slate-500">
              <div>
                <div className="w-32 border-b border-slate-300 mx-auto mb-1"></div>
                <span>Candidate / Depositor</span>
              </div>
              <div>
                <div className="w-32 border-b border-slate-300 mx-auto mb-1"></div>
                <span>Authorized Officer ({selectedReceipt.receivedBy?.name || 'Accounts Staff'})</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setIsReceiptModalOpen(false)}>Close</Button>
              <Button onClick={() => window.print()} className="bg-primary-600 text-white text-xs">
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Receipt Voucher
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
