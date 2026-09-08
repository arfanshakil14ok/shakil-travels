import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Phone, Mail, Building2, CalendarDays } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-900">
      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy-900 border border-navy-800 text-gold-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="font-bold text-sm text-white uppercase tracking-tight">
                Shakil Global Recruitment
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-bengali">
              বাংলাদেশ সরকারের অনুমোদিত বৈধ ও স্বচ্ছ উপায়ে দক্ষ, আধা-দক্ষ ও পেশাজীবী জনশক্তি বিদেশে কর্মসংস্থানে নিয়োজিত একটি অগ্রগামী প্রতিষ্ঠান।
            </p>
            <div className="pt-2 text-xs text-gold-400 font-medium">
              গভর্নমেন্ট রিক্রুটিং লাইসেন্স: অনুমোদিত আর.এল (Govt. RL Approved)
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 font-bengali">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">দ্রুত লিংক</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/jobs" className="hover:text-white transition-colors">
                  আন্তর্জাতিক চাকরির খবর
                </Link>
              </li>
              <li>
                <Link href="/countries" className="hover:text-white transition-colors">
                  গন্তব্য দেশসমূহ
                </Link>
              </li>
              <li>
                <Link href="/visa-info" className="hover:text-white transition-colors">
                  ভিসা আবেদন নির্দেশিকা
                </Link>
              </li>
              <li>
                <Link href="/migrant-info" className="hover:text-white transition-colors">
                  প্রবাসী কল্যাণ ও অধিকার
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  আমাদের লক্ষ্য ও স্বচ্ছতা নীতি
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-bengali">
              প্রধান কার্যালয় ও যোগাযোগ
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>হাউস ১২, রোড ৪, সেক্টর ৭, উত্তরা, ঢাকা-১২৩০, বাংলাদেশ</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>হটলাইন: +880 2 9876543 / +880 1711-000000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>ইমেইল: info@shakilglobal.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>শনি - বৃহস্পতি: সকাল ৯:০০ - সন্ধ্যা ৬:০০ (শুক্রবার বন্ধ)</span>
              </li>
            </ul>
          </div>

          {/* Verification & Trust */}
          <div className="space-y-3 font-bengali">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">স্বচ্ছ অভিবাসন অঙ্গীকার</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              শাকিল গ্লোবাল রিক্রুটমেন্ট কোনো প্রকার মধ্যস্বত্বভোগী বা অবৈধ দালাল সমর্থন করে না। সকল আর্থিক লেনদেনের মানি রিসিট গ্রহণ করুন।
            </p>
            <div className="p-3 bg-navy-900 rounded-lg border border-navy-800 text-[11px] text-slate-300">
              সন্দেহজনক কোনো লেনদেনের ক্ষেত্রে অবিলম্বে আমাদের কেন্দ্রীয় হেল্পলাইনে রিপোর্ট করুন।
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-navy-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 SHAKIL GLOBAL RECRUITMENT. সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-slate-300 transition-colors">
              গোপনীয়তা নীতি
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">
              শর্তাবলী
            </Link>
            <span>•</span>
            <Link href="/admin/login" className="text-gold-400 hover:text-gold-300 font-semibold">
              ERP এডমিন পোর্টাল
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
