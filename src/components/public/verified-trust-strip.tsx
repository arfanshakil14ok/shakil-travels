'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, Award, Headphones, MapPin, Eye, Sparkles } from 'lucide-react';
import { BRAND } from '@/config/brand';

export const VerifiedTrustStrip: React.FC = () => {
  return (
    <div className="bg-white border-b border-[#E4EAF1] py-4 sm:py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 font-bengali">
          <div className="flex items-center gap-3 p-2 rounded-xl transition-all duration-300 hover:bg-[#F6F8FB] hover:-translate-y-0.5 group">
            <div className="w-10 h-10 rounded-lg bg-[#F6F8FB] group-hover:bg-emerald-50 border border-[#E4EAF1] group-hover:border-emerald-200 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
              <Award className="w-5 h-5 text-[#24856A] group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#172B45]">
                ৭ বছরের অভিজ্ঞতা
              </div>
              <div className="text-[11px] text-[#66758A]">
                বিদেশে কর্মসংস্থান প্রস্তুতিতে দিকনির্দেশনা
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl transition-all duration-300 hover:bg-[#F6F8FB] hover:-translate-y-0.5 group">
            <div className="w-10 h-10 rounded-lg bg-[#F6F8FB] group-hover:bg-blue-50 border border-[#E4EAF1] group-hover:border-blue-200 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
              <MapPin className="w-5 h-5 text-[#102B50] group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#172B45]">
                নেত্রকোনাকেন্দ্রিক সেবা
              </div>
              <div className="text-[11px] text-[#66758A]">
                স্থানীয় মানুষের বিশ্বস্ত পরামর্শক
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl transition-all duration-300 hover:bg-[#F6F8FB] hover:-translate-y-0.5 group">
            <div className="w-10 h-10 rounded-lg bg-[#F6F8FB] group-hover:bg-amber-50 border border-[#E4EAF1] group-hover:border-amber-200 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
              <Eye className="w-5 h-5 text-[#B7791F] group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#172B45]">
                স্বচ্ছ তথ্য ও দিকনির্দেশনা
              </div>
              <div className="text-[11px] text-[#66758A]">
                সঠিক প্রক্রিয়া ও দায়িত্বশীল সেবা
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl transition-all duration-300 hover:bg-[#F6F8FB] hover:-translate-y-0.5 group">
            <div className="w-10 h-10 rounded-lg bg-[#F6F8FB] group-hover:bg-emerald-50 border border-[#E4EAF1] group-hover:border-emerald-200 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
              <ShieldCheck className="w-5 h-5 text-[#24856A] group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#172B45]">
                নিরাপদ অভিবাসন
              </div>
              <div className="text-[11px] text-[#66758A]">
                হটলাইন: {BRAND.phone}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
