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
    <section className="relative overflow-hidden bg-[#0B1D35] text-white pt-10 sm:pt-14 lg:pt-18 pb-0 border-b border-[#E4EAF1]/10">
      {/* Animated Subtle Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#102B50] rounded-full blur-3xl opacity-50 animate-pulse-glow pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 bg-[#E8A2C1]/15 rounded-full blur-3xl opacity-40 animate-float pointer-events-none" />
      <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-[#24856A]/10 rounded-full blur-3xl opacity-30 animate-pulse-glow pointer-events-none" />
      
      {/* Subtle Corporate Grid Ambient */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Animated International Flight Network SVG Graphic */}
      <div className="absolute right-0 top-12 w-full lg:w-1/2 h-96 pointer-events-none opacity-20 overflow-hidden hidden md:block">
        <svg viewBox="0 0 600 350" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Flight Route 1: Dhaka -> Middle East */}
          <path d="M 60 260 Q 220 80 460 140" stroke="#E8A2C1" strokeWidth="1.5" strokeDasharray="6 6" className="animate-dash" />
          {/* Flight Route 2: Dhaka -> Southeast Asia */}
          <path d="M 60 260 Q 260 70 540 210" stroke="#24856A" strokeWidth="1.5" strokeDasharray="5 5" className="animate-dash" />
          {/* Flight Route 3: Dhaka -> Europe */}
          <path d="M 60 260 Q 200 160 400 270" stroke="#60A5FA" strokeWidth="1.2" strokeDasharray="4 4" className="animate-dash" />

          {/* Hub Node: Dhaka */}
          <circle cx="60" cy="260" r="7" fill="#24856A" className="animate-ping" opacity="0.6" />
          <circle cx="60" cy="260" r="4.5" fill="#24856A" />
          <text x="65" y="280" fill="#E4EAF1" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Dhaka (HQ)</text>

          {/* Hub Node: Middle East (Riyadh / Doha) */}
          <circle cx="460" cy="140" r="5" fill="#E8A2C1" />
          <circle cx="460" cy="140" r="10" stroke="#E8A2C1" strokeWidth="1" opacity="0.5" className="animate-pulse" />
          <text x="470" y="145" fill="#CBD5E1" fontSize="10" fontFamily="sans-serif">Middle East</text>

          {/* Hub Node: Singapore / Malaysia */}
          <circle cx="540" cy="210" r="4.5" fill="#4ADE80" />
          <circle cx="540" cy="210" r="9" stroke="#4ADE80" strokeWidth="1" opacity="0.5" className="animate-pulse" />
          <text x="475" y="235" fill="#CBD5E1" fontSize="10" fontFamily="sans-serif">East Asia</text>

          {/* Hub Node: Europe */}
          <circle cx="400" cy="270" r="4" fill="#60A5FA" />
          <text x="410" y="275" fill="#CBD5E1" fontSize="10" fontFamily="sans-serif">Europe</text>
        </svg>
      </div>

      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all duration-700 ease-out ${
          isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines, Dynamic Rotating Phrase, Primary/Secondary CTAs & Destinations */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Official License Trust Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white font-medium backdrop-blur-xs font-bengali hover:border-[#E8A2C1]/50 hover:bg-white/15 transition-all duration-300 group">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#24856A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#24856A]"></span>
              </span>
              <ShieldCheck className="w-4 h-4 text-[#24856A] flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
              <span>{BRAND.name} • {BRAND.licenseNumber} (BMET অনুমোদিত)</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-[#E8A2C1] bg-white/10 px-2 py-0.5 rounded-full">
                ভেরিফাইড এজেন্সি
              </span>
            </div>

            {/* 2. Corporate Main Headline + Dynamic Rotating Phrase */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-bengali">
                আন্তর্জাতিক কর্মসংস্থান ও <br />
                <span className="text-[#E8A2C1]">
                  নির্ভরযোগ্য রিক্রুটমেন্ট সার্ভিস
                </span>
              </h1>

              {/* Dynamic Animated Value Proposition Pill / Banner */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/10 border border-[#E8A2C1]/40 backdrop-blur-md transition-all duration-300 shadow-md">
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#24856A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#24856A]"></span>
                </span>
                <div className="overflow-hidden flex items-center min-h-[1.6rem]">
                  <span
                    className={`text-xs sm:text-sm font-bold font-bengali transition-all duration-500 transform ${
                      fadeState === 'in'
                        ? 'opacity-100 translate-y-0 text-white'
                        : 'opacity-0 -translate-y-2 text-white'
                    }`}
                  >
                    {animatedPhrases[activePhraseIndex].text}
                  </span>
                </div>
                <span className="hidden sm:inline-block text-[11px] font-mono text-[#E8A2C1] border-l border-white/20 pl-2.5">
                  {animatedPhrases[activePhraseIndex].en}
                </span>
              </div>
            </div>

            {/* 3. Supporting Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed font-bengali max-w-xl">
              সরকারি অনুমোদন ও শতভাগ স্বচ্ছ নিয়োগ প্রক্রিয়ায় মধ্যপ্রাচ্য, পূর্ব এশিয়া ও ইউরোপের অনুমোদিত কোম্পানিতে দক্ষ, আধাদক্ষ ও পেশাজীবীদের বৈদেশিক কর্মসংস্থান।
            </p>

            {/* 4. Primary & Secondary CTAs (Part A.4 requirement with micro-animations) */}
            <div className="flex flex-wrap items-center gap-3 pt-1 font-bengali">
              {/* Primary CTA: Find Jobs */}
              <Link href="/jobs" className="group">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Search className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />}
                  className="font-bengali text-sm px-6 py-2.5 bg-[#102B50] hover:bg-[#172B45] text-white border border-[#E8A2C1]/40 hover:border-[#E8A2C1] font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  চাকরি খুঁজুন
                </Button>
              </Link>

              {/* Secondary CTA: Register as Candidate */}
              <Link href="/portal/register" className="group">
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<UserPlus className="w-4 h-4 text-[#E8A2C1] group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />}
                  className="border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40 font-bengali text-sm px-6 py-2.5 font-semibold hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  প্রার্থী হিসেবে নিবন্ধন
                </Button>
              </Link>
            </div>

            {/* 5. Minimal Destination Chips with Flags & Hover Animations */}
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-[#E8A2C1]/40 text-xs font-medium text-slate-200 hover:text-white hover:-translate-y-0.5 transition-all duration-200 shadow-2xs group"
                  >
                    <div className="relative w-4 h-3 rounded-xs overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <Image src={c.flag} alt={c.name} fill className="object-cover" />
                    </div>
                    <span>{c.nameBn}</span>
                  </Link>
                ))}
                <Link
                  href="/countries"
                  className="text-xs font-semibold text-[#E8A2C1] hover:text-[#D987AC] inline-flex items-center gap-0.5 ml-1 transition-colors hover:translate-x-0.5 duration-200"
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

          {/* Right Column: Search Desk & Direct Candidate Access with Floating Elements */}
          <div className="lg:col-span-5 relative">
            {/* Floating Micro-Badge: Verified Visa Processing */}
            <div className="absolute -top-3.5 -left-3.5 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B1D35]/95 border border-[#24856A]/60 shadow-xl backdrop-blur-md animate-float z-20 font-bengali">
              <div className="w-6 h-6 rounded-lg bg-[#24856A]/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-[#24856A]" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-white leading-tight">১০০% ভেরিফাইড ভিসা</div>
                <div className="text-[9px] text-[#4ADE80]">BMET স্মার্টকার্ড অ্যাপ্রুভাল</div>
              </div>
            </div>

            {/* Floating Micro-Badge: Live Direct Interview */}
            <div className="absolute -bottom-3.5 -right-3.5 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B1D35]/95 border border-[#E8A2C1]/60 shadow-xl backdrop-blur-md animate-float-slow z-20 font-bengali">
              <div className="w-6 h-6 rounded-lg bg-[#E8A2C1]/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-[#E8A2C1] animate-spin-slow" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-white leading-tight">লাইভ রিক্রুটমেন্ট সক্রিয়</div>
                <div className="text-[9px] text-[#E8A2C1]">সরাসরি কোম্পানি ইন্টারভিউ</div>
              </div>
            </div>

            <div className="relative mx-auto max-w-md lg:max-w-none bg-[#102B50]/90 border border-white/15 rounded-xl p-5 sm:p-6 shadow-2xl backdrop-blur-md hover:border-white/25 transition-all duration-300">
              {/* Subtle Card Glow Top Edge */}
              <div className="absolute -top-px left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-[#E8A2C1]/70 to-transparent" />

              {/* Card Header with Animated Pulse Indicator */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10 font-bengali">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#24856A] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#24856A]"></span>
                  </span>
                  <span className="text-sm font-bold text-white">
                    বৈদেশিক সার্কুলার অনুসন্ধান
                  </span>
                </div>
                <span className="text-[10px] text-white/90 font-medium bg-white/10 px-2 py-0.5 rounded border border-white/15 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#E8A2C1]" />
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
                  rightIcon={<ArrowRight className="w-3.5 h-3.5 text-[#102B50] group-hover:translate-x-1 transition-transform" />}
                  className="w-full font-bold text-xs py-2 bg-[#E8A2C1] hover:bg-[#D987AC] text-[#102B50] shadow-2xs hover:shadow transition-all relative overflow-hidden group"
                >
                  <span className="absolute inset-0 w-1/2 h-full bg-white/30 transform -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />
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
                    className="w-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 py-1.5 transition-colors"
                  >
                    নতুন নিবন্ধন
                  </Button>
                </Link>

                <Link href="/portal/login" className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Lock className="w-3.5 h-3.5 text-slate-300" />}
                    className="w-full text-xs font-semibold bg-transparent hover:bg-white/10 text-slate-200 hover:text-white border border-white/15 py-1.5 transition-colors"
                  >
                    প্রার্থী লগইন
                  </Button>
                </Link>
              </div>

              {/* Floating verified recruitment micro-status */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300 font-bengali">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Sparkles className="w-3 h-3 text-[#E8A2C1] animate-pulse" />
                  লাইভ পোর্টাল স্ট্যাটাস
                </span>
                <span className="text-[#24856A] font-semibold flex items-center gap-1">
                  ● আবেদন প্রক্রিয়া চালু
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Live Recruitment Notice Ticker (Infinite Marquee) */}
      <div className="mt-10 sm:mt-12 py-2.5 border-t border-white/10 bg-white/[0.04] backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center overflow-hidden font-bengali">
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#24856A]/20 border border-[#24856A]/40 text-[#4ADE80] text-xs font-bold flex-shrink-0 z-10 mr-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#24856A]"></span>
            </span>
            <span>লাইভ আপডেট:</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap relative w-full text-xs text-slate-300">
            <div className="inline-block animate-marquee">
              <span className="mx-4">🔴 নতুন কোম্পানি ডিমান্ড: সৌদি আরব ও কাতার কনস্ট্রাকশন এবং টেকনিশিয়ান পদে নিয়োগ চলছে।</span>
              <span className="mx-4 text-[#E8A2C1]">•</span>
              <span className="mx-4">✅ BMET অনুমোদিত রিক্রুটমেন্ট এজেন্সি (লাইসেন্স নং: {BRAND.licenseNumber})।</span>
              <span className="mx-4 text-[#E8A2C1]">•</span>
              <span className="mx-4">🛡️ সরকারি ফি ছাড়া কোনো অতিরিক্ত অর্থ বা দালাল এড়িয়ে চলুন।</span>
              <span className="mx-4 text-[#E8A2C1]">•</span>
              <span className="mx-4">✈️ ইউরোপ ও পূর্ব এশিয়ার অনুমোদিত সার্কুলারে অনলাইন আবেদন চালু রয়েছে।</span>
              <span className="mx-4 text-[#E8A2C1]">•</span>
              <span className="mx-4">📞 হটলাইন: {BRAND.phone} • সরাসরি ক্যান্ডিডেট সহায়তা ডেস্ক।</span>
            </div>
            <div className="inline-block animate-marquee" aria-hidden="true">
              <span className="mx-4">🔴 নতুন কোম্পানি ডিমান্ড: সৌদি আরব ও কাতার কনস্ট্রাকশন এবং টেকনিশিয়ান পদে নিয়োগ চলছে।</span>
              <span className="mx-4 text-[#E8A2C1]">•</span>
              <span className="mx-4">✅ BMET অনুমোদিত রিক্রুটমেন্ট এজেন্সি (লাইসেন্স নং: {BRAND.licenseNumber})।</span>
              <span className="mx-4 text-[#E8A2C1]">•</span>
              <span className="mx-4">🛡️ সরকারি ফি ছাড়া কোনো অতিরিক্ত অর্থ বা দালাল এড়িয়ে চলুন।</span>
              <span className="mx-4 text-[#E8A2C1]">•</span>
              <span className="mx-4">✈️ ইউরোপ ও পূর্ব এশিয়ার অনুমোদিত সার্কুলারে অনলাইন আবেদন চালু রয়েছে।</span>
              <span className="mx-4 text-[#E8A2C1]">•</span>
              <span className="mx-4">📞 হটলাইন: {BRAND.phone} • সরাসরি ক্যান্ডিডেট সহায়তা ডেস্ক।</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

