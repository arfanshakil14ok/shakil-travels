'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  Award,
  Users,
  ShieldCheck,
  ArrowRight,
  FileCheck2,
  Sparkles,
  MapPin,
  Globe2,
  Lock,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { POPULAR_COUNTRIES_NAV } from '@/lib/image-constants';

export const HeroSection: React.FC = () => {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // 1st time opening reload / fresh mount trigger
    const isFirstOpen = !sessionStorage.getItem('shakil_hero_opened');
    if (isFirstOpen) {
      sessionStorage.setItem('shakil_hero_opened', '1');
    }
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (selectedCountry) params.set('country', selectedCountry);
    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-white py-10 sm:py-16 lg:py-20">
      {/* Subtle tech accents */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-1/4 -right-40 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-40 w-96 h-96 rounded-full bg-navy-700/30 blur-3xl pointer-events-none" />

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all duration-700 ease-out ${
        isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Minimal Headlines, CTAs & Quick Destinations */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            {/* Minimal Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800/90 border border-navy-700 text-xs text-gold-400 font-semibold shadow-xs font-bengali">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>RL-1234 • সরকারি অনুমোদিত রিক্রুটিং এজেন্সি</span>
            </div>

            {/* Minimal Punchy Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight text-white leading-[1.15] font-bengali">
              বিদেশে নিশ্চিত ক্যারিয়ার, নিরাপদ অভিবাসন
            </h1>

            {/* Minimal Single-Sentence Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed font-bengali max-w-xl">
              সরাসরি বিদেশী নিয়োগকর্তার চাহিদায় শতভাগ বৈধ ও নিরাপদ কর্মসংস্থান।
            </p>

            {/* Concise CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/jobs">
                <Button
                  variant="gold"
                  size="md"
                  leftIcon={<Search className="w-4 h-4 text-navy-950" aria-hidden="true" />}
                  className="font-bengali text-sm px-6 py-2.5 shadow-lg hover:shadow-gold-500/20 font-bold"
                >
                  চাকরি খুঁজুন
                </Button>
              </Link>

              <a href="#eligibility">
                <Button
                  variant="outline"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4 text-slate-300" aria-hidden="true" />}
                  className="border-slate-700 text-white hover:bg-navy-800/80 font-bengali text-sm px-6 py-2.5 font-semibold"
                >
                  যোগ্যতা যাচাই
                </Button>
              </a>
            </div>

            {/* Minimal Destination Chips with Flags */}
            <div className="pt-2 font-bengali">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>শীর্ষ গন্তব্য:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {POPULAR_COUNTRIES_NAV.slice(0, 7).map((c) => (
                  <Link
                    key={c.code}
                    href={`/jobs?country=${c.slug}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-850/80 hover:bg-emerald-950 border border-navy-700/80 hover:border-emerald-500/40 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-xs"
                  >
                    <div className="relative w-4 h-3 rounded-xs overflow-hidden flex-shrink-0">
                      <Image src={c.flag} alt={c.name} fill className="object-cover" />
                    </div>
                    <span>{c.nameBn}</span>
                  </Link>
                ))}
                <Link
                  href="/countries"
                  className="text-xs font-bold text-gold-400 hover:text-gold-300 hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  সকল দেশ <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Clean Trust Highlights */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-navy-800/80 text-xs text-slate-300 font-bengali">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>BMET স্মার্ট কার্ড ছাড়পত্র</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <span>স্বচ্ছ সরকারি ফি</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>প্রবাসী কল্যাণ সহায়তা</span>
              </div>
            </div>
          </div>

          {/* Right Column: Minimal Search Desk & Direct Portal Access */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none bg-navy-900/95 border border-navy-700/80 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
              {/* Card Header with Live Indicator */}
              <div className="flex items-center justify-between pb-3.5 border-b border-navy-800">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold text-white font-bengali">
                    বৈদেশিক নিয়োগ অনুসন্ধান
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                  সরাসরি নিয়োগ
                </span>
              </div>

              {/* Minimal Search Form */}
              <form onSubmit={handleSearch} className="mt-4 space-y-3 font-bengali">
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="পদের নাম (যেমন: ড্রাইভার, ওয়েল্ডার, ইলেকট্রিশিয়ান...)"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-navy-950 border border-navy-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-navy-950 border border-navy-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none"
                    >
                      <option value="">সকল দেশ (সৌদি, সিঙ্গাপুর, কাতার...)</option>
                      <option value="saudi-arabia">সৌদি আরব</option>
                      <option value="uae">সংযুক্ত আরব আমিরাত (দুবাই)</option>
                      <option value="qatar">কাতার</option>
                      <option value="kuwait">কুয়েত</option>
                      <option value="oman">ওমান</option>
                      <option value="singapore">সিঙ্গাপুর</option>
                      <option value="malaysia">মালয়েশিয়া</option>
                      <option value="japan">জাপান</option>
                      <option value="south-korea">দক্ষিণ কোরিয়া</option>
                      <option value="romania">রোমানিয়া</option>
                    </select>
                    <Globe2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="w-full font-bold text-xs py-2 shadow-xs"
                >
                  সার্কুলার খুঁজুন
                </Button>
              </form>

              {/* Minimal Portal Actions */}
              <div className="mt-4 pt-3 border-t border-navy-800 grid grid-cols-2 gap-2 font-bengali">
                <Link href="/portal/register" className="w-full">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<UserPlus className="w-3 h-3" />}
                    className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs py-1.5"
                  >
                    নতুন নিবন্ধন
                  </Button>
                </Link>

                <Link href="/portal/login" className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Lock className="w-3 h-3 text-slate-400" />}
                    className="w-full text-xs font-semibold border-navy-700 text-slate-200 hover:bg-navy-800 hover:text-white py-1.5"
                  >
                    পোর্টাল লগইন
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
