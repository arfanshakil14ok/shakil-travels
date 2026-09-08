import React from 'react';
import Link from 'next/link';
import { ArrowRight, Search, ShieldCheck, CheckCircle2, Award, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-white py-20 sm:py-28">
      {/* Background accents */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-1/4 -right-40 w-96 h-96 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-40 w-96 h-96 rounded-full bg-navy-700/30 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Trust Badge Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-800/80 border border-navy-700 text-xs text-gold-400 font-semibold shadow-sm font-bengali">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>বাংলাদেশ সরকার অনুমোদিত বিশ্বস্ত অভিবাসন ও নিয়োগ সেবা</span>
          </div>

          {/* Primary Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-bengali">
            বিদেশে আপনার ক্যারিয়ারের নতুন সুযোগ शुरू হোক এখান থেকেই
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-xl text-slate-300 font-medium leading-relaxed font-bengali">
            চাকরি, নিয়োগ, ভিসা ও প্রবাস সংক্রান্ত প্রয়োজনীয় তথ্য—একটি নির্ভরযোগ্য প্ল্যাটফর্মে।
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link href="/jobs" className="w-full sm:w-auto">
              <Button
                variant="gold"
                size="lg"
                leftIcon={<Search className="w-4 h-4" aria-hidden="true" />}
                className="w-full sm:w-auto font-bengali text-base px-8 py-3.5 shadow-lg hover:shadow-gold-500/20"
              >
                চাকরি খুঁজুন
              </Button>
            </Link>

            <Link href="/contact" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
                className="w-full sm:w-auto border-slate-700 text-white hover:bg-navy-800 font-bengali text-base px-8 py-3.5"
              >
                যোগ্যতা যাচাই করুন
              </Button>
            </Link>
          </div>

          {/* Key Trust Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-10 border-t border-navy-800/80 text-left font-bengali">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">১০০% বৈধ প্রক্রিয়া</span>
                <span className="text-slate-400">সরকারি নিয়মে অনুমোদন</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-gold-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">স্বচ্ছ খরচ ও চুক্তি</span>
                <span className="text-slate-400">কোনো লুকায়িত ফি নেই</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5">
              <Users className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">প্রবাসী কল্যাণ সাপোর্ট</span>
                <span className="text-slate-400">গন্তব্যে পৌঁছানো পর্যন্ত পাশে</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
