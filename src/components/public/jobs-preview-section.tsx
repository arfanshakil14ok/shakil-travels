import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BriefcaseBusiness, MapPin, DollarSign, Clock, ArrowRight } from 'lucide-react';

export const JobsPreviewSection: React.FC = () => {
  const sampleJobs = [
    {
      title: 'হেভি ইকুইপমেন্ট ও ক্রেন অপারেটর',
      country: 'সৌদি আরব (রিয়াদ)',
      salary: '২,৫০০ - ৩,২০০ এসএআর (SAR)',
      experience: '৩ বছরের বাস্তব অভিজ্ঞতা আবশ্যক',
      vacancies: '১৫ জন',
    },
    {
      title: 'হোটেল ও হসপিটালিটি সার্ভিস ক্রু',
      country: 'সংযুক্ত আরব আমিরাত (দুবাই)',
      salary: '১,৮০০ - ২,২০০ এইডি (AED)',
      experience: 'ইংরেজি কথোপকথন ও গ্রাহকসেবা অভিজ্ঞতা',
      vacancies: '২০ জন',
    },
    {
      title: 'ইন্ডাস্ট্রিয়াল ইলেকট্রিশিয়ান ও টেকনিশিয়ান',
      country: 'কাতার (দোহা)',
      salary: '২,২০০ - ২,৮০০ কিউএআর (QAR)',
      experience: 'কারিগরি ডিপ্লোমা ও সংশ্লিষ্ট কাজের সনদ',
      vacancies: '১০ জন',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-50 font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              সর্বশেষ চাকরির খবর
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              চলমান আন্তর্জাতিক নিয়োগ বিজ্ঞপ্তি
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              স্বনামধন্য বৈদেশিক কোম্পানির সরাসরি অনুমোদিত ডিমান্ড ও ইন্টারভিউ শিডিউল।
            </p>
          </div>
          <Link href="/jobs">
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              সকল চাকরি দেখুন
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleJobs.map((job, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow bg-white">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center">
                    <BriefcaseBusiness className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-navy-50 text-navy-900">
                    পদসংখ্যা: {job.vacancies}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{job.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.country}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> আনুমানিক বেতন:
                    </span>
                    <span className="font-bold text-emerald-700">{job.salary}</span>
                  </div>

                  <div className="flex items-start justify-between text-slate-700">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> যোগ্যতা:
                    </span>
                    <span className="text-right text-slate-600">{job.experience}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/contact">
                    <Button variant="primary" size="sm" className="w-full">
                      আবেদন করুন
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
