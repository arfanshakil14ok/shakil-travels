'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Plane,
  HeartPulse,
  Stamp,
  FileCheck2,
  Clock,
  ChevronRight,
  RefreshCw,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';

export default function PortalProcessingListPage() {
  const { language, t } = useLanguage();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/portal/processing');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch processing records');
      }
      setCases(data.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl">
            <Plane className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {t('নিয়োগ ও বিদেশযাত্রা প্রসেসিং ট্র্যাকার', 'Deployment & Recruitment Processing Tracker')}
            </h1>
            <p className="text-xs text-indigo-200">
              {t(
                'আপনার মেডিকেল (গামকা), ভিসা আবেদন, বিএমইটি স্মার্ট কার্ড এবং বিমান টিকিট সংক্রান্ত সর্বশেষ অবস্থা।',
                'Track your medical fitness, visa submission, BMET smart card, and flight ticket status in real time.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
          <p>{t('প্রসেসিং রেকর্ড লোড হচ্ছে...', 'Loading processing records...')}</p>
        </div>
      ) : errorMsg ? (
        <div className="py-16 text-center text-xs text-rose-600 space-y-2 bg-white rounded-xl border border-rose-200 p-6">
          <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
          <p>{errorMsg}</p>
          <Button size="sm" variant="outline" onClick={fetchCases}>
            {t('পুনরায় চেষ্টা করুন', 'Try Again')}
          </Button>
        </div>
      ) : cases.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs space-y-3 bg-white rounded-xl border border-slate-200 p-8">
          <ShieldCheck className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-bold text-slate-700 text-sm">
            {t('কোনো সক্রিয় প্রসেসিং ফাইল পাওয়া যায়নি', 'No Active Recruitment Processing Case Found')}
          </p>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            {t(
              'আপনি যখন কোনো বিদেশি চাকরির জন্য চূড়ান্তভাবে নির্বাচিত (Selected) হবেন, তখন শাকিল ট্রাভেলস আপনার প্রসেসিং ফাইল চালু করবে।',
              'When you are selected for an overseas job position, your official recruitment processing file will appear here.'
            )}
          </p>
          <Link href="/portal/applications">
            <Button size="sm" variant="outline" className="text-xs">
              {t('আমার আবেদনসমূহ দেখুন', 'View My Applications')} →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((pc) => {
            const medFit = pc.medicalCase?.result === 'FIT';
            const visaApproved = pc.visaCase?.status === 'APPROVED';
            const bmetDone = pc.clearanceCase?.status === 'COMPLETED';
            const ticketIssued = pc.travelTicket?.status === 'ISSUED';
            const departed = ['DEPARTED', 'JOINED', 'COMPLETED'].includes(pc.currentStage);

            return (
              <div
                key={pc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {pc.processingCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          pc.overallStatus === 'COMPLETED'
                            ? 'bg-purple-100 text-purple-800'
                            : pc.overallStatus === 'ON_HOLD'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        ● {pc.overallStatus}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {pc.job?.title}
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{pc.employer?.companyName}</span>
                      <span>•</span>
                      <span className="font-semibold text-indigo-700">
                        {pc.job?.country?.name || 'Saudi Arabia'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/portal/processing/${pc.id}`}>
                      <Button size="sm" className="text-xs bg-slate-900 hover:bg-indigo-900 text-white font-bold">
                        {t('বিস্তারিত ও নথিপত্র', 'View Full Timeline & Docs')}
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* 5-Step Visual Progress Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-700">
                      <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{t('কাগজপত্র', 'Docs')}</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                      ✓ {t('জমা হয়েছে', 'Submitted')}
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg border ${medFit ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
                      <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
                      <span>{t('মেডিকেল', 'Medical')}</span>
                    </div>
                    <div className="text-[10px] font-semibold mt-1">
                      {medFit ? t('ফিট (উত্তীর্ণ)', 'Passed (Fit)') : pc.medicalCase?.result || t('প্রক্রিয়াধীন', 'Pending')}
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg border ${visaApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
                      <Stamp className="w-3.5 h-3.5 text-purple-600" />
                      <span>{t('ভিসা', 'Visa')}</span>
                    </div>
                    <div className="text-[10px] font-semibold mt-1">
                      {visaApproved ? t('অনুমোদিত', 'Approved') : pc.visaCase?.status || t('প্রক্রিয়াধীন', 'Processing')}
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg border ${bmetDone ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t('বিএমইটি', 'BMET')}</span>
                    </div>
                    <div className="text-[10px] font-semibold mt-1">
                      {bmetDone ? t('স্মার্ট কার্ড সম্পন্ন', 'Smart Card OK') : pc.clearanceCase?.status || t('প্রক্রিয়াধীন', 'In Progress')}
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg border ${ticketIssued ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
                      <Plane className="w-3.5 h-3.5 text-sky-600" />
                      <span>{t('ফ্লাইট', 'Flight')}</span>
                    </div>
                    <div className="text-[10px] font-semibold mt-1">
                      {departed ? t('প্রস্থান সম্পন্ন', 'Departed') : ticketIssued ? t('টিকিট প্রস্তুত', 'Ticket Ready') : t('অপেক্ষমান', 'Pending')}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>{t('বর্তমান পর্যায়:', 'Current Stage:')} <strong className="text-slate-800 font-mono">{pc.currentStage}</strong></span>
                  <span>{t('ফাইল চালুর তারিখ:', 'Started:')} {new Date(pc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
