'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  MapPin,
  Globe2,
  Lock,
  UserPlus,
  Briefcase,
  PhoneCall,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { POPULAR_COUNTRIES_NAV } from '@/lib/image-constants';
import { BRAND } from '@/config/brand';

export const HeroSection: React.FC = () => {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (selectedCountry) params.set('country', selectedCountry);
    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#EEF3F8] via-[#F5F8FA] to-[#EDF2F7] text-[#172B45] pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16 border-b border-[#E4EAF1]">
      {/* Subtle Architectural Dot Matrix Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,#000_60%,transparent_100%)]"
        aria-hidden="true"
      />

      {/* Gentle Executive Navy Radial Illumination */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-gradient-to-b from-[#102B50]/[0.07] via-[#102B50]/[0.03] to-transparent rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines, Trust Pill, Primary/Secondary CTAs & Destinations */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Official License Trust Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E4EAF1] shadow-2xs text-xs text-[#172B45] font-medium font-bengali">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#24856A] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#24856A]" />
              </span>
              <ShieldCheck className="w-4 h-4 text-[#24856A] flex-shrink-0" />
              <span className="font-semibold text-[#102B50]">{BRAND.name}</span>
              <span className="text-[#66758A]">•</span>
              <span>লাইসেন্স নং {BRAND.licenseNumber} (BMET অনুমোদিত)</span>
            </div>

            {/* 2. Corporate Main Headline */}
            <div className="space-y-2.5">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#102B50] leading-[1.22] font-bengali">
                আন্তর্জাতিক কর্মসংস্থান ও <br className="hidden sm:inline" />
                <span className="text-[#102B50] relative inline-block">
                  নির্ভরযোগ্য রিক্রুটমেন্ট সেবা
                  <span className="absolute bottom-1 left-0 w-full h-2 bg-[#E8A2C1]/35 -z-10 rounded-xs" />
                </span>
              </h1>
            </div>

            {/* 3. Supporting Subtitle */}
            <p className="text-sm sm:text-base text-[#66758A] font-normal leading-relaxed font-bengali max-w-xl">
              সরকারি অনুমোদন ও শতভাগ স্বচ্ছ প্রক্রিয়ায় মধ্যপ্রাচ্য, পূর্ব এশিয়া ও ইউরোপের অনুমোদিত কোম্পানিতে দক্ষ, আধাদক্ষ ও পেশাজীবীদের বৈদেশিক কর্মসংস্থান।
            </p>

            {/* 4. Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1 font-bengali">
              <Link href="/jobs">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Search className="w-4 h-4" />}
                  className="font-bengali text-sm px-6 py-2.5 bg-[#102B50] hover:bg-[#0B1D35] text-white rounded-xl font-bold shadow-xs hover:shadow transition-all duration-200 hover:-translate-y-0.5"
                >
                  চাকরি খুঁজুন
                </Button>
              </Link>

              <Link href="/portal/register">
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<UserPlus className="w-4 h-4 text-[#102B50]" />}
                  className="border border-[#E4EAF1] bg-white text-[#102B50] hover:bg-[#F6F8FB] hover:border-[#102B50]/30 font-bengali text-sm px-6 py-2.5 font-semibold rounded-xl shadow-2xs hover:-translate-y-0.5 transition-all duration-200"
                >
                  প্রার্থী হিসেবে নিবন্ধন
                </Button>
              </Link>
            </div>

            {/* 5. Minimal Destination Chips with Flags */}
            <div className="pt-2 font-bengali">
              <div className="text-[11px] text-[#66758A] font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <MapPin className="w-3.5 h-3.5 text-[#102B50]" />
                <span>শীর্ষ কর্মসংস্থান গন্তব্য:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {POPULAR_COUNTRIES_NAV.slice(0, 7).map((c) => (
                  <Link
                    key={c.code}
                    href={`/jobs?country=${c.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F6F8FB] border border-[#E4EAF1] hover:border-[#102B50]/30 text-xs font-medium text-[#172B45] hover:-translate-y-0.5 transition-all duration-200 shadow-2xs group"
                  >
                    <div className="relative w-4 h-3 rounded-xs overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                      <Image src={c.flag} alt={c.name} fill className="object-cover" />
                    </div>
                    <span>{c.nameBn}</span>
                  </Link>
                ))}
                <Link
                  href="/countries"
                  className="text-xs font-semibold text-[#102B50] hover:text-[#0B1D35] inline-flex items-center gap-0.5 ml-1 transition-colors hover:translate-x-0.5 duration-200"
                >
                  সকল দেশ <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 6. Clean Trust Highlights with Verified Check Icons */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-[#E4EAF1] text-xs text-[#66758A] font-bengali">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#24856A] flex-shrink-0" />
                <span>BMET স্মার্ট কার্ড ছাড়পত্র</span>
              </div>

              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#24856A] flex-shrink-0" />
                <span>সরাসরি কোম্পানি ডিমান্ড</span>
              </div>

              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#24856A] flex-shrink-0" />
                <span>দালাল ও গোপন চার্জমুক্ত</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Search Desk & Direct Candidate Access */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#E4EAF1] rounded-2xl p-6 sm:p-7 shadow-sm transition-all duration-300">
              {/* Card Header with Status Indicator */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E4EAF1] font-bengali">
                <div>
                  <h2 className="text-base font-bold text-[#102B50] flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#102B50]" />
                    বৈদেশিক সার্কুলার অনুসন্ধান
                  </h2>
                  <p className="text-xs text-[#66758A] mt-0.5">অনুমোদিত বৈদেশিক কোম্পানিতে সরাসরি নিয়োগ</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#24856A] text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#24856A] animate-pulse" />
                  আবেদন চালু
                </span>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="mt-5 space-y-3.5 font-bengali">
                <div>
                  <label className="block text-xs font-semibold text-[#172B45] mb-1.5">
                    পদের নাম বা ক্যাটাগরি
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="যেমন: ইলেকট্রিশিয়ান, ড্রাইভার, ওয়েল্ডার..."
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#F6F8FB] border border-[#E4EAF1] rounded-xl text-[#172B45] placeholder-[#66758A] focus:outline-none focus:border-[#102B50] focus:bg-white focus:ring-1 focus:ring-[#102B50] transition-all"
                    />
                    <Search className="w-4 h-4 text-[#66758A] absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B45] mb-1.5">
                    গন্তব্য দেশ
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#F6F8FB] border border-[#E4EAF1] rounded-xl text-[#172B45] focus:outline-none focus:border-[#102B50] focus:bg-white focus:ring-1 focus:ring-[#102B50] appearance-none transition-all cursor-pointer"
                    >
                      <option value="">সকল গন্তব্য দেশ (সৌদি, কাতার, সিঙ্গাপুর...)</option>
                      <option value="saudi-arabia">সৌদি আরব</option>
                      <option value="united-arab-emirates">সংযুক্ত আরব আমিরাত</option>
                      <option value="qatar">কাতার</option>
                      <option value="kuwait">কুয়েত</option>
                      <option value="oman">ওমান</option>
                      <option value="singapore">সিঙ্গাপুর</option>
                      <option value="malaysia">মালয়েশিয়া</option>
                      <option value="japan">জাপান</option>
                      <option value="south-korea">দক্ষিণ কোরিয়া</option>
                      <option value="romania">রোমানিয়া</option>
                    </select>
                    <Globe2 className="w-4 h-4 text-[#66758A] absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full font-bold text-sm py-2.5 bg-[#102B50] hover:bg-[#0B1D35] text-white rounded-xl shadow-xs transition-all"
                >
                  সার্কুলার খুঁজুন
                </Button>
              </form>

              {/* Portal Actions */}
              <div className="mt-5 pt-4 border-t border-[#E4EAF1] grid grid-cols-2 gap-2.5 font-bengali">
                <Link href="/portal/register" className="w-full">
                  <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#F6F8FB] hover:bg-[#E4EAF1]/60 text-xs font-semibold text-[#102B50] transition-colors border border-[#E4EAF1]">
                    <UserPlus className="w-3.5 h-3.5 text-[#102B50]" />
                    <span>নতুন নিবন্ধন</span>
                  </div>
                </Link>

                <Link href="/portal/login" className="w-full">
                  <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white hover:bg-[#F6F8FB] text-xs font-semibold text-[#66758A] hover:text-[#102B50] transition-colors border border-[#E4EAF1]">
                    <Lock className="w-3.5 h-3.5" />
                    <span>প্রার্থী লগইন</span>
                  </div>
                </Link>
              </div>

              {/* Verified recruitment micro-status */}
              <div className="mt-3.5 pt-3 border-t border-[#E4EAF1] flex items-center justify-between text-[11px] text-[#66758A] font-bengali">
                <span className="flex items-center gap-1 text-[#24856A]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  নিরাপদ ও স্বচ্ছ অভিবাসন
                </span>
                <a
                  href={BRAND.phoneTel}
                  className="font-semibold text-[#102B50] hover:underline flex items-center gap-1"
                >
                  <PhoneCall className="w-3 h-3 text-[#102B50]" />
                  {BRAND.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


