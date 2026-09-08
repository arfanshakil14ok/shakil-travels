'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Search,
  Filter,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  UserPlus,
  RefreshCw,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  CONTACTED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  CONVERTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  CLOSED: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
};

export default function InquiriesPage() {
  const { success, error } = useToast();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Inquiry for details modal
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
      });
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`/api/inquiries?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInquiries(data.data.items);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCount(data.data.pagination.total);
      } else {
        error(data.error || 'Failed to load inquiries');
      }
    } catch (err) {
      error('Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, error]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleOpenDetail = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setEditNotes(inquiry.internalNotes || '');
    setNewStatus(inquiry.status);
    setIsDetailModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedInquiry) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/inquiries/${selectedInquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          internalNotes: editNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        success('Inquiry updated successfully');
        setSelectedInquiry(data.data);
        fetchInquiries();
      } else {
        error(data.error || 'Failed to update inquiry');
      }
    } catch (err) {
      error('Error updating inquiry');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleConvertToApplicant = async () => {
    if (!selectedInquiry) return;
    setIsConverting(true);
    try {
      const res = await fetch(`/api/inquiries/${selectedInquiry.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editNotes }),
      });
      const data = await res.json();
      if (data.success) {
        success(data.message || 'Converted to candidate successfully');
        setIsDetailModalOpen(false);
        fetchInquiries();
      } else {
        error(data.error || 'Failed to convert inquiry');
      }
    } catch (err) {
      error('Error converting inquiry');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-primary" />
            Website Inquiries & Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review inbound inquiries, track lead communications, and convert prospects directly into registered candidates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchInquiries} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email, or inquiry #..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            className="text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CONVERTED">Converted</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Inquiry Ref</th>
                <th className="px-6 py-4">Lead Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Subject & Message</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && inquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading leads...
                  </td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No inquiries found matching your filters.
                  </td>
                </tr>
              ) : (
                inquiries.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-xs text-primary">
                      {item.inquiryNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Tag className="w-3 h-3" />
                        {item.source}
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-foreground">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        {item.phone}
                      </div>
                      {item.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {item.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-medium text-foreground truncate">{item.subject}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {item.message}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          STATUS_COLORS[item.status] || 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.convertedApplicant && (
                        <div className="mt-1">
                          <Link
                            href={`/admin/applicants/${item.convertedApplicant.id}`}
                            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline font-mono"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {item.convertedApplicant.applicantNumber}
                          </Link>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetail(item)}
                      >
                        View & Act
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing page {page} of {totalPages} ({totalCount} total inquiries)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Inquiry Detail & Conversion Modal */}
      {selectedInquiry && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Lead Details: ${selectedInquiry.inquiryNumber}`}
          className="max-w-2xl"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-lg border border-border text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Full Name</span>
                <span className="font-semibold text-foreground">{selectedInquiry.name}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Inquiry Date</span>
                <span className="text-foreground">
                  {new Date(selectedInquiry.createdAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Phone</span>
                <span className="text-foreground">{selectedInquiry.phone}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Email</span>
                <span className="text-foreground">{selectedInquiry.email || 'Not provided'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground block">Subject</span>
                <span className="font-medium text-foreground">{selectedInquiry.subject}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground block">Inquiry Message</span>
                <p className="text-foreground text-xs mt-1 bg-background p-3 rounded border border-border whitespace-pre-wrap">
                  {selectedInquiry.message}
                </p>
              </div>
            </div>

            {/* Status & Conversion Status */}
            {selectedInquiry.convertedApplicant ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>
                    Converted to Candidate:{' '}
                    <strong>{selectedInquiry.convertedApplicant.fullName}</strong> (
                    {selectedInquiry.convertedApplicant.applicantNumber})
                  </span>
                </div>
                <Link
                  href={`/admin/applicants/${selectedInquiry.convertedApplicant.id}`}
                  className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  View Profile <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-primary" />
                    Convert Lead into Registered Candidate
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generates sequential SGR ID, establishes customer ledger, and enables job applications.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleConvertToApplicant}
                  disabled={isConverting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                >
                  {isConverting ? 'Converting...' : 'Convert to Candidate'}
                </Button>
              </div>
            )}

            {/* Status & Staff Notes */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Workflow Status
                  </label>
                  <select
                    className="w-full text-sm bg-background border border-border rounded-lg p-2"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Internal Notes & Communication History
                </label>
                <textarea
                  rows={4}
                  className="w-full text-sm bg-background border border-border rounded-lg p-3 text-foreground"
                  placeholder="Record call attempts, candidate interest, requirements, or follow-up notes..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={statusUpdating}
                >
                  {statusUpdating ? 'Saving...' : 'Save Notes & Status'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
