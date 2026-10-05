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
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-white py-12 sm:py-16 lg:py-24">
      {/* Dynamic Animated Ambient Glows */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px] animate-pulse" />
      <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="absolute -bottom-16 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />

      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all duration-1000 ease-out ${
          isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Animated Headlines, CTAs & Destinations */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Animated Trust Pill Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-850/90 border border-navy-700/90 text-xs text-gold-400 font-semibold shadow-md backdrop-blur-md font-bengali transition-all duration-700 delay-100 ${
                isMounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-bounce" />
              <span>{BRAND.licenseNumber} • সরকারি অনুমোদিত আন্তর্জাতিক রিক্রুটিং এজেন্সি</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.2 rounded-full border border-emerald-800/60">
                <Sparkles className="w-3 h-3 text-gold-400" /> ভেরিফাইড
              </span>
            </div>

            {/* 2. Main Animated Headline with Dynamic Rotating Phrase */}
            <div
              className={`space-y-2 transition-all duration-700 delay-200 ${
                isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight text-white leading-[1.15] font-bengali">
                বিদেশে নিশ্চিত ক্যারিয়ার, <br />
                <span className="relative inline-block min-h-[1.2em]">
                  <span
                    className={`inline-block font-black transition-all duration-500 ease-in-out transform ${
                      animatedPhrases[activePhraseIndex].color
                    } ${
                      fadeState === 'in'
                        ? 'opacity-100 translate-y-0 scale-100 blur-0'
                        : 'opacity-0 -translate-y-3 scale-95 blur-xs'
                    }`}
                  >
                    {animatedPhrases[activePhraseIndex].text}
                  </span>
                </span>
              </h1>
            </div>

            {/* 3. Animated Supporting Subtitle */}
            <p
              className={`text-sm sm:text-base text-slate-300 font-normal leading-relaxed font-bengali max-w-xl transition-all duration-700 delay-300 ${
                isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              সরাসরি বিদেশি নিয়োগকর্তার চাহিদায় শতভাগ স্বচ্ছ ও নির্ভরযোগ্য প্রক্রিয়ায় আপনার কাঙ্ক্ষিত দেশে কর্মসংস্থানের সুযোগ।
            </p>

            {/* 4. Animated Interactive CTAs */}
            <div
              className={`flex flex-wrap items-center gap-3 pt-1 transition-all duration-700 delay-400 ${
                isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              <Link href="/jobs">
                <Button
                  variant="gold"
                  size="md"
                  leftIcon={<Search className="w-4 h-4 text-navy-950" aria-hidden="true" />}
                  className="font-bengali text-sm px-6 py-2.5 shadow-xl hover:shadow-gold-500/25 font-bold hover:scale-105 transition-transform duration-200"
                >
                  চাকরি খুঁজুন
                </Button>
              </Link>

              <a href="#eligibility">
                <Button
                  variant="outline"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" aria-hidden="true" />}
                  className="border border-slate-700 bg-navy-900/60 text-white hover:bg-navy-800 hover:border-slate-500 font-bengali text-sm px-6 py-2.5 font-semibold transition-all group"
                >
                  যোগ্যতা যাচাই
                </Button>
              </a>
            </div>

            {/* 5. Minimal Destination Chips with Flags */}
            <div
              className={`pt-2 font-bengali transition-all duration-700 delay-500 ${
                isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>শীর্ষ কর্মসংস্থান গন্তব্য:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {POPULAR_COUNTRIES_NAV.slice(0, 7).map((c) => (
                  <Link
                    key={c.code}
                    href={`/jobs?country=${c.slug}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-850/80 hover:bg-emerald-950 border border-navy-700/80 hover:border-emerald-500/40 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-xs hover:-translate-y-0.5"
                  >
                    <div className="relative w-4 h-3 rounded-xs overflow-hidden flex-shrink-0">
                      <Image src={c.flag} alt={c.name} fill className="object-cover" />
                    </div>
                    <span>{c.nameBn}</span>
                  </Link>
                ))}
                <Link
                  href="/countries"
                  className="text-xs font-bold text-gold-400 hover:text-gold-300 hover:underline inline-flex items-center gap-0.5 ml-1 transition-colors"
                >
                  সকল দেশ <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 6. Clean Trust Highlights with Check Icons */}
            <div
              className={`flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-navy-800/80 text-xs text-slate-300 font-bengali transition-all duration-700 delay-600 ${
                isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              <div className="flex items-center gap-1.5 hover:text-emerald-300 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>BMET স্মার্ট কার্ড ছাড়পত্র</span>
              </div>

              <div className="flex items-center gap-1.5 hover:text-gold-300 transition-colors">
                <Award className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <span>স্বচ্ছ সরকারি ফি</span>
              </div>

              <div className="flex items-center gap-1.5 hover:text-emerald-300 transition-colors">
                <Users className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>প্রবাসী কল্যাণ সহায়তা</span>
              </div>
            </div>
          </div>

          {/* Right Column: Search Desk & Direct Portal Access */}
          <div
            className={`lg:col-span-5 relative transition-all duration-1000 delay-300 ${
              isMounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'
            }`}
          >
            <div className="relative mx-auto max-w-md lg:max-w-none bg-navy-900/95 border border-navy-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md hover:border-emerald-500/30 transition-all">
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
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-gold-400" /> সরাসরি নিয়োগ
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
                      placeholder="পদের নাম (যেমন: ড্রাইভার, ওয়েল্ডার, ইলেকট্রিশিয়ান...)"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-navy-950 border border-navy-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-navy-950 border border-navy-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none transition-all"
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
                  className="w-full font-bold text-xs py-2 shadow-xs hover:shadow-gold-500/20"
                >
                  সার্কুলার খুঁজুন
                </Button>
              </form>

              {/* Portal Actions */}
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
                    className="w-full text-xs font-semibold border border-navy-700 bg-navy-900/80 text-slate-200 hover:bg-navy-800 hover:text-white py-1.5"
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
