'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Phone,
  Mail,
  Building2,
  CalendarDays,
  ExternalLink,
  Lock,
  UserRound,
  FileText,
  CreditCard,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-900 font-sans">
      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8">
          {/* Column 1: Brand & Government Approval */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-navy-900 border border-navy-800 text-gold-400 flex items-center justify-center shadow-md">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-white uppercase tracking-tight font-sans">
                  Shakil Global Recruitment
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold font-bengali">
                  শাকিল গ্লোবাল রিক্রুটমেন্ট
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed font-bengali max-w-sm">
              বাংলাদেশ সরকার অনুমোদিত (RL-1234) আন্তর্জাতিক জনশক্তি রিক্রুটিং ও অভিবাসন কনসালটেন্সি। বৈধ প্রক্রিয়া, স্বচ্ছ খরচ ও প্রবাসীদের সর্বোচ্চ সুরক্ষায় আমরা প্রতিশ্রুতিবদ্ধ।
            </p>

            <div className="p-3 bg-navy-900/90 rounded-xl border border-navy-800 text-xs text-gold-400 font-medium font-bengali space-y-1">
              <div className="flex items-center gap-2 font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>সরকারি লাইসেন্স নম্বর: RL-1234</span>
              </div>
              <p className="text-[11px] text-slate-400">
                প্রবাসী কল্যাণ ও বৈদেশিক কর্মসংস্থান মন্ত্রণালয় এবং BMET কর্তৃক নিবন্ধিত।
              </p>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3 font-bengali">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              দ্রুত লিংক (Quick Links)
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/jobs" className="hover:text-white transition-colors">
                  চাকরি সার্কুলার (Jobs)
                </Link>
              </li>
              <li>
                <Link href="/countries" className="hover:text-white transition-colors">
                  গন্তব্য দেশসমূহ (Countries)
                </Link>
              </li>
              <li>
                <Link href="/visa-information" className="hover:text-white transition-colors">
                  ভিসা তথ্য (Visa Info)
                </Link>
              </li>
              <li>
                <Link href="/migrant-information" className="hover:text-white transition-colors">
                  প্রবাসী তথ্য (Migrant Info)
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  আমাদের সম্পর্কে (About Us)
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  যোগাযোগ (Contact)
                </Link>
              </li>
              <li>
                <Link href="/scam-awareness" className="text-rose-400 hover:text-rose-300 font-semibold transition-colors flex items-center gap-1">
                  প্রতারণা সতর্কতা (Scam Alert)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Applicant Portal Links */}
          <div className="space-y-3 font-bengali">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              প্রার্থী কর্নার (Applicant)
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-sans">
              <li>
                <Link href="/portal/login" className="hover:text-white transition-colors flex items-center gap-1.5 font-bengali">
                  <UserRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>প্রার্থী লগইন (Sign In)</span>
                </Link>
              </li>
              <li>
                <Link href="/portal/register" className="hover:text-white transition-colors flex items-center gap-1.5 font-bengali">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>অ্যাকাউন্ট খুলুন (Register)</span>
                </Link>
              </li>
              <li>
                <Link href="/portal/applications" className="hover:text-white transition-colors flex items-center gap-1.5 font-bengali">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>আমার আবেদনসমূহ (Applications)</span>
                </Link>
              </li>
              <li>
                <Link href="/portal/documents" className="hover:text-white transition-colors flex items-center gap-1.5 font-bengali">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>ডকুমেন্ট ও সনদ (Documents)</span>
                </Link>
              </li>
              <li>
                <Link href="/portal/payments" className="hover:text-white transition-colors flex items-center gap-1.5 font-bengali">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <span>পেমেন্ট ও চালান (Payments)</span>
                </Link>
              </li>
              <li className="pt-2 border-t border-navy-900">
                <Link href="/admin/login" className="text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-1.5 text-[11px]">
                  <Lock className="w-3 h-3 text-gold-400" />
                  <span>Staff ERP Login</span>
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
                <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="font-bengali">হাউস ১২, রোড ৪, সেক্টর ৭, উত্তরা, ঢাকা-১২৩০, বাংলাদেশ</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-mono">+880 2 9876543 / +880 1711-000000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-mono">info@shakilglobal.com</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CalendarDays className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="font-bengali">শনি - বৃহস্পতি: সকাল ৯:০০ - সন্ধ্যা ৬:০০ (শুক্রবার সাপ্তাহিক ছুটি)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Compliance Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-navy-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-sans">
          <p className="text-center md:text-left font-bengali">
            © {new Date().getFullYear()} Shakil Global Recruitment (RL-1234). সর্বস্বত্ব সংরক্ষিত।
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link href="/about" className="hover:text-slate-300 transition-colors font-bengali">
              গোপনীয়তা নীতি (Privacy Policy)
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-slate-300 transition-colors font-bengali">
              শর্তাবলী (Terms & Conditions)
            </Link>
            <span>•</span>
            <Link href="/scam-awareness" className="hover:text-slate-300 transition-colors font-bengali">
              আইনি দায়মুক্তি (Disclaimer)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
