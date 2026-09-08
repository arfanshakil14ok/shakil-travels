import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BriefcaseBusiness, Stamp, CalendarCheck, ShieldCheck } from 'lucide-react';

export const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: <BriefcaseBusiness className="w-6 h-6 text-navy-900" />,
      title: 'আন্তর্জাতিক জনশক্তি নিয়োগ',
      description:
        'মধ্যপ্রাচ্য, দক্ষিণ-পূর্ব এশিয়া ও উন্নত দেশগুলোর খ্যাতিমান নিয়োগকর্তা কোম্পানির সরাসরি ভেরিফাইড ভিসা ও ডিমান্ড সংগ্রহ।',
    },
    {
      icon: <Stamp className="w-6 h-6 text-emerald-600" />,
      title: 'ভিসা ও ওয়ার্ক পারমিট প্রসেসিং',
      description:
        'এমবেসি সত্যায়ন, গামকা মেডিকেল টেস্ট, ওয়াকালা এবং বিএমইটি (BMET) স্মার্ট ইমিগ্রেশন কার্ড প্রক্রিয়াকরণ।',
    },
    {
      icon: <CalendarCheck className="w-6 h-6 text-gold-600" />,
      title: 'প্রাক-বহির্গমন ও কারিগরি প্রশিক্ষণ',
      description:
        'সংশ্লিষ্ট দেশের ভাষা, শ্রম আইন, কর্মক্ষেত্রের নিরাপত্তা ও কালচারাল ওরিয়েন্টেশন সম্পর্কিত বাস্তবমুখী দিকনির্দেশনা।',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-navy-900" />,
      title: 'প্রবাসী কল্যাণ ও লিগ্যাল সাপোর্ট',
      description:
        'গন্তব্য দেশে পৌঁছানোর পর এয়ারপোর্ট রিসিভিং, কোম্পানি যোগদান ও প্রবাসী কর্মীদের জরুরি কল্যাণ সহায়তা।',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-50 font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            আমাদের সেবাসমূহ
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            নিরাপদ ও নির্ভরযোগ্য আন্তর্জাতিক ক্যারিয়ার সার্ভিস
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            আবেদন থেকে শুরু করে প্রবাসে কর্মসংস্থান পর্যন্ত প্রতিটি পদক্ষেপে আমাদের অভিজ্ঞ টিম রয়েছে আপনার সাথে।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 border-slate-200">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  {service.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {service.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
