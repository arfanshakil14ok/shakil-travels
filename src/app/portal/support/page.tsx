'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Headset,
  Plus,
  Send,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  User,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

export default function PortalSupportPage() {
  const { language, t } = useLanguage();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // New Ticket Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('GENERAL');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newMessage, setNewMessage] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/support/tickets');
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
  }, []);

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
        // Refresh this ticket
        selectTicket(selectedTicket);
        loadTickets();
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch {
      alert('Network error sending message');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;
    setIsCreatingTicket(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject.trim(),
          category: newCategory,
          priority: newPriority,
          message: newMessage.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsNewModalOpen(false);
        setNewSubject('');
        setNewMessage('');
        loadTickets();
        selectTicket(data.data);
      } else {
        alert(data.error || 'Failed to create support ticket');
      }
    } catch {
      alert('Network error creating support ticket');
    } finally {
      setIsCreatingTicket(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              {t('প্রার্থী সহায়তা', 'Candidate Helpdesk')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {t('সাপোর্ট টিকিট ও অফিসার বার্তা', 'Support Tickets & Helpdesk')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              'ভিসা, ট্রেনিং, পেমেন্ট বা আবেদন সম্পর্কিত যেকোনো সমস্যায় আমাদের কর্মকর্তাদের সাথে সরাসরি যোগাযোগ করুন।',
              'Directly message our recruitment officers regarding applications, training, documents, or visa processing.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTickets}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {t('রিফ্রেশ', 'Refresh')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4 text-white" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            {t('নতুন টিকিট তৈরি করুন', 'Create New Ticket')}
          </Button>
        </div>
      </div>

      {/* Main Grid: Ticket List & Conversation Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tickets List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('আমার টিকিটসমূহ', 'My Tickets')} ({tickets.length})
            </span>
            <Link
              href="/portal/help"
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t('সাধারণ জিজ্ঞাসা (FAQ)', 'FAQs')}</span>
            </Link>
          </div>

          {loading ? (
            <LoadingState text={t('টিকিট তালিকা লোড হচ্ছে...', 'Loading tickets...')} />
          ) : tickets.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
              <Headset className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-slate-800">
                {t('কোনো সাপোর্ট টিকিট নেই', 'No Support Tickets Found')}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {t(
                  'আপনার কোনো প্রশ্ন বা সমস্যা থাকলে নতুন টিকিট তৈরি করে আমাদের অফিসারদের সহায়তা নিন।',
                  'If you have inquiries or need assistance, click Create New Ticket above.'
                )}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNewModalOpen(true)}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {t('টিকিট খুলুন', 'Open a Ticket')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tickets.map((tck) => {
                const isSelected = selectedTicket?.id === tck.id;
                return (
                  <div
                    key={tck.id}
                    onClick={() => selectTicket(tck)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-slate-600">
                        {tck.ticketNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tck.status === 'RESOLVED' || tck.status === 'CLOSED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tck.status === 'WAITING_FOR_CANDIDATE'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {tck.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 mt-1.5 line-clamp-1">
                      {tck.subject}
                    </h4>

                    {tck.messages && tck.messages.length > 0 && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {tck.messages[0].message}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {tck.category}
                      </span>
                      <span>{new Date(tck.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Conversation (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[640px]">
              {/* Ticket Top Bar */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-1">
                    {selectedTicket.subject}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">{t('ক্যাটাগরি', 'Category')}</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {selectedTicket.category}
                  </span>
                </div>
              </div>

              {/* Messages Thread Scroll Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
                {ticketDetailsLoading ? (
                  <LoadingState text={t('বার্তা লোড হচ্ছে...', 'Loading messages...')} />
                ) : selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((msg: any) => {
                    const isApplicant = msg.senderType === 'APPLICANT';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isApplicant ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                          <span className="font-semibold text-slate-600">
                            {isApplicant
                              ? t('আপনি (আবেদনকারী)', 'You (Applicant)')
                              : msg.staffSender?.name
                              ? `${msg.staffSender.name} (Support Officer)`
                              : 'SHAKIL GLOBAL Helpdesk'}
                          </span>
                          <span>•</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap ${
                            isApplicant
                              ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
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
                    {t('কোনো পূর্ববর্তী বার্তা নেই', 'No message history.')}
                  </div>
                )}
              </div>

              {/* Message Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  placeholder={t('আপনার বার্তা লিখুন...', 'Type your reply message here...')}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  disabled={isSendingReply || selectedTicket.status === 'CLOSED'}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSendingReply || !replyMessage.trim() || selectedTicket.status === 'CLOSED'}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl"
                  leftIcon={<Send className="w-3.5 h-3.5 text-white" />}
                >
                  {isSendingReply ? t('পাঠানো হচ্ছে...', 'Sending...') : t('পাঠান', 'Send')}
                </Button>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center h-[640px] flex flex-col items-center justify-center shadow-xs">
              <MessageCircle className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-base text-slate-700">
                {t('একটি টিকিট নির্বাচন করুন', 'Select a Ticket to View Messages')}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {t(
                  'বামের তালিকা থেকে যেকোনো টিকিটে ক্লিক করে বিস্তারিত কথোপকথন ও অফিসিয়াল নির্দেশনা দেখুন।',
                  'Click on any ticket in the left list to review official communications and submit replies.'
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {t('নতুন সহায়তা টিকিট তৈরি করুন', 'Open a Support Ticket')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('আপনার সমস্যা সম্পর্কে বিস্তারিত লিখুন', 'Describe your question or issue in detail')}
                </p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('বিষয় / Subject', 'Subject')}
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder={t('যেমন: মেডিকেল রিপোর্টের আপডেট জানতে চাই', 'e.g. Inquiring about GAMCA medical status')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('বিভাগ / Category', 'Category')}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="GENERAL">সাধারণ / GENERAL</option>
                    <option value="APPLICATION">আবেদন / APPLICATION</option>
                    <option value="TRAINING">স্কিল ট্রেনিং / TRAINING</option>
                    <option value="DOCUMENT">নথিপত্র / DOCUMENT</option>
                    <option value="VISA">ভিসা ও ইমিগ্রেশন / VISA</option>
                    <option value="PAYMENT">হিসাব ও পেমেন্ট / PAYMENT</option>
                    <option value="TECHNICAL">কারিগরি / TECHNICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('জরুরিতা / Priority', 'Priority')}
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="LOW">স্বাভাবিক / LOW</option>
                    <option value="MEDIUM">মাঝারি / MEDIUM</option>
                    <option value="HIGH">জরুরি / HIGH</option>
                    <option value="URGENT">অতি জরুরি / URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('বার্তা ও বিস্তারিত বিবরণ / Detailed Message', 'Detailed Message')}
                </label>
                <textarea
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('আপনার বিস্তারিত বক্তব্য লিখুন...', 'Please provide full details of your query...')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewModalOpen(false)}
                >
                  {t('বাতিল', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isCreatingTicket}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isCreatingTicket ? t('তৈরি হচ্ছে...', 'Creating...') : t('টিকিট দাখিল করুন', 'Submit Ticket')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
