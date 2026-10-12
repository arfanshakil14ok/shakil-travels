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
  Sparkles,
  MapPin,
  Globe2,
  Lock,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { POPULAR_COUNTRIES_NAV } from '@/lib/image-constants';
import { BRAND } from '@/config/brand';

export const HeroSection: React.FC = () => {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [activePhraseIndex, setActivePhraseIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  const animatedPhrases = [
    { text: '১০০% বৈধ ও নিরাপদ অভিবাসন', en: '100% Legal & Safe Migration', color: 'text-amber-400' },
    { text: 'সরকারি অনুমোদিত সরাসরি ভিসা', en: 'Govt. Approved Direct Visa', color: 'text-emerald-400' },
    { text: 'উচ্চ বেতন ও সম্মানজনক পেশা', en: 'High Salary & Verified Careers', color: 'text-cyan-400' },
    { text: 'স্মার্ট ভবিষ্যৎ ও অভিবাসী সুরক্ষা', en: 'Smart Future & Worker Welfare', color: 'text-gold-400' },
  ];

  useEffect(() => {
    setIsMounted(true);

    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setActivePhraseIndex((prev) => (prev + 1) % animatedPhrases.length);
        setFadeState('in');
      }, 400);
    }, 3200);

    return () => clearInterval(interval);
  }, [animatedPhrases.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (selectedCountry) params.set('country', selectedCountry);
    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-[#0B1D35] text-white py-12 sm:py-16 lg:py-20 border-b border-[#E4EAF1]/10">
      {/* Subtle Corporate Grid Ambient */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:24px_24px]" />

      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all duration-700 ease-out ${
          isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines, Primary/Secondary CTAs & Destinations */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Official License Trust Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white font-medium backdrop-blur-xs font-bengali">
              <ShieldCheck className="w-4 h-4 text-[#24856A] flex-shrink-0" />
              <span>{BRAND.name} • {BRAND.licenseNumber} (BMET অনুমোদিত)</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-[#E8A2C1] bg-white/10 px-2 py-0.5 rounded-full">
                ভেরিফাইড এজেন্সি
              </span>
            </div>

            {/* 2. Corporate Main Headline */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-bengali">
                আন্তর্জাতিক কর্মসংস্থান ও <br />
                <span className="text-[#E8A2C1]">
                  নির্ভরযোগ্য রিক্রুটমেন্ট সার্ভিস
                </span>
              </h1>
            </div>

            {/* 3. Supporting Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed font-bengali max-w-xl">
              সরকারি অনুমোদন ও শতভাগ স্বচ্ছ নিয়োগ প্রক্রিয়ায় মধ্যপ্রাচ্য, পূর্ব এশিয়া ও ইউরোপের অনুমোদিত কোম্পানিতে দক্ষ, আধাদক্ষ ও পেশাজীবীদের বৈদেশিক কর্মসংস্থান।
            </p>

            {/* 4. Primary & Secondary CTAs (Part A.4 requirement) */}
            <div className="flex flex-wrap items-center gap-3 pt-1 font-bengali">
              {/* Primary CTA: Find Jobs */}
              <Link href="/jobs">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Search className="w-4 h-4 text-white" aria-hidden="true" />}
                  className="font-bengali text-sm px-6 py-2.5 bg-[#102B50] hover:bg-[#172B45] text-white border border-[#E8A2C1]/40 font-bold shadow-md transition-all"
                >
                  চাকরি খুঁজুন
                </Button>
              </Link>

              {/* Secondary CTA: Register as Candidate */}
              <Link href="/portal/register">
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<UserPlus className="w-4 h-4 text-[#E8A2C1]" aria-hidden="true" />}
                  className="border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40 font-bengali text-sm px-6 py-2.5 font-semibold transition-all"
                >
                  প্রার্থী হিসেবে নিবন্ধন
                </Button>
              </Link>
            </div>

            {/* 5. Minimal Destination Chips with Flags */}
            <div className="pt-2 font-bengali">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-[#E8A2C1]" />
                <span>শীর্ষ কর্মসংস্থান গন্তব্য:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {POPULAR_COUNTRIES_NAV.slice(0, 7).map((c) => (
                  <Link
                    key={c.code}
                    href={`/jobs?country=${c.slug}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/25 text-xs font-medium text-slate-200 hover:text-white transition-all shadow-2xs"
                  >
                    <div className="relative w-4 h-3 rounded-xs overflow-hidden flex-shrink-0">
                      <Image src={c.flag} alt={c.name} fill className="object-cover" />
                    </div>
                    <span>{c.nameBn}</span>
                  </Link>
                ))}
                <Link
                  href="/countries"
                  className="text-xs font-semibold text-[#E8A2C1] hover:text-[#D987AC] inline-flex items-center gap-0.5 ml-1 transition-colors"
                >
                  সকল দেশ <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 6. Clean Trust Highlights with Verified Check Icons */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-white/10 text-xs text-slate-300 font-bengali">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#24856A] flex-shrink-0" />
                <span>BMET স্মার্ট কার্ড ছাড়পত্র</span>
              </div>

              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#24856A] flex-shrink-0" />
                <span>নির্ধারিত সরকারি অভিবাসন নিয়ম</span>
              </div>

              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#24856A] flex-shrink-0" />
                <span>সরাসরি বিদেশি নিয়োগকর্তার ডিমান্ড</span>
              </div>
            </div>
          </div>

          {/* Right Column: Search Desk & Direct Candidate Access */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none bg-[#102B50]/90 border border-white/15 rounded-xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10 font-bengali">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#24856A]" />
                  <span className="text-sm font-bold text-white">
                    বৈদেশিক সার্কুলার অনুসন্ধান
                  </span>
                </div>
                <span className="text-[10px] text-white/80 font-medium bg-white/10 px-2 py-0.5 rounded border border-white/15">
                  সরাসরি ডিমান্ড
                </span>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="mt-4 space-y-3 font-bengali">
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="পদের নাম (যেমন: ইলেকট্রিশিয়ান, ড্রাইভার, ওয়েল্ডার...)"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-[#0B1D35] border border-white/15 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-[#E8A2C1] focus:ring-1 focus:ring-[#E8A2C1] transition-all"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-[#0B1D35] border border-white/15 rounded-lg text-slate-200 focus:outline-none focus:border-[#E8A2C1] focus:ring-1 focus:ring-[#E8A2C1] appearance-none transition-all"
                    >
                      <option value="">সকল গন্তব্য দেশ (সৌদি, সিঙ্গাপুর, কাতার...)</option>
                      <option value="saudi-arabia">সৌদি আরব</option>
                      <option value="uae">সংযুক্ত আরব আমিরাত</option>
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
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5 text-[#102B50]" />}
                  className="w-full font-bold text-xs py-2 bg-[#E8A2C1] hover:bg-[#D987AC] text-[#102B50] shadow-2xs"
                >
                  সার্কুলার খুঁজুন
                </Button>
              </form>

              {/* Portal Actions */}
              <div className="mt-4 pt-3.5 border-t border-white/10 grid grid-cols-2 gap-2 font-bengali">
                <Link href="/portal/register" className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<UserPlus className="w-3.5 h-3.5 text-white" />}
                    className="w-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 py-1.5"
                  >
                    নতুন নিবন্ধন
                  </Button>
                </Link>

                <Link href="/portal/login" className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Lock className="w-3.5 h-3.5 text-slate-300" />}
                    className="w-full text-xs font-semibold bg-transparent hover:bg-white/10 text-slate-200 hover:text-white border border-white/15 py-1.5"
                  >
                    প্রার্থী লগইন
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
