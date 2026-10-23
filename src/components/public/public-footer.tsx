'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Phone,
  Mail,
  Building2,
  CalendarDays,
  Lock,
  UserRound,
  FileText,
  UserPlus,
  HeartHandshake,
} from 'lucide-react';

import { BRAND } from '@/config/brand';
import { BrandLogo } from '@/components/brand/brand-logo';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-900 font-sans">
      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8">
          {/* Column 1: Brand & Positioning */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo href="/" size="lg" theme="light" variant="full" />

            <p className="text-xs text-slate-300 leading-relaxed font-bengali max-w-sm">
              বিদেশে কর্মসংস্থানসংক্রান্ত তথ্য, দিকনির্দেশনা এবং বৈধ প্রক্রিয়া সম্পর্কে সচেতন সহযোগিতা।
            </p>

            <div className="p-3.5 bg-navy-900/90 rounded-xl border border-navy-800 text-xs text-emerald-400 font-medium font-bengali space-y-1">
              <div className="flex items-center gap-2 font-bold text-white">
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                <span>৭ বছরের অভিজ্ঞতায় নেত্রকোনার পাশে</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                নেত্রকোনার মানুষের জন্য বিদেশে কর্মসংস্থানসংক্রান্ত তথ্য, সঠিক দিকনির্দেশনা ও বৈধ প্রক্রিয়ায় সহযোগিতা।
              </p>
            </div>
          </div>

          {/* Column 2: Relevant Links */}
          <div className="space-y-3 font-bengali">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              প্রয়োজনীয় লিংক
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  হোম
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  আমাদের সম্পর্কে
                </Link>
              </li>
              <li>
                <Link href="/#services-section" className="hover:text-white transition-colors">
                  আমাদের সেবাসমূহ
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="hover:text-white transition-colors">
                  চাকরির বিজ্ঞপ্তি
                </Link>
              </li>
              <li>
                <Link href="/countries" className="hover:text-white transition-colors">
                  গন্তব্য দেশসমূহ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  যোগাযোগ
                </Link>
              </li>
              <li>
                <Link href="/track" className="text-emerald-400 hover:text-white font-semibold transition-colors flex items-center gap-1">
                  <span>ফাইল ট্র্যাক</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Applicant Portal Links */}
          <div className="space-y-3 font-bengali">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              প্রার্থী কর্নার
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-sans">
              <li>
                <Link href="/portal/login" className="hover:text-white transition-colors flex items-center gap-1.5 font-bengali">
                  <UserRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>প্রার্থী লগইন</span>
                </Link>
              </li>
              <li>
                <Link href="/portal/register" className="hover:text-white transition-colors flex items-center gap-1.5 font-bengali">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>নতুন নিবন্ধন</span>
                </Link>
              </li>
              <li>
                <Link href="/portal/applications" className="hover:text-white transition-colors flex items-center gap-1.5 font-bengali">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>আবেদন অগ্রগতি</span>
                </Link>
              </li>
              <li>
                <Link href="/scam-awareness" className="text-rose-400 hover:text-rose-300 font-semibold transition-colors flex items-center gap-1.5 font-bengali">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                  <span>নিরাপদ অভিবাসন সচেতনতা</span>
                </Link>
              </li>
              <li className="pt-2 border-t border-navy-900">
                <Link href="/admin/login" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-[11px]">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>অফিস অ্যাডমিন লগইন</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Office Hours */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-bengali">
              কার্যালয় ও যোগাযোগ
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-bengali">{BRAND.addressBn}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="font-mono flex flex-col gap-0.5">
                  <a href={BRAND.phoneTel} className="hover:text-white transition-colors">
                    {BRAND.phone}
                  </a>
                  <a href={BRAND.altPhoneTel} className="hover:text-white transition-colors text-slate-400">
                    {BRAND.altPhone}
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`mailto:${BRAND.email}`} className="font-mono hover:text-white transition-colors">
                  {BRAND.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <CalendarDays className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-bengali">{BRAND.hoursBn}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Compliance Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-navy-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-sans">
          <p className="text-center md:text-left font-bengali">
            © {new Date().getFullYear()} {BRAND.name}. সর্বস্বত্ব সংরক্ষিত।
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bengali">
            <Link href="/" className="hover:text-slate-300 transition-colors">
              হোম
            </Link>
            <span>•</span>
            <Link href="/about" className="hover:text-slate-300 transition-colors">
              আমাদের সম্পর্কে
            </Link>
            <span>•</span>
            <Link href="/#services-section" className="hover:text-slate-300 transition-colors">
              আমাদের সেবাসমূহ
            </Link>
            <span>•</span>
            <Link href="/jobs" className="hover:text-slate-300 transition-colors">
              চাকরির বিজ্ঞপ্তি
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">
              যোগাযোগ
            </Link>
            <span>•</span>
            <Link href="/about" className="hover:text-slate-300 transition-colors">
              গোপনীয়তা নীতি
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">
              শর্তাবলি
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
