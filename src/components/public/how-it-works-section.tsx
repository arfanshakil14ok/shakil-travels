import React from 'react';
import { UserPlus, ClipboardCheck, CalendarCheck, Stamp, Plane } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '০১',
      title: 'নিবন্ধন ও ডকুমেন্ট জমা',
      desc: 'পাসপোর্ট, জাতীয় পরিচয়পত্র ও প্রয়োজনীয় শিক্ষাগত ও কাজের সনদ সহ অফিসে বা অনলাইনে আবেদন করুন।',
      icon: <UserPlus className="w-5 h-5 text-navy-900" />,
    },
    {
      step: '০২',
      title: 'দক্ষতা ও ট্রেড যাচাইকরণ',
      desc: 'কাজের ধরন অনুযায়ী বাস্তব কারিগরি পরীক্ষা ও স্বাস্থ্যগত প্রাথমিক পরামর্শ গ্রহণ।',
      icon: <ClipboardCheck className="w-5 h-5 text-emerald-600" />,
    },
    {
      step: '০৩',
      title: 'নিয়োগকর্তার ইন্টারভিউ',
      desc: 'সংশ্লিষ্ট দেশের কোম্পানি প্রতিনিধিদের সরাসরি বা ভার্চুয়াল ইন্টারভিউতে অংশগ্রহণ ও নির্বাচন।',
      icon: <CalendarCheck className="w-5 h-5 text-gold-600" />,
    },
    {
      step: '০৪',
      title: 'ভিসা ও বিএমইটি ছাড়পত্র',
      desc: 'অনুমোদিত ভিসা স্ট্যাম্পিং, সরকারি প্রবাসী কল্যাণ কার্ড ও বিএমইটি ইমিগ্রেশন ছাড়পত্র সম্পন্নকরণ।',
      icon: <Stamp className="w-5 h-5 text-navy-900" />,
    },
    {
      step: '০৫',
      title: 'নিরাপদ যাত্রা ও কর্মক্ষেত্রে যোগদান',
      desc: 'প্রাক-ফ্লাইট ব্রিফিং, এয়ার টিকিট প্রদান এবং গন্তব্যে পৌঁছানোর পর কোম্পানিতে যোগদান নিশ্চিতকরণ।',
      icon: <Plane className="w-5 h-5 text-emerald-600" />,
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-800 bg-navy-50 px-3 py-1 rounded-full border border-navy-200">
            স্বচ্ছ কার্যপ্রণালী
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            কীভাবে আমরা বৈধভাবে আপনার বিদেশে কর্মসংস্থান নিশ্চিত করি
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            ধাপে ধাপে সরকারি নিয়ম অনুযায়ী সম্পূর্ণ স্বচ্ছ ও দুর্নীতিমুক্ত প্রক্রিয়াকরণ।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="relative p-6 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-300 font-sans">{item.step}</span>
                  <div className="w-10 h-10 rounded-lg bg-white shadow-xs border border-slate-200 flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
