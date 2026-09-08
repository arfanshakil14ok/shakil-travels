import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileCheck, PhoneCall, ArrowRight } from 'lucide-react';

export const MigrantInfoSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-navy-950 text-white font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-navy-900 px-3 py-1 rounded-full border border-navy-800">
            প্রবাসী কল্যাণ ও সচেতনতা
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 leading-tight">
            নিরাপদ অভিবাসনের জন্য করণীয় ও অপরিহার্য পরামর্শ
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            প্রতারণা ও অতিরিক্ত আর্থিক ক্ষতি থেকে নিজেকে এবং আপনার পরিবারকে সুরক্ষিত রাখুন।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Card className="bg-navy-900 border-navy-800 text-slate-200">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-navy-800 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">দালাল ও মধ্যস্বত্বভোগী পরিহার</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                কোনো মধ্যস্থতাকারীর হাতে পাসপোর্ট বা নগদ অর্থ তুলে দেবেন না। সরাসরি অনুমোদিত রিক্রুটিং এজেন্সির অফিসিয়াল একাউন্টে লেনদেন করুন এবং মানি রিসিট সংরক্ষণ করুন।
              </p>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="bg-navy-900 border-navy-800 text-slate-200">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-navy-800 text-emerald-400 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">ভিসা ও চুক্তিপত্র যাচাই</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                উড়োজাহাজের টিকিট কাটার আগে বিএমইটি (BMET) ডাটাবেজে আপনার ভিসা সত্যায়ন হয়েছে কি না নিশ্চিত করুন। চাকরির বেতন ও সুযোগ-সুবিধা লিখিত চুক্তিতে দেখে নিন।
              </p>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="bg-navy-900 border-navy-800 text-slate-200">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-navy-800 text-gold-400 flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">জরুরি হেল্পলাইন নম্বর</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                প্রবাসী কল্যাণ মন্ত্রণালয় ও বৈদেশিক কর্মসংস্থান অধিদপ্তরের সার্বক্ষণিক হেল্পলাইন ১৬১৩৫ (টোল ফ্রি) অথবা আমাদের হেল্পলাইনে প্রয়োজনে যোগাযোগ করুন।
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center sm:text-left">
          <Link href="/migrant-info">
            <Button
              variant="outline"
              size="sm"
              className="border-navy-700 text-slate-200 hover:bg-navy-900"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              বিস্তারিত প্রবাসী নির্দেশিকা পড়ুন
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
