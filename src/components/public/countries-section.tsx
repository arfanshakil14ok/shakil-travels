import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Globe2, ArrowRight } from 'lucide-react';

export const CountriesSection: React.FC = () => {
  const countries = [
    {
      name: 'সৌদি আরব (Saudi Arabia)',
      code: 'SA',
      categories: 'কনস্ট্রাকশন, ড্রাইভিং, টেকনিক্যাল, সার্ভিস',
      status: 'নিয়মিত ডিমান্ড চলছে',
      flag: '🇸🇦',
    },
    {
      name: 'সংযুক্ত আরব আমিরাত (UAE)',
      code: 'AE',
      categories: 'হসপিটালিটি, সিকিউরিটি, মেকানিক্যাল, লজিস্টিকস',
      status: 'ভিসা ইস্যু সক্রিয়',
      flag: '🇦🇪',
    },
    {
      name: 'কাতার (Qatar)',
      code: 'QA',
      categories: 'ইঞ্জিনিয়ারিং, ক্যাটারিং, টেকনিশিয়ান, জেনারেল ওয়ার্কার',
      status: 'কোটা ভিত্তিক নিয়োগ',
      flag: '🇶🇦',
    },
    {
      name: 'কুয়েত (Kuwait)',
      code: 'KW',
      categories: 'মেডিকেল স্টাফ, নার্সিং, অটোমোবাইল, টেকনিক্যাল',
      status: 'দক্ষ জনবল অগ্রাধিকার',
      flag: '🇰🇼',
    },
    {
      name: 'ওমান (Oman)',
      code: 'OM',
      categories: 'নির্মাণ শ্রমিক, ফ্যাক্টরি কর্মী, ওয়েল্ডার, ইলেকট্রিশিয়ান',
      status: 'নিয়মিত বাছাই পর্ব',
      flag: '🇴🇲',
    },
    {
      name: 'মালয়েশিয়া (Malaysia)',
      code: 'MY',
      categories: 'ম্যানুফ্যাকচারিং, প্ল্যান্টেশন, কনস্ট্রাকশন, সার্ভিস',
      status: 'সরকারি বিএমইটি প্রক্রিয়াকরণ',
      flag: '🇲🇾',
    },
    {
      name: 'সিঙ্গাপুর (Singapore)',
      code: 'SG',
      categories: 'শিপইয়ার্ড, সার্টিফাইড কন্সট্রাকশন, প্রসেস প্ল্যান্ট',
      status: 'বিসিএ ও টিআইটিপি সার্টিফাইড',
      flag: '🇸🇬',
    },
    {
      name: 'জাপান (Japan)',
      code: 'JP',
      categories: 'এসএসডব্লিউ (SSW), কেয়ারগিভার, কৃষি, ফুড সার্ভিসেস',
      status: 'ভাষা দক্ষতা আবশ্যক (N4/JFT)',
      flag: '🇯🇵',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-navy-800 bg-navy-50 px-3 py-1 rounded-full border border-navy-200">
              প্রধান গন্তব্য দেশসমূহ
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              যেসব দেশে আমাদের নিয়মিত কর্মসংস্থান সুযোগ রয়েছে
            </h2>
          </div>
          <Link
            href="/countries"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-900 hover:text-emerald-700 transition-colors"
          >
            <span>সকল দেশের নিয়মাবলী দেখুন</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {countries.map((c, i) => (
            <Card key={i} className="hover:border-navy-900/40 hover:shadow-md transition-all">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{c.flag}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {c.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    <span className="font-semibold text-slate-700">ক্যাটাগরি:</span> {c.categories}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
