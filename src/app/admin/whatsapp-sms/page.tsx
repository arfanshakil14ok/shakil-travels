'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Smartphone,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Search,
  FileText,
  Phone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  category: string;
  body: string;
}

const RECRUITMENT_TEMPLATES: Template[] = [
  {
    id: 'int-call',
    name: 'ইন্টারভিউ কল লেটার (Interview Call)',
    category: 'ইন্টারভিউ',
    body: 'আসসালামু আলাইকুম [নাম],\nশাকিল গ্লোবাল ট্রাভেলস থেকে জানানো যাচ্ছে যে, [পদের নাম] পদের জন্য আপনার ইন্টারভিউ আগামী [তারিখ] সকাল [সময়]-এ আমাদের অফিসে অনুষ্ঠিত হবে। পাসপোর্ট ও শিক্ষাগত সনদের মূল কপি সঙ্গে আনবেন। ধন্যবাদ।',
  },
  {
    id: 'med-notice',
    name: 'মেডিকেল চেকআপ নোটিশ (Medical Test)',
    category: 'মেডিকেল',
    body: 'শ্রদ্ধেয় [নাম],\nআপনার চাকরির আবেদনের প্রাথমিক সিলেকশন সম্পন্ন হয়েছে। আগামী [তারিখ]-এর মধ্যে অনুমোদিত গামকা (GAMCA) সেন্টারে মেডিকেল সম্পন্ন করার অনুরোধ করা হলো। কোনো সহায়তার প্রয়োজন হলে আমাদের সাথে যোগাযোগ করুন। - শাকিল গ্লোবাল',
  },
  {
    id: 'visa-stamped',
    name: 'ভিসা অ্যাপ্রুভাল শুভেচ্ছা (Visa Approved)',
    category: 'ভিসা',
    body: 'অভিনন্দন [নাম]!\nআপনার [দেশ]-এর ভিসা সফলভাবে সম্পন্ন ও স্ট্যাম্পিং হয়েছে। আগামী ২ দিনের মধ্যে অরিজিনাল পাসপোর্ট ও ডকুমেন্টস সংগ্রহের জন্য অফিসে যোগাযোগ করার অনুরোধ করা হচ্ছে। - শাকিল গ্লোবাল রিক্রুটমেন্ট',
  },
  {
    id: 'flight-briefing',
    name: 'ফ্লাইট টিকিট ও ব্রিফিং (Flight Schedule)',
    category: 'ফ্লাইট',
    body: 'প্রিয় [নাম],\nআপনার বিদেশযাত্রার এয়ার টিকিট কনফার্ম হয়েছে। ফ্লাইট তারিখ: [তারিখ], সময়: [সময়]। ফ্লাইটের ৩ ঘণ্টা পূর্বে ঢাকা এয়ারপোর্টে উপস্থিত থাকবেন। এয়ারপোর্ট সহায়তা টিমের নম্বর: 01700-000000। আপনার নিরাপদ যাত্রা কামনা করি।',
  },
  {
    id: 'doc-submit',
    name: 'পাসপোর্ট ও পুলিশ ক্লিয়ারেন্স তাগাদা (Docs)',
    category: 'ডকুমেন্ট',
    body: 'আসসালামু আলাইকুম [নাম],\nআপনার ফাইল প্রসেসিং এগিয়ে নেওয়ার জন্য মূল পাসপোর্ট ও ডিজিটাল পুলিশ ক্লিয়ারেন্স জরুরি ভিত্তিতে অফিসে জমা দিন। বিলম্ব হলে ভিসা প্রসেস পিছিয়ে যেতে পারে। - শাকিল গ্লোবাল',
  },
  {
    id: 'payment-due',
    name: 'বকেয়া বিল ও কিস্তি রিমাইন্ডার (Payment)',
    category: 'পেমেন্ট',
    body: 'শ্রদ্ধেয় [নাম],\nআপনার রিক্রুটমেন্ট প্রসেসিং ফি এর পরবর্তী কিস্তি বাবদ [টাকা] টাকা বকেয়া রয়েছে। অনুগ্রহপূর্বক আগামী [তারিখ]-এর মধ্যে বিল পরিশোধ করে রসিদ সংগ্রহ করুন। ধন্যবাদ।',
  },
];

