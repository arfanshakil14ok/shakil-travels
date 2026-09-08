'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Wallet,
  Search,
  Printer,
  ArrowLeft,
  DollarSign,
  Calendar,
  User,
  Clock,
  RefreshCw,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

function CustomerLedgerContent() {
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';
  const initialApplicantId = searchParams.get('applicantId') || '';

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);

  const [ledgerData, setLedgerData] = useState<any | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Preload applicant if query param
  useEffect(() => {
    if (initialApplicantId) {
      fetch(`/api/applicants/${initialApplicantId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setSelectedApplicant(data.data);
          }
        })
        .catch(console.error);
    }
  }, [initialApplicantId]);

  // Fetch recent system-wide transactions when no customer selected
  const fetchGlobalLedger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounts/ledger');
      const data = await res.json();
      if (data.success) {
        setRecentTransactions(data.data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomerLedger = useCallback(async (applicantId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/ledger?applicantId=${applicantId}`);
      const data = await res.json();
      if (data.success) {
        setLedgerData(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedApplicant) {
      fetchCustomerLedger(selectedApplicant.id);
    } else {
      fetchGlobalLedger();
    }
  }, [selectedApplicant, fetchCustomerLedger, fetchGlobalLedger]);

  const handleSearchCandidates = async (term: string) => {
    setCustomerSearch(term);
    if (term.length < 2) {
      setCustomerResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/applicants?search=${encodeURIComponent(term)}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setCustomerResults(data.data.items || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <Link href="/admin/accounts" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 font-medium mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Accounts Overview
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary-600" />
            Customer Statement of Account & Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Chronological audit trail of customer billings, payments, and running balance statements.
          </p>
        </div>

        {selectedApplicant && (
          <Button onClick={() => window.print()} variant="outline" className="border-slate-300 text-xs">
            <Printer className="w-4 h-4 mr-1.5" />
            Print Official Statement
          </Button>
        )}
      </div>

      {/* Customer Selector Search (Hidden when printing) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Select Candidate / Customer Account
        </label>

        {selectedApplicant ? (
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center font-bold text-primary-900 text-sm">
                {selectedApplicant.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="font-bold text-primary-900 text-base block">{selectedApplicant.fullName}</span>
                <span className="text-xs text-primary-700">
                  Candidate ID: {selectedApplicant.applicantNumber} • Phone: {selectedApplicant.phone} • Passport: {selectedApplicant.passportNumber || 'N/A'}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedApplicant(null);
                setLedgerData(null);
              }}
              className="text-xs text-slate-600 bg-white"
            >
              Select Another Candidate
            </Button>
          </div>
        ) : (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search candidate name, phone or passport number to view ledger statement..."
              value={customerSearch}
              onChange={(e) => handleSearchCandidates(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-xs"
            />
            {customerResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                {customerResults.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedApplicant(c);
                      setCustomerResults([]);
                      setCustomerSearch('');
                    }}
                    className="p-3 text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="font-semibold text-slate-800">{c.fullName}</div>
                    <div className="text-slate-500 font-mono text-[10px]">
                      {c.applicantNumber} • {c.phone} {c.passportNumber ? `• Pass: ${c.passportNumber}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Statement View */}
      {selectedApplicant && ledgerData ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md space-y-6 print:shadow-none print:border-none print:p-0">
          {/* Statement Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="text-xl font-black text-slate-950">SHAKIL GLOBAL RECRUITMENT</div>
              <div className="text-xs text-slate-500 font-medium">
                License No: RL-1892 • Concord Tower, Gulshan-2, Dhaka
              </div>
              <div className="text-xs text-slate-500 mt-1">STATEMENT OF ACCOUNT (FINANCIAL LEDGER)</div>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold uppercase text-slate-400 block">Statement Date</span>
              <strong className="text-slate-900 text-sm">{new Date().toLocaleDateString()}</strong>
            </div>
          </div>

          {/* Account Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Debits (Billed)</span>
              <p className="text-xl font-bold text-slate-900 mt-1">BDT {Number(ledgerData.totalDebit).toLocaleString()}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-800 uppercase">Total Credits (Paid)</span>
              <p className="text-xl font-bold text-emerald-700 mt-1">BDT {Number(ledgerData.totalCredit).toLocaleString()}</p>
            </div>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
              <span className="text-xs font-semibold text-rose-800 uppercase">Closing Balance Due</span>
              <p className="text-xl font-black text-rose-700 mt-1">BDT {Number(ledgerData.closingBalance).toLocaleString()}</p>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                  <th className="p-3">Date</th>
                  <th className="p-3">Reference #</th>
                  <th className="p-3">Transaction Type</th>
                  <th className="p-3">Description / Remarks</th>
                  <th className="p-3 text-right">Debit (Charges)</th>
                  <th className="p-3 text-right">Credit (Payments)</th>
                  <th className="p-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerData.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No financial ledger transactions recorded for this customer yet.
                    </td>
                  </tr>
                ) : (
                  ledgerData.transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-600 font-mono">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-mono font-bold text-primary-700">{tx.referenceNumber}</td>
                      <td className="p-3">
                        <Badge variant={tx.transactionType === 'PAYMENT' ? 'success' : tx.transactionType === 'INVOICE' ? 'navy' : 'warning'}>
                          {tx.transactionType}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{tx.notes || '—'}</td>
                      <td className="p-3 text-right font-semibold text-slate-900">
                        {Number(tx.debit) > 0 ? `BDT ${Number(tx.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="p-3 text-right font-semibold text-emerald-700">
                        {Number(tx.credit) > 0 ? `BDT ${Number(tx.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-slate-900">
                        BDT {Number(tx.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Global Recent Ledger Entries View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent System-Wide Ledger Postings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a specific candidate above to generate an individual running statement.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <th className="p-3">Date</th>
                  <th className="p-3">Candidate / Account</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Reference #</th>
                  <th className="p-3">Remarks</th>
                  <th className="p-3 text-right">Debit</th>
                  <th className="p-3 text-right">Credit</th>
                  <th className="p-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-primary-600" />
                      Loading ledger entries...
                    </td>
                  </tr>
                ) : recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No financial transactions posted yet.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-600 font-mono">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {tx.customer?.applicant?.fullName || tx.customer?.name || 'Account'}
                      </td>
                      <td className="p-3">
                        <Badge variant={tx.transactionType === 'PAYMENT' ? 'success' : tx.transactionType === 'INVOICE' ? 'navy' : 'warning'}>
                          {tx.transactionType}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono font-bold text-primary-700">{tx.referenceNumber}</td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{tx.notes}</td>
                      <td className="p-3 text-right font-semibold text-slate-900">
                        {Number(tx.debit) > 0 ? `BDT ${Number(tx.debit).toLocaleString()}` : '—'}
                      </td>
                      <td className="p-3 text-right font-semibold text-emerald-700">
                        {Number(tx.credit) > 0 ? `BDT ${Number(tx.credit).toLocaleString()}` : '—'}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        BDT {Number(tx.balance).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerLedgerPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading ledger...</div>}>
      <CustomerLedgerContent />
    </Suspense>
  );
}
