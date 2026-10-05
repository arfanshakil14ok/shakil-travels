'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Users, Globe2, BriefcaseBusiness, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export interface LiveStatsData {
  workersCount?: number;
  countriesCount?: number;
  jobsCount?: number;
  successRate?: number;
}

function useCountUp(endVal: number, duration: number = 1800, shouldStart: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;

    // Respect reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCount(endVal);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easedProgress * endVal));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(endVal);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [endVal, duration, shouldStart]);

  return count;
}

export function LiveStatsSection({
  stats = {
    workersCount: 10000,
    countriesCount: 14,
    jobsCount: 17,
    successRate: 100,
  },
}: {
  stats?: LiveStatsData;
}) {
  const { language } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const workers = useCountUp(stats.workersCount || 10000, 2000, isVisible);
  const countries = useCountUp(stats.countriesCount || 14, 1500, isVisible);
  const jobs = useCountUp(stats.jobsCount || 17, 1500, isVisible);
  const rate = useCountUp(stats.successRate || 100, 1600, isVisible);

  const items = [
    {
      icon: <Users className="w-6 h-6 text-emerald-600" />,
      number: `${workers.toLocaleString()}+`,
      labelBn: 'আন্তর্জাতিক কর্মী সেবা',
      labelEn: 'Workers Recruited',
      descBn: 'সাফল্যের সাথে বিভিন্ন দেশে কর্মসংস্থান',
      descEn: 'Successfully placed in overseas careers',
      gradient: 'from-emerald-500/10 to-transparent',
    },
    {
      icon: <Globe2 className="w-6 h-6 text-navy-800" />,
      number: `${countries}+`,
      labelBn: 'গন্তব্য দেশসমূহ',
      labelEn: 'Destination Countries',
      descBn: 'মধ্যপ্রাচ্য, এশিয়া ও ইউরোপীয় দেশসমূহ',
      descEn: 'Middle East, Asia & European destinations',
      gradient: 'from-navy-600/10 to-transparent',
    },
    {
      icon: <BriefcaseBusiness className="w-6 h-6 text-gold-600" />,
      number: `${jobs}+`,
      labelBn: 'সক্রিয় সার্কুলার',
      labelEn: 'Active Opportunities',
      descBn: 'অনুমোদিত ও নিয়মিত হালনাগাদকৃত পদ',
      descEn: 'Verified & active overseas vacancies',
      gradient: 'from-gold-500/10 to-transparent',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      number: `${rate}%`,
      labelBn: 'পেশাদার ও বৈধ প্রক্রিয়া',
      labelEn: 'Professional Process',
      descBn: 'BMET ও সরকারি নীতিমালার শতভাগ অনুসরণ',
      descEn: '100% compliant with official regulations',
      gradient: 'from-emerald-500/10 to-transparent',
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative z-20 -mt-8 sm:-mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{
              transitionDelay: `${idx * 120}ms`,
            }}
          >
            {/* Background subtle tint */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${item.gradient} rounded-full -mr-10 -mt-10 pointer-events-none group-hover:scale-125 transition-transform duration-500`} />

            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 font-mono">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Live
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-mono tracking-tight">
                {item.number}
              </div>
              <div className="text-sm font-bold text-slate-800 font-bengali">
                {language === 'bn' ? item.labelBn : item.labelEn}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-bengali">
                {language === 'bn' ? item.descBn : item.descEn}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
