'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  FileSearch,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plane,
  FileCheck2,
  AlertCircle,
  ShieldCheck,
  Building2,
  User,
  CreditCard,
  PhoneCall,
  X,
  ExternalLink,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BRAND } from '@/config/brand';
import { ApplicationSlipView, ApplicationSlipData } from '@/components/portal/application-slip-view';

interface TrackingData {
  applicationCode: string;
  slipNumber?: string;
  applicantNumber: string;
  candidateName?: string;
  candidateNameMasked: string;
  candidatePhoto?: string | null;
  fatherName?: string | null;
  district?: string | null;
  passportNumber?: string | null;
  passportMasked: string;
  phone?: string;
  jobTitle: string;
  countryName: string;
  countryFlag: string;
  employerName: string;
  status: string;
  stageIndex: number;
  stageTitle: string;
  stageDesc: string;
  badgeColor: string;
  isTerminated: boolean;
  appliedDate: string;
  lastUpdated: string;
  stages: Array<{
    step: number;
    title: string;
    desc: string;
    state: 'COMPLETED' | 'CURRENT' | 'PENDING';
  }>;
  recentActivity: Array<{
    status: string;
    notes?: string | null;
    date: string;
  }>;
  slipData?: ApplicationSlipData;
}

interface FileTrackingWidgetProps {
  initialQuery?: string;
  variant?: 'card' | 'compact' | 'hero';
  className?: string;
  onSuccess?: (data: TrackingData) => void;
}

