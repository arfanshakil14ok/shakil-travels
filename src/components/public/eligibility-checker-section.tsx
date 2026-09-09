'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Wrench,
  Clock,
  Globe2,
  Briefcase,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HERO_IMAGES } from '@/lib/image-constants';

export const EligibilityCheckerSection: React.FC = () => {
  const router = useRouter();

  const [education, setEducation] = useState('ssc');
  const [trade, setTrade] = useState('technical');
  const [experience, setExperience] = useState('1-3');
  const [destination, setDestination] = useState('gulf');
  const [showResult, setShowResult] = useState(false);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResult(true);
  };

  const handleExploreJobs = () => {
    router.push('/jobs');
  };

  return (
    <section id="eligibility" className="py-16 sm:py-24 bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Visual Assessment Card */}
          <div className="lg:col-span-7 space-y-6 font-bengali">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3.5 py-1.5 rounded-full border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>স্মার্ট ক্যারিয়ার অ্যাসেসমেন্ট</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              আপনি কোন চাকরির জন্য যোগ্য?
            </h2>

            <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-xl">
              আপনার শিক্ষাগত যোগ্যতা, পেশাগত কাজের অভিজ্ঞতা ও পছন্দের দেশ নির্বাচন করে তাৎক্ষণিক উপযুক্ত চাকরির সম্ভাবনা যাচাই করুন।
            </p>

            {/* Assessment Selector Form */}
            <form onSubmit={handleCheck} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              {/* Field 1: Education */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  ১. আপনার শিক্ষাগত যোগ্যতা:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'below_ssc', label: '৮ম শ্রেণি / সমমান' },
                    { id: 'ssc', label: 'এসএসসি (SSC)' },
                    { id: 'hsc', label: 'এইচএসসি (HSC)' },
                    { id: 'diploma', label: 'ডিপ্লোমা / স্নাতক' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => { setEducation(item.id); setShowResult(false); }}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        education === item.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Trade & Skills */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-navy-800" />
                  ২. কাজের দক্ষতা বা ট্রেড:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'driver', label: 'ড্রাইভার / অপারেটর' },
                    { id: 'technical', label: 'ইলেকট্রিশিয়ান / ওয়েল্ডার' },
                    { id: 'hospitality', label: 'হোটেল / রেস্তোরাঁ' },
                    { id: 'general', label: 'কেয়ারগিভার / সাধারণ' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => { setTrade(item.id); setShowResult(false); }}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        trade === item.id
                          ? 'bg-navy-50 border-navy-700 text-navy-900 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 3: Experience & Region (2-columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gold-600" />
                    ৩. কাজের অভিজ্ঞতা:
                  </label>
                  <select
                    value={experience}
                    onChange={(e) => { setExperience(e.target.value); setShowResult(false); }}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold"
                  >
                    <option value="fresher">কোনো পূর্ব অভিজ্ঞতা নেই (Fresher)</option>
                    <option value="1-3">১ থেকে ৩ বছর</option>
                    <option value="3-5">৩ থেকে ৫ বছর</option>
                    <option value="5+">৫ বছরের বেশি</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Globe2 className="w-4 h-4 text-emerald-600" />
                    ৪. পছন্দের অঞ্চল / গন্তব্য:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'gulf', label: 'সৌদি / আমিরাত / কাতার', flag: 'https://flagcdn.com/w80/sa.png' },
                      { id: 'asia', label: 'জাপান / দঃ কোরিয়া', flag: 'https://flagcdn.com/w80/jp.png' },
                      { id: 'se_asia', label: 'সিঙ্গাপুর / মালয়েশিয়া', flag: 'https://flagcdn.com/w80/sg.png' },
                      { id: 'europe', label: 'ইউরোপীয় ইউনিয়ন', flag: 'https://flagcdn.com/w80/ro.png' },
                    ].map((dest) => (
                      <button
                        type="button"
                        key={dest.id}
                        onClick={() => { setDestination(dest.id); setShowResult(false); }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                          destination === dest.id
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="relative w-4 h-3 rounded-xs overflow-hidden flex-shrink-0">
                          <Image src={dest.flag} alt="flag" fill className="object-cover" />
                        </div>
                        <span className="truncate text-[11px]">{dest.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  যোগ্যতা যাচাই করুন
                </Button>
              </div>

              {/* Instant Match Result Display */}
              {showResult && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    আপনার জন্য একাধিক উপযুক্ত নিয়োগ বিজ্ঞপ্তি সক্রিয় রয়েছে!
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    আপনার নির্বাচিত প্রোফাইল মানদণ্ডে অনুমোদিত কোম্পানিগুলোর সরাসরি ইন্টারভিউ ও সার্কুলার চলছে। এখনই তালিকাভুক্ত পদগুলো দেখে আবেদন করুন।
                  </p>
                  <div className="pt-2">
                    <Link href="/jobs">
                      <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
                        উপযুক্ত চাকরিগুলো দেখুন <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Column: Assessment Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative h-[380px] sm:h-[450px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900">
              <Image
                src={HERO_IMAGES.careerAssessment.src}
                alt={HERO_IMAGES.careerAssessment.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-900/30 to-transparent" />

              {/* Overlay Content */}
              <div className="absolute bottom-6 left-6 right-6 text-white font-bengali space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md text-[11px] font-semibold text-white">
                  <Briefcase className="w-3.5 h-3.5" />
                  সরাসরি কোম্পানি ইন্টারভিউ
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  সঠিক মূল্যায়নে সঠিক ক্যারিয়ার
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  আপনার প্রকৃত দক্ষতার ভিত্তিতেই আমরা উপযুক্ত বিদেশী কোম্পানির সাথে যোগাযোগ স্থাপন করি।
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