export default function WhatsAppSMSPage() {
  const { success, error } = useToast();
  const [channel, setChannel] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [sending, setSending] = useState(false);

  // Applicants selector
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Load applicants
  useEffect(() => {
    async function loadApplicants() {
      setLoadingApplicants(true);
      try {
        const res = await fetch('/api/applicants?pageSize=20&status=ACTIVE');
        const data = await res.json();
        if (data.success && data.data?.applicants) {
          setApplicants(data.data.applicants);
        }
      } catch (e) {
      } finally {
        setLoadingApplicants(false);
      }
    }
    loadApplicants();
  }, []);

  // Fetch recent message logs
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/communications?limit=10');
      const data = await res.json();
      if (data.success) {
        setRecentLogs(data.data.items || []);
      }
    } catch (e) {
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle template selection
  const handleSelectTemplate = (tpl: Template) => {
    setSelectedTemplateId(tpl.id);
    let populated = tpl.body;
    if (recipientName) {
      populated = populated.replaceAll('[নাম]', recipientName);
    }
    setMessageText(populated);
  };

  const handleSelectApplicant = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const app = applicants.find((a) => a.id === e.target.value);
    if (app) {
      setRecipientName(app.fullName);
      setRecipientPhone(app.phone);
      if (selectedTemplateId) {
        const tpl = RECRUITMENT_TEMPLATES.find((t) => t.id === selectedTemplateId);
        if (tpl) {
          setMessageText(tpl.body.replaceAll('[নাম]', app.fullName));
        }
      }
    }
  };

  const cleanPhoneNumber = (phone: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '88' + clean;
    } else if (!clean.startsWith('880') && clean.length === 10) {
      clean = '880' + clean;
    }
    return clean;
  };

  const handleSend = async () => {
    if (!recipientPhone.trim()) {
      error('প্রাপকের মোবাইল নম্বর আবশ্যক');
      return;
    }
    if (!messageText.trim()) {
      error('মেসেজের টেক্সট লিখুন');
      return;
    }

    const formattedPhone = cleanPhoneNumber(recipientPhone);

    if (channel === 'WHATSAPP') {
      // Direct launch WhatsApp Web / App
      const encodedText = encodeURIComponent(messageText);
      const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;

      // Also record in central communication log
      try {
        await fetch('/api/communications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: 'WHATSAPP',
            recipientPhone: formattedPhone,
            message: messageText,
            subject: 'WhatsApp Communication',
          }),
        });
        fetchLogs();
      } catch (e) {}

      window.open(waUrl, '_blank');
      success('হোয়াটসঅ্যাপ ওপেন করা হয়েছে');
    } else {
      // SMS Gateway
      setSending(true);
      try {
        const res = await fetch('/api/communications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: 'SMS',
            recipientPhone: formattedPhone,
            message: messageText,
            subject: 'Official SMS Alert',
          }),
        });
        const data = await res.json();
        if (data.success) {
          success('এসএমএস সফলভাবে প্রেরণের জন্য কিউতে যুক্ত হয়েছে');
          fetchLogs();
        } else {
          error(data.error || 'এসএমএস পাঠাতে সমস্যা হয়েছে');
        }
      } catch (e) {
        error('সার্ভারে যোগাযোগ ব্যর্থ হয়েছে');
      } finally {
        setSending(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Direct Communication Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            হোয়াটসঅ্যাপ ও এসএমএস (WhatsApp & SMS)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ক্যান্ডিডেট ও ক্লায়েন্টদের সাথে সরাসরি হোয়াটসঅ্যাপ বার্তা এবং অফিসিয়াল এসএমএস প্রেরণের হাব।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            isLoading={loadingLogs}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            হিস্ট্রি রিফ্রেশ
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Composer */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                মেসেজ কম্পোজ ও প্রেরণ করুন
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  চ্যানেল নির্বাচন করুন
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setChannel('WHATSAPP')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                      channel === 'WHATSAPP'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold">হোয়াটসঅ্যাপ (WhatsApp Direct)</p>
                      <p className="text-[11px] text-slate-500">১-ক্লিকে চ্যাট ও প্রি-ফিল্ড মেসেজ</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('SMS')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                      channel === 'SMS'
                        ? 'border-blue-500 bg-blue-50/50 text-blue-900 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold">অফিসিয়াল এসএমএস (SMS Gateway)</p>
                      <p className="text-[11px] text-slate-500">বাল্ক ও সেন্ট্রাল গেটওয়ে মেসেজ</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Candidate Picker & Mobile Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ক্যান্ডিডেট সিলেক্ট করুন (ঐচ্ছিক)
                  </label>
                  <select
                    onChange={handleSelectApplicant}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none"
                  >
                    <option value="">-- সক্রিয় ক্যান্ডিডেট তালিকা --</option>
                    {applicants.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName} ({a.applicantNumber}) - {a.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মোবাইল নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="যেমন: 01712345678"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    />
                  </div>
                </div>
              </div>

              {/* Ready-made Templates */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  রেডিমেড রিক্রুটমেন্ট টেমপ্লেট নির্বাচন করুন
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {RECRUITMENT_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className={`p-2.5 text-left rounded-lg border text-xs transition-all ${
                        selectedTemplateId === tpl.id
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-semibold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{tpl.name}</span>
                        <Badge variant="neutral" size="sm">
                          {tpl.category}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Content Area */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    মেসেজের বিষয়বস্তু <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {messageText.length} অক্ষর
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="এখানে মেসেজ টাইপ করুন বা উপরের টেমপ্লেট থেকে সিলেক্ট করুন..."
                  className="w-full p-3 text-xs leading-relaxed rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMessageText('');
                    setSelectedTemplateId('');
                    setRecipientPhone('');
                    setRecipientName('');
                  }}
                >
                  ক্লিয়ার করুন
                </Button>

                {channel === 'WHATSAPP' ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSend}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    leftIcon={<MessageSquare className="w-4 h-4" />}
                  >
                    হোয়াটসঅ্যাপে পাঠান (Send via WhatsApp)
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSend}
                    isLoading={sending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    leftIcon={<Smartphone className="w-4 h-4" />}
                  >
                    অফিসিয়াল এসএমএস পাঠান (Send SMS)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Mobile Preview & Recent Activity */}
        <div className="space-y-6">
          {/* Mobile Preview Card */}
          <Card className="border-slate-200 bg-slate-900 text-white overflow-hidden shadow-md">
            <CardHeader className="bg-slate-800/80 pb-3 border-b border-slate-700">
              <CardTitle className="text-xs font-semibold flex items-center justify-between text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  ক্যান্ডিডেটের ফোনে যেমন দেখাবে
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {channel} PREVIEW
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="bg-slate-800 rounded-lg p-3 text-[11px] text-slate-300 border border-slate-700">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2 text-slate-400 text-[10px]">
                  <span>{recipientName || 'ক্যান্ডিডেট'}</span>
                  <span>{recipientPhone || '+880 1700-000000'}</span>
                </div>
                <p className="whitespace-pre-line leading-relaxed text-slate-100">
                  {messageText || 'মেসেজ বক্সের টেক্সট এখানে লাইভ দেখা যাবে...'}
                </p>
                <div className="text-right text-[9px] text-slate-500 mt-2">
                  এখন • শাকিল গ্লোবাল ট্রাভেলস
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Communications History */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-xs font-bold flex items-center justify-between">
                <span>রিসেন্ট প্রেরিত বার্তা</span>
                <Badge variant="neutral" size="sm">
                  {recentLogs.length} টি
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 max-h-72 overflow-y-auto space-y-2">
              {loadingLogs ? (
                <div className="p-4 text-center text-xs text-slate-400">হিস্ট্রি লোড হচ্ছে...</div>
              ) : recentLogs.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">কোনো হিস্ট্রি পাওয়া যায়নি।</div>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {log.recipientPhone || log.recipientEmail || 'ফোন নম্বর'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(log.createdAt, true)}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] truncate">
                      {log.message || log.subject}
                    </p>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                        {log.channel}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-medium">
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