export const FileTrackingWidget: React.FC<FileTrackingWidgetProps> = ({
  initialQuery = '',
  variant = 'card',
  className,
  onSuccess,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<TrackingData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);

  const handleTrack = useCallback(
    async (customQuery?: string | React.FormEvent, e?: React.FormEvent) => {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      if (customQuery && typeof customQuery === 'object' && 'preventDefault' in customQuery) {
        customQuery.preventDefault();
        customQuery = undefined;
      }
      const cleanQuery = (typeof customQuery === 'string' ? customQuery : query).trim();
      if (!cleanQuery) {
        setError('অনুগ্রহ করে আবেদন স্লিপ নম্বর বা পাসপোর্ট নম্বর লিখুন');
        return;
      }

      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const res = await fetch(`/api/track?q=${encodeURIComponent(cleanQuery)}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || 'সার্ভার থেকে ট্র্যাকিং তথ্য পাওয়া যায়নি');
        }

        if (json.found && json.data) {
          setData(json.data);
          setIsModalOpen(true);
          if (onSuccess) onSuccess(json.data);
        } else {
          setData(null);
          setNotFound(true);
        }
      } catch (err: any) {
        setError(err.message || 'একটি ত্রুটি ঘটেছে, পুনরায় চেষ্টা করুন');
      } finally {
        setLoading(false);
      }
    },
    [query, onSuccess]
  );

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleTrack(initialQuery.trim());
    }
  }, [initialQuery, handleTrack]);

  return (
    <div className={cn('w-full font-bengali', className)}>
      <form onSubmit={(e) => handleTrack(undefined, e)} className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-[#172B45] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileSearch className="w-4 h-4 text-[#102B50]" />
              আবেদন স্লিপ নম্বর বা পাসপোর্ট নম্বর
            </span>
            <span className="text-[11px] font-normal text-[#66758A]">লাইভ রিক্রুটমেন্ট ট্র্যাকিং ও ছবি ভেরিফিকেশন</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (error) setError(null);
                if (notFound) setNotFound(false);
              }}
              placeholder="যেমন: SGR-APP-2026-000001 বা পাসপোর্ট নম্বর..."
              className="w-full pl-9 pr-24 py-2.5 text-xs sm:text-sm bg-[#F6F8FB] border border-[#CBDDF0] rounded-xl text-[#172B45] placeholder-[#66758A] focus:outline-none focus:border-[#102B50] focus:bg-white focus:ring-1 focus:ring-[#102B50] transition-all"
            />
            <Search className="w-4 h-4 text-[#66758A] absolute left-3 top-3 pointer-events-none" />

            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-[#102B50] hover:bg-[#0B1D35] disabled:opacity-70 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>খোঁজা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>ট্র্যাক করুন</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {notFound && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>কোনো সক্রিয় ফাইল পাওয়া যায়নি</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              প্রদত্ত নম্বরটি সঠিকভাবে লেখা হয়েছে কিনা যাচাই করুন। কোনো সহায়তার জন্য আমাদের সেন্ট্রাল হেল্পলাইনে যোগাযোগ করুন:{' '}
              <a href="tel:01913681771" className="font-bold underline text-[#102B50]">
                01913-681771
              </a>
            </p>
          </div>
        )}
      </form>

      {/* Quick Help Micro-note */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-[#66758A] pt-2 border-t border-[#E4EAF1]">
        <span className="flex items-center gap-1 text-[#24856A]">
          <ShieldCheck className="w-3.5 h-3.5" />
          রিয়েল-টাইম ভিসা ও স্ট্যাটাস যাচাই
        </span>
        <Link href="/portal/login" className="text-[#102B50] hover:underline font-bold flex items-center gap-0.5">
          <span>প্রার্থী ড্যাশবোর্ড</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Interactive Tracking Result Modal */}
      {isModalOpen && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto font-bengali">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#102B50] to-[#1E3A8A] text-white rounded-t-2xl relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>অফিসিয়াল ফাইল ট্র্যাকিং ও অগ্রগতি প্রতিবেদন</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{data.jobTitle}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-normal">
                  {data.countryFlag} {data.countryName}
                </span>
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-200 font-mono">
                <div>
                  ফাইল কোড: <span className="font-bold text-white">{data.applicationCode}</span>
                </div>
                <div>•</div>
                <div>
                  প্রার্থী: <span className="font-bold text-white font-sans">{data.candidateNameMasked}</span>
                </div>
                {data.passportMasked && (
                  <>
                    <div>•</div>
                    <div>
                      পাসপোর্ট: <span className="font-bold text-white">{data.passportMasked}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6">
              {/* Verified Candidate Profile Card with Photo */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 border border-emerald-200/90 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Candidate Photo Frame */}
                <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden border-2 border-emerald-600 bg-white shadow-sm shrink-0 flex items-center justify-center">
                  {data.candidatePhoto ? (
                    <Image
                      src={data.candidatePhoto}
                      alt={data.candidateName || 'Candidate photo'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                      <User className="w-10 h-10 mb-1 text-slate-300" />
                      <span className="text-[10px] font-bold text-slate-500">প্রার্থীর ছবি</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-emerald-700 text-white text-[8px] font-bold text-center py-0.5 uppercase tracking-wider flex items-center justify-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>ভেরিফাইড</span>
                  </div>
                </div>

                {/* Candidate Info Details */}
                <div className="flex-1 min-w-0 space-y-1.5 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ভেরিফাইড প্রার্থী ও বৈধ আবেদন স্লিপ</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#102B50] tracking-tight">
                    {data.candidateName || data.candidateNameMasked}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#172B45]">
                    {data.fatherName && (
                      <div>
                        <span className="text-[#66758A]">পিতার নাম: </span>
                        <span className="font-semibold">{data.fatherName}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[#66758A]">পাসপোর্ট: </span>
                      <span className="font-mono font-bold text-[#102B50]">
                        {data.passportMasked || data.passportNumber || 'সংযুক্ত'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#66758A]">আবেদন স্লিপ: </span>
                      <span className="font-mono font-bold text-emerald-700">
                        {data.slipNumber || data.applicationCode}
                      </span>
                    </div>
                    {data.district && (
                      <div>
                        <span className="text-[#66758A]">জেলা / এলাকা: </span>
                        <span className="font-semibold">{data.district}</span>
                      </div>
                    )}
                  </div>

                  {data.slipData && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowSlipModal(true)}
                        leftIcon={<FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />}
                        className="text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-50 shadow-2xs"
                      >
                        অফিসিয়াল আবেদন স্লিপ দেখুন / প্রিন্ট
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Status Highlight Card */}
              <div className="p-4 rounded-xl bg-[#F6F8FB] border border-[#CBDDF0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#66758A] uppercase tracking-wider">বর্তমান অবস্থান</span>
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs',
                      data.isTerminated
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>ধাপ {data.stageIndex} / ৭: {data.stageTitle}</span>
                  </span>
                </div>

                <p className="text-sm text-[#172B45] leading-relaxed font-medium">
                  {data.stageDesc}
                </p>

                <div className="text-[11px] text-[#66758A] flex items-center gap-1 pt-1 border-t border-slate-200/60">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    সর্বশেষ আপডেট: {new Date(data.lastUpdated).toLocaleDateString('bn-BD', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* 7 Stages Linear Progression Timeline */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#66758A] mb-3">
                  রিক্রুটমেন্ট ও ভিসা প্রসেসিং টাইমলাইন
                </h3>
                <div className="space-y-2.5">
                  {data.stages.map((st) => (
                    <div
                      key={st.step}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-xl border transition-all text-xs',
                        st.state === 'COMPLETED' && 'bg-emerald-50/60 border-emerald-200 text-emerald-950',
                        st.state === 'CURRENT' && 'bg-white border-[#102B50] shadow-sm ring-1 ring-[#102B50]/20 text-[#102B50]',
                        st.state === 'PENDING' && 'bg-slate-50/50 border-slate-200 text-slate-400'
                      )}
                    >
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                          st.state === 'COMPLETED' && 'bg-emerald-600 text-white',
                          st.state === 'CURRENT' && 'bg-[#102B50] text-white animate-pulse',
                          st.state === 'PENDING' && 'bg-slate-200 text-slate-500'
                        )}
                      >
                        {st.state === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> : st.step}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold flex items-center gap-2">
                          <span>{st.title}</span>
                          {st.state === 'CURRENT' && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#102B50] text-white">
                              চলমান
                            </span>
                          )}
                          {st.state === 'COMPLETED' && (
                            <span className="text-[10px] font-bold text-emerald-700">সম্পন্ন ✓</span>
                          )}
                        </div>
                        <div className="text-[11px] opacity-80">{st.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-[#66758A] text-center sm:text-left">
                  পূর্ণাঙ্গ ডকুমেন্ট ও পেমেন্ট রসিদ দেখতে{' '}
                  <Link href="/portal/login" className="font-bold text-[#102B50] underline">
                    প্রার্থী পোর্টালে লগইন
                  </Link>{' '}
                  করুন।
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto font-bengali text-xs"
                  >
                    বন্ধ করুন
                  </Button>
                  <Link href="/portal/login" className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="sm"
                      rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      className="w-full sm:w-auto font-bengali text-xs bg-[#102B50] hover:bg-[#0B1D35] text-white"
                    >
                      পোর্টাল এক্সেস
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Official Application Slip Full Modal View */}
      {showSlipModal && data?.slipData && (
        <ApplicationSlipView
          data={data.slipData}
          isModal={true}
          onClose={() => setShowSlipModal(false)}
        />
      )}
    </div>
  );
};
