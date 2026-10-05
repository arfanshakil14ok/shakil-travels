'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Megaphone, ChevronRight, ChevronLeft, X, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export interface NoticeItem {
  id: string;
  badgeBn: string;
  badgeEn: string;
  textBn: string;
  textEn: string;
  link?: string;
  isUrgent?: boolean;
}

const DEFAULT_NOTICES: NoticeItem[] = [
  {
    id: 'n1',
    badgeBn: 'নতুন নিয়োগ',
    badgeEn: 'Urgent Circular',
    textBn: 'সৌদি আরব ও জাপানে জরুরি ভিত্তিতে কারিগরি ও কেয়ারগিভার কর্মী নিয়োগ চলছে। দ্রুত আবেদন করুন।',
    textEn: 'Urgent recruitment open for Technical trades in Saudi Arabia and Caregivers in Japan.',
    link: '/jobs',
    isUrgent: true,
  },
  {
    id: 'n2',
    badgeBn: 'প্রশিক্ষণ ব্যাচ',
    badgeEn: 'Skill Training',
    textBn: '৬জি ওয়েল্ডিং ও জাপানি ভাষা দক্ষতা কোর্সের নতুন ব্যাচে ভর্তি শুরু হয়েছে।',
    textEn: 'Admissions now open for new batches in 6G Welding and Japanese Language Training.',
    link: '/skill-training',
    isUrgent: false,
  },
  {
    id: 'n3',
    badgeBn: 'ভিসা আপডেট',
    badgeEn: 'Visa Advisory',
    textBn: 'সৌদি কিওয়া (Qiwa) ও কাতার কিউভিসি (QVC) অনুমোদিত বৈধ প্রক্রিয়ায় ভিসা কার্যক্রম চলমান।',
    textEn: 'Official visa processing active via approved Saudi Qiwa and Qatar QVC systems.',
    link: '/visa-information',
    isUrgent: false,
  },
  {
    id: 'n4',
    badgeBn: 'সতর্কতা',
    badgeEn: 'Anti-Fraud',
    textBn: 'অননুমোদিত দালাল ও নগদ লেনদেন এড়িয়ে চলুন। কেবল অফিসিয়াল পোর্টালে তথ্য যাচাই করুন।',
    textEn: 'Avoid unauthorized intermediaries. Verify all job offers only on the official portal.',
    link: '/scam-awareness',
    isUrgent: true,
  },
];

export function NoticeBar({ notices = DEFAULT_NOTICES }: { notices?: NoticeItem[] }) {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isPaused || notices.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notices.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, notices.length]);

  if (isDismissed || notices.length === 0) return null;

  const current = notices[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + notices.length) % notices.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % notices.length);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-950 text-white border-b border-navy-800 text-xs py-2 px-4 sm:px-6 relative z-30 transition-all select-none"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left Tag / Icon */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center justify-center w-5 h-5 rounded-md bg-gold-500/20 text-gold-400 border border-gold-500/30">
            <Megaphone className="w-3 h-3 animate-pulse" />
          </span>
          <span className="font-bold text-[11px] uppercase tracking-wider text-gold-400 hidden sm:inline font-bengali">
            {language === 'bn' ? 'জরুরি নোটিশ / আপডেট' : 'Live Notice & Updates'}
          </span>
          <span className="text-slate-700 hidden sm:inline">|</span>
        </div>

        {/* Center: Animated Notice Text */}
        <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 font-bengali ${
              current.isUrgent
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {language === 'bn' ? current.badgeBn : current.badgeEn}
          </span>

          <div className="truncate font-medium text-slate-200 text-xs font-bengali transition-opacity duration-300">
            {language === 'bn' ? current.textBn : current.textEn}
          </div>

          {current.link && (
            <Link
              href={current.link}
              className="text-[11px] text-gold-400 hover:text-gold-300 font-bold underline underline-offset-2 shrink-0 hidden md:inline-flex items-center gap-1 transition-colors"
            >
              <span>{language === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Right Controls: Prev, Next, Close */}
        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          <button
            onClick={handlePrev}
            className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Previous notice"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-slate-500">
            {currentIndex + 1}/{notices.length}
          </span>
          <button
            onClick={handleNext}
            className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Next notice"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded hover:bg-white/10 hover:text-slate-300 transition-colors ml-1"
            aria-label="Dismiss notice bar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
