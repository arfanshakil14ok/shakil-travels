import React from 'react';
import { ShieldCheck, Scale, BadgePercent, HeartHandshake } from 'lucide-react';

export const TrustSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-white font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            আমাদের প্রতিশ্রুতি
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            কেন শাকিল গ্লোবাল রিক্রুটমেন্ট আপনার সর্বোত্তম আস্থা?
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            আমরা বিশ্বাস করি একজন প্রবাসীর পাঠানো প্রতিটি বৈদেশিক মুদ্রা দেশের অর্থনীতির চাবিকাঠি।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">সরকারি লাইসেন্সপ্রাপ্ত</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              প্রবাসী কল্যাণ মন্ত্রণালয় ও বিএমইটি অনুমোদিত বৈধ রিক্রুটিং লাইসেন্সধারী এজেন্সি।
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-navy-50 text-navy-900 flex items-center justify-center mx-auto">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">নৈতিক নিয়োগ নীতি</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              আন্তর্জাতিক শ্রম সংস্থা (ILO) ও বৈশ্বিক মানদণ্ড মেনে সম্পূর্ণ অনৈতিক ফি মুক্ত নিয়োগ নিশ্চিত করি।
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gold-50 text-gold-600 flex items-center justify-center mx-auto">
              <BadgePercent className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">স্বচ্ছ খরচ তালিকা</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ভিসা, মেডিকেল ও টিকিটের নির্দিষ্ট খরচের সঠিক হিসেব ও সরকারি ভ্যাটযুক্ত ব্যাংক চালান প্রদান।
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center mx-auto">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">সার্বক্ষণিক জবাবদিহিতা</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              প্রবাসে অবস্থানকালীন যেকোনো কর্মসংস্থান সমস্যা বা আইনগত জটিলতায় আমাদের সার্বিক সহযোগিতা অব্যাহত থাকে।
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
