'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Send,
  Mail,
  MessageSquare,
  Smartphone,
  Bell,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

const CHANNEL_ICONS: Record<string, any> = {
  EMAIL: Mail,
  SMS: Smartphone,
  WHATSAPP: MessageSquare,
  IN_APP: Bell,
};

const CHANNEL_COLORS: Record<string, string> = {
  EMAIL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  SMS: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  WHATSAPP: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  IN_APP: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const STATUS_BADGES: Record<string, string> = {
  SENT: 'bg-blue-50 text-blue-700 border-blue-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RETRY_SUCCEEDED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
  QUEUED: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function CommunicationsPage() {
  const { success, error } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Compose Modal
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [composeData, setComposeData] = useState({
    channel: 'EMAIL',
    recipientEmail: '',
    recipientPhone: '',
    subject: '',
    message: '',
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
      });
      if (channelFilter !== 'ALL') params.append('channel', channelFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`/api/communications?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.items);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCount(data.data.pagination.total);
      } else {
        error(data.error || 'Failed to load logs');
      }
    } catch {
      error('Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  }, [page, channelFilter, statusFilter, search, error]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composeData),
      });
      const data = await res.json();
      if (data.success) {
        success(data.message || 'Dispatched successfully');
        setIsComposeOpen(false);
        setComposeData({
          channel: 'EMAIL',
          recipientEmail: '',
          recipientPhone: '',
          subject: '',
          message: '',
        });
        fetchLogs();
      } else {
        error(data.error || 'Failed to dispatch message');
      }
    } catch {
      error('Error dispatching message');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryFailed = async () => {
    setRetrying(true);
    try {
      const res = await fetch('/api/communications/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allFailed: true }),
      });
      const data = await res.json();
      if (data.success) {
        success(data.message || 'Retry batch processed');
        fetchLogs();
      } else {
        error(data.error || 'Failed to retry messages');
      }
    } catch {
      error('Error retrying failed messages');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Send className="w-7 h-7 text-primary" />
            Multi-Channel Communications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dispatch, log, and monitor candidate notifications across Email, SMS, WhatsApp, and In-App channels.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/communications/templates">
            <Button variant="outline" size="sm">
              <Layers className="w-4 h-4 mr-2" />
              Manage Templates
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryFailed}
            disabled={retrying}
            className="text-amber-600 border-amber-300 hover:bg-amber-50"
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
            Retry Failed
          </Button>
          <Button size="sm" onClick={() => setIsComposeOpen(true)}>
            <Send className="w-4 h-4 mr-2" />
            Dispatch Message
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search recipient, subject, or message..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            className="text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Channels</option>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="IN_APP">In-App</option>
          </select>

          <select
            className="text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
            <option value="QUEUED">Queued</option>
          </select>

          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Channel</th>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Candidate Ref</th>
                <th className="px-6 py-4">Subject & Message</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No communication records found.
                  </td>
                </tr>
              ) : (
                logs.map((item) => {
                  const Icon = CHANNEL_ICONS[item.channel] || Send;
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            CHANNEL_COLORS[item.channel] || 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {item.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {item.recipient}
                      </td>
                      <td className="px-6 py-4">
                        {item.applicant ? (
                          <div>
                            <Link
                              href={`/admin/applicants/${item.applicant.id}`}
                              className="font-mono text-xs text-primary hover:underline"
                            >
                              {item.applicant.applicantNumber}
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              {item.applicant.fullName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Direct Dispatch</span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        {item.subject && (
                          <div className="font-medium text-foreground truncate">{item.subject}</div>
                        )}
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {item.message}
                        </div>
                        {item.failureReason && (
                          <div className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {item.failureReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            STATUS_BADGES[item.status] || 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing page {page} of {totalPages} ({totalCount} entries)
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

      {/* Manual Dispatch Modal */}
      <Modal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="Dispatch Communication Message"
        className="max-w-lg"
      >
        <form onSubmit={handleComposeSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Channel</label>
            <select
              className="w-full text-sm bg-background border border-border rounded-lg p-2.5"
              value={composeData.channel}
              onChange={(e) => setComposeData({ ...composeData, channel: e.target.value })}
            >
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS (Text Message)</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="IN_APP">In-App Notification</option>
            </select>
          </div>

          {composeData.channel === 'EMAIL' && (
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Recipient Email *
              </label>
              <Input
                type="email"
                required
                placeholder="candidate@example.com"
                value={composeData.recipientEmail}
                onChange={(e) =>
                  setComposeData({ ...composeData, recipientEmail: e.target.value })
                }
              />
            </div>
          )}

          {['SMS', 'WHATSAPP'].includes(composeData.channel) && (
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Recipient Mobile Phone Number *
              </label>
              <Input
                type="tel"
                required
                placeholder="+8801700000000"
                value={composeData.recipientPhone}
                onChange={(e) =>
                  setComposeData({ ...composeData, recipientPhone: e.target.value })
                }
              />
            </div>
          )}

          {composeData.channel === 'EMAIL' && (
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Subject *</label>
              <Input
                required
                placeholder="Important update regarding your recruitment application"
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Message Content *
            </label>
            <textarea
              rows={4}
              required
              className="w-full text-sm bg-background border border-border rounded-lg p-3 text-foreground"
              placeholder="Type notification message..."
              value={composeData.message}
              onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsComposeOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Dispatching...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
