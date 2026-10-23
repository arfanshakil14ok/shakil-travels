'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { BRAND } from '@/config/brand';

interface FaqItem {
  question: string;
  answer: string;
}

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: 'বিদেশে চাকরি পেতে কী কী কাগজপত্র প্রয়োজন?',
      answer:
        'দেশ, চাকরি ও নিয়োগকর্তা অনুযায়ী প্রয়োজনীয় কাগজপত্র ভিন্ন হতে পারে। সাধারণত পাসপোর্ট, ছবি, শিক্ষাগত বা দক্ষতার সনদ এবং অন্যান্য নথি লাগতে পারে।',
    },
    {
      question: 'আপনারা কি চাকরি নিশ্চিত করেন?',
      answer:
        'চাকরি পাওয়া নির্ভর করে যাচাইকৃত নিয়োগের সুযোগ, প্রার্থীর যোগ্যতা এবং নিয়োগকর্তার শর্তের ওপর। আমরা প্রযোজ্য ক্ষেত্রে তথ্য ও প্রক্রিয়াগত সহযোগিতা দিতে পারি; চাকরি বা ভিসা নিশ্চিত করার নিশ্চয়তা দিই না।',
    },
    {
      question: 'বিদেশে যাওয়ার খরচ কত?',
      answer:
        'দেশ, চাকরি ও প্রযোজ্য প্রক্রিয়া অনুযায়ী খরচ ভিন্ন হয়। নির্দিষ্ট নিয়োগের শর্ত ও খরচের বিবরণ যাচাই করে সিদ্ধান্ত নিন।',
    },
    {
      question: 'প্রতারণা থেকে কীভাবে নিরাপদ থাকব?',
      answer:
        'নিয়োগকর্তা, চাকরির অফার, ভিসা এবং সংশ্লিষ্ট অনুমোদন যাচাই করুন। লিখিত চুক্তি ও অর্থ প্রদানের রসিদ সংরক্ষণ করুন। যাচাই ছাড়া কাউকে অর্থ প্রদান করবেন না।',
    },
    {
      question: 'নেত্রকোনা থেকে যোগাযোগ করা যাবে?',
      answer:
        'হ্যাঁ, প্রাথমিক তথ্য ও দিকনির্দেশনার জন্য আমাদের অফিসে যোগাযোগ করতে পারেন। আমাদের অফিস ইসলামপুর মোড়, ডায়াবেটিস হাসপাতালের সামনে, নেত্রকোনায় অবস্থিত।',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq-section" className="py-16 sm:py-24 bg-[#F8FAFC] border-b border-[#E4EAF1] font-bengali">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#102B50] bg-white px-3.5 py-1.5 rounded-full border border-[#CBDDF0] shadow-2xs">
            <HelpCircle className="w-4 h-4 text-[#24856A]" />
            <span>সচরাচর জিজ্ঞাসিত প্রশ্নাবলী</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#172B45] tracking-tight">
            সাধারণ প্রশ্নোত্তর (FAQ)
          </h2>
          <p className="text-xs sm:text-sm text-[#66758A] leading-relaxed max-w-xl mx-auto">
            বিদেশে কর্মসংস্থান ও আমাদের সেবা সংক্রান্ত প্রয়োজনীয় তথ্য জানতে নিচের উত্তরগুলো পড়ুন।
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#CBDDF0] overflow-hidden transition-all duration-200 shadow-2xs hover:border-[#102B50]"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full py-4 sm:py-5 px-5 sm:px-6 text-left flex items-center justify-between gap-4 transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-sm sm:text-base text-[#102B50] leading-snug">
                    প্রশ্ন: {faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isOpen ? 'bg-[#102B50] text-white' : 'bg-slate-100 text-[#66758A]'
                    }`}
                  >
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-[#475569] leading-relaxed border-t border-slate-100">
                    <p className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                      <strong>উত্তর:</strong> {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Banner */}
        <div className="mt-8 p-4 rounded-2xl bg-white border border-[#CBDDF0] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-[#66758A]">
          <div>
            অন্য কোনো বিষয়ে জানতে চান? আমাদের হটলাইনে সরাসরি কল করতে পারেন:
            <span className="font-mono font-bold text-[#102B50] ml-1.5">{BRAND.phone}</span>
            <span className="mx-1.5">|</span>
            <span className="font-mono font-bold text-[#102B50]">{BRAND.altPhone}</span>
          </div>
          <a
            href={BRAND.phoneTel}
            className="px-4 py-2 rounded-xl bg-[#102B50] hover:bg-[#0B1D35] text-white font-bold text-xs shrink-0 transition-colors"
          >
            কল করুন
          </a>
        </div>
      </div>
    </section>
  );
};
