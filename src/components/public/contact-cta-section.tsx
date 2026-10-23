'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import {
  Phone,
  Mail,
  MapPin,
  Send,
  Search,
  UserPlus,
  Sparkles,
  ShieldCheck,
  Clock,
  PhoneCall,
} from 'lucide-react';
import { BRAND } from '@/config/brand';

export const ContactCtaSection: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [destination, setDestination] = useState('Saudi Arabia');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const subject = `পরামর্শ ও কর্মসংস্থান প্রস্তুতি (${destination})`;
      const fullMessage = message.trim()
        ? `আগ্রহী দেশ: ${destination}\n\nবার্তা:\n${message.trim()}`
        : `প্রার্থী ${destination} দেশে কর্মসংস্থানের জন্য প্রাথমিক পরামর্শ ও যোগ্যতা সংক্রান্ত দিকনির্দেশনা চেয়েছেন।`;

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          subject,
          message: fullMessage,
          source: 'WEBSITE_CONTACT',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit inquiry');
      }

      setIsSubmitted(true);
      setName('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'বার্তা পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে সরাসরি আমাদের নম্বরে কল করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact-cta" className="py-16 sm:py-24 bg-slate-50 font-sans border-b border-[#E4EAF1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#102B50] via-[#1E3A8A] to-[#102B50] p-8 sm:p-12 lg:p-16 text-white border border-[#1E3A8A] shadow-2xl font-bengali">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#CBDDF0_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-emerald-300 font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>৭ বছরের অভিজ্ঞতায় নেত্রকোনার মানুষের পাশে</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              আপনার বিদেশে কর্মসংস্থানের প্রস্তুতি শুরু হোক আজই
            </h2>

            <p className="text-sm sm:text-base text-slate-200 font-normal leading-relaxed max-w-2xl mx-auto">
              চাকরির সুযোগ, প্রয়োজনীয় কাগজপত্র এবং বিদেশে কর্মসংস্থানসংক্রান্ত তথ্য জানতে আমাদের সঙ্গে যোগাযোগ করুন।
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <a href={BRAND.phoneTel} className="w-full sm:w-auto">
                <Button
                  variant="gold"
                  size="lg"
                  leftIcon={<PhoneCall className="w-4 h-4 text-[#102B50]" />}
                  className="w-full sm:w-auto font-bold text-sm sm:text-base px-8 py-3.5 shadow-lg bg-amber-400 hover:bg-amber-300 text-[#102B50]"
                >
                  এখনই যোগাযোগ করুন
                </Button>
              </a>

              <Link href="/jobs" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Search className="w-4 h-4 text-white" />}
                  className="w-full sm:w-auto bg-[#24856A] hover:bg-[#1D6C56] text-white font-bold text-sm sm:text-base px-8 py-3.5 shadow-lg"
                >
                  চাকরির সুযোগ দেখুন
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Information & Inquiry Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start font-bengali">
          {/* Left info */}
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#24856A] bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200">
              যোগাযোগ ও অফিস
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#102B50] leading-tight">
              আপনার বিদেশে কর্মসংস্থানের প্রস্তুতি শুরু হোক আজই
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              চাকরির সুযোগ, প্রয়োজনীয় কাগজপত্র এবং বিদেশে কর্মসংস্থানসংক্রান্ত তথ্য জানতে আমাদের সঙ্গে যোগাযোগ করুন। নেত্রকোনা অফিসে সরাসরি সাক্ষাত করতে পারেন অথবা ফোনে যোগাযোগ করুন।
            </p>

            <div className="space-y-4 pt-2 text-xs text-slate-700 font-sans">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#CBDDF0] flex items-center justify-center text-[#24856A] shadow-xs shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block text-[#102B50] font-bengali">অফিস ঠিকানা:</span>
                  <span className="font-bengali text-slate-700 text-sm leading-relaxed block">
                    {BRAND.addressBn}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#CBDDF0] flex items-center justify-center text-[#24856A] shadow-xs shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block text-[#102B50] font-bengali">ফোন নম্বর:</span>
                  <div className="flex flex-wrap items-center gap-3 pt-0.5">
                    <a
                      href={BRAND.phoneTel}
                      className="font-mono text-[#102B50] hover:text-[#24856A] font-bold text-sm"
                    >
                      {BRAND.phone}
                    </a>
                    <span className="text-slate-300">•</span>
                    <a
                      href={BRAND.altPhoneTel}
                      className="font-mono text-[#102B50] hover:text-[#24856A] font-bold text-sm"
                    >
                      {BRAND.altPhone}
                    </a>
                  </div>
                  <span className="text-[11px] text-slate-500 block font-bengali mt-0.5">
                    সরাসরি কথা বলতে বা পরামর্শের জন্য কল করুন
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#CBDDF0] flex items-center justify-center text-[#24856A] shadow-xs shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block text-[#102B50] font-bengali">ইমেইল:</span>
                  <a href={`mailto:${BRAND.email}`} className="font-mono text-slate-700 hover:text-[#102B50] text-sm">
                    {BRAND.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#CBDDF0] flex items-center justify-center text-[#24856A] shadow-xs shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block text-[#102B50] font-bengali">অফিস সময়সূচী:</span>
                  <span className="font-bengali text-slate-700">{BRAND.hoursBn}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right inquiry form */}
          <Card className="shadow-xl border-[#CBDDF0] bg-white rounded-2xl">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-lg font-bold text-[#102B50] mb-1">
                পরামর্শ ও তথ্য অনুসন্ধান ফর্ম
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                আপনার নাম, মোবাইল নম্বর এবং কাঙ্ক্ষিত দেশের তথ্য দিন।
              </p>

              {errorMessage && (
                <div className="mb-4">
                  <Alert variant="error" title="ত্রুটি">
                    {errorMessage}
                  </Alert>
                </div>
              )}

              {isSubmitted ? (
                <Alert variant="success" title="আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে">
                  ধন্যবাদ। আপনার দেওয়া তথ্যের ভিত্তিতে আমাদের প্রতিনিধি দ্রুত যোগাযোগ করবেন।
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bengali">
                  <Input
                    label="আপনার নাম (পূর্ণ নাম)"
                    required
                    placeholder="উদাঃ মোঃ সুমন মিয়া"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="মোবাইল নম্বর"
                      required
                      placeholder="০১XXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />

                    <Select
                      label="আগ্রহী দেশ"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    >
                      <option value="Saudi Arabia">সৌদি আরব</option>
                      <option value="Qatar">কাতার</option>
                      <option value="UAE">সংযুক্ত আরব আমিরাত</option>
                      <option value="Malaysia">মালয়েশিয়া</option>
                      <option value="Singapore">সিঙ্গাপুর</option>
                      <option value="Europe">ইউরোপের বিভিন্ন দেশ</option>
                      <option value="Other">অন্যান্য গন্তব্য</option>
                    </Select>
                  </div>

                  <Textarea
                    label="আপনার অভিজ্ঞতা বা কোনো প্রশ্ন থাকলে লিখুন"
                    rows={3}
                    placeholder="আপনার কাজের অভিজ্ঞতা বা যে বিষয়ে তথ্য জানতে চান তা লিখুন..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full bg-[#102B50] hover:bg-[#0B1D35] text-white py-2.5 font-bold rounded-xl"
                    isLoading={isSubmitting}
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    এখনই যোগাযোগ করুন
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
