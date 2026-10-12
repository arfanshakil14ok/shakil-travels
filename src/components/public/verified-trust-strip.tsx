'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, Award, Headphones } from 'lucide-react';
import { BRAND } from '@/config/brand';

export const VerifiedTrustStrip: React.FC = () => {
  return (
    <div className="bg-white border-b border-[#E4EAF1] py-4 sm:py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 font-bengali">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F6F8FB] border border-[#E4EAF1] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#24856A]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#172B45]">
                লাইসেন্স {BRAND.licenseNumber}
              </div>
              <div className="text-[11px] text-[#66758A]">
                BMET ও সরকার অনুমোদিত
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F6F8FB] border border-[#E4EAF1] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#102B50]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#172B45]">
                ভেরিফাইড নিয়োগকর্তা
              </div>
              <div className="text-[11px] text-[#66758A]">
                সরাসরি বৈদেশিক কোম্পানির ডিমান্ড
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F6F8FB] border border-[#E4EAF1] flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-[#B7791F]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#172B45]">
                স্বচ্ছ প্রসেসিং
              </div>
              <div className="text-[11px] text-[#66758A]">
                কোনো প্রকার গোপন চার্জ নেই
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F6F8FB] border border-[#E4EAF1] flex items-center justify-center flex-shrink-0">
              <Headphones className="w-5 h-5 text-[#102B50]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#172B45]">
                প্রার্থী সহায়তা হেল্পডেস্ক
              </div>
              <div className="text-[11px] text-[#66758A]">
                {BRAND.phone}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
