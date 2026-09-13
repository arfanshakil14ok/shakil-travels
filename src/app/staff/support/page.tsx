'use client';

import React, { useState, useEffect } from 'react';
import {
  Headset,
  Search,
  Filter,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  User,
  ShieldCheck,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

export default function StaffSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);

      const res = await fetch(`/api/support/tickets?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTickets();
  };

  const selectTicket = async (ticket: any) => {
    setTicketDetailsLoading(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedTicket(data.data);
      } else {
        setSelectedTicket(ticket);
      }
    } catch {
      setSelectedTicket(ticket);
    } finally {
      setTicketDetailsLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    setIsSendingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyMessage('');
        selectTicket(selectedTicket);
        loadTickets();
      } else {
        alert(data.error || 'Failed to send reply');
      }
    } catch {
      alert('Network error while sending reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTicket((prev: any) => ({ ...prev, status: newStatus }));
        loadTickets();
      } else {
        alert(data.error || 'Failed to update ticket status');
      }
    } catch {
      alert('Network error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
    waitingCandidate: tickets.filter((t) => t.status === 'WAITING_FOR_CANDIDATE').length,
    resolved: tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-navy-100 text-navy-800 font-semibold">
              Support Desk Operations
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Candidate Helpdesk & Support Tickets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review candidate inquiries, reply to messages, track issue resolution, and manage support workflows.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadTickets}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Total Support Tickets</span>
          <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
        </div>
        <div className="p-4 bg-white border border-rose-200 rounded-xl shadow-xs bg-rose-50/20">
          <span className="text-xs text-rose-700 font-medium block">Open / In Progress</span>
          <span className="text-2xl font-bold text-rose-700">{stats.open}</span>
        </div>
        <div className="p-4 bg-white border border-amber-200 rounded-xl shadow-xs bg-amber-50/20">
          <span className="text-xs text-amber-700 font-medium block">Waiting for Candidate</span>
          <span className="text-2xl font-bold text-amber-700">{stats.waitingCandidate}</span>
        </div>
        <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-xs bg-emerald-50/20">
          <span className="text-xs text-emerald-700 font-medium block">Resolved & Closed</span>
          <span className="text-2xl font-bold text-emerald-700">{stats.resolved}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search ticket no, candidate, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-600 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="WAITING_FOR_CANDIDATE">WAITING_FOR_CANDIDATE</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-600 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Categories</option>
              <option value="GENERAL">GENERAL</option>
              <option value="APPLICATION">APPLICATION</option>
              <option value="TRAINING">TRAINING</option>
              <option value="DOCUMENT">DOCUMENT</option>
              <option value="VISA">VISA</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="TECHNICAL">TECHNICAL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Ticket Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          {loading ? (
            <LoadingState text="Loading support tickets..." />
          ) : tickets.length === 0 ? (
            <EmptyState
              title="No Tickets Found"
              description="There are currently no support tickets matching your search or filters."
            />
          ) : (
            tickets.map((tck) => {
              const isSelected = selectedTicket?.id === tck.id;
              return (
                <div
                  key={tck.id}
                  onClick={() => selectTicket(tck)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-navy-50/80 border-navy-900 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {tck.ticketNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tck.status === 'RESOLVED' || tck.status === 'CLOSED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tck.status === 'OPEN'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {tck.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 mt-1 line-clamp-1">
                    {tck.subject}
                  </h4>

                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                    <span className="font-medium text-slate-800">{tck.applicant?.fullName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {tck.applicant?.applicantNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {tck.category} • {tck.priority}
                    </span>
                    <span>{new Date(tck.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Conversation Window (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[640px]">
              {/* Top Bar with Status Switcher */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-semibold">
                      {selectedTicket.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-0.5">
                    {selectedTicket.subject}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Candidate: <span className="font-semibold text-slate-800">{selectedTicket.applicant?.fullName}</span> ({selectedTicket.applicant?.phone})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Status:</span>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={isUpdatingStatus}
                    className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold focus:ring-2 focus:ring-navy-900"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="WAITING_FOR_CANDIDATE">WAITING_FOR_CANDIDATE</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
                {ticketDetailsLoading ? (
                  <LoadingState text="Loading ticket message history..." />
                ) : selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((msg: any) => {
                    const isStaff = msg.senderType === 'STAFF';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                          <span className="font-semibold text-slate-600">
                            {isStaff
                              ? msg.staffSender?.name
                                ? `${msg.staffSender.name} (Officer)`
                                : 'You (Staff Officer)'
                              : `${selectedTicket.applicant?.fullName} (Candidate)`}
                          </span>
                          <span>•</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap ${
                            isStaff
                              ? 'bg-navy-900 text-white rounded-tr-xs shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No messages in this ticket.
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  placeholder="Type official staff response to candidate..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-900"
                  disabled={isSendingReply}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSendingReply || !replyMessage.trim()}
                  className="bg-navy-950 hover:bg-navy-900 text-white px-4 rounded-xl"
                  leftIcon={<Send className="w-3.5 h-3.5 text-white" />}
                >
                  {isSendingReply ? 'Sending...' : 'Send Reply'}
                </Button>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center h-[640px] flex flex-col items-center justify-center shadow-xs">
              <MessageCircle className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-base text-slate-700">
                Select a Support Ticket
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Choose a candidate support ticket from the list to review the thread, update status, or send official replies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
