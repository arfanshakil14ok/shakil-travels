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
} from 'lucide-react';

export const ContactCtaSection: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [destination, setDestination] = useState('Saudi Arabia');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setName('');
      setPhone('');
      setMessage('');
    }, 600);
  };

  return (
    <section id="contact-cta" className="py-16 sm:py-24 bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section 13: Strong Final Call-to-Action Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 p-8 sm:p-12 lg:p-16 text-white border border-navy-800 shadow-2xl font-bengali">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-800/80 border border-navy-700 text-xs text-gold-400 font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>আজই নিন আপনার ভবিষ্যৎ ক্যারিয়ারের সঠিক সিদ্ধান্ত</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              আপনার বিদেশে কর্মজীবনের প্রস্তুতি আজই শুরু করুন
            </h2>

            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
              নিরাপদ, স্বচ্ছ ও সরকারি অনুমোদিত প্রক্রিয়ায় বিদেশের মাটিতে গড়ে তুলুন আপনার সম্মানজনক ভবিষ্যৎ। শতভাগ অনুমোদিত নিয়োগ ও ডিজিটাল ট্র্যাকিং সুবিধা।
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href="/jobs" className="w-full sm:w-auto">
                <Button
                  variant="gold"
                  size="lg"
                  leftIcon={<Search className="w-4 h-4 text-navy-950" />}
                  className="w-full sm:w-auto font-bold text-sm sm:text-base px-8 py-3.5 shadow-lg hover:shadow-gold-500/25"
                >
                  চাকরি খুঁজুন
                </Button>
              </Link>

              <Link href="/portal/register" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<UserPlus className="w-4 h-4 text-white" />}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base px-8 py-3.5 shadow-lg"
                >
                  অ্যাকাউন্ট তৈরি করুন
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Consultation & Office Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center font-bengali">
          {/* Left info */}
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200">
              যোগাযোগ ও পরামর্শ
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              বিদেশে ক্যারিয়ার গড়ার ব্যাপারে কোনো প্রশ্ন আছে?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              আমাদের অনুমোদিত ক্যারিয়ার কনসালট্যান্টদের সাথে কথা বলুন। আপনার অভিজ্ঞতা ও যোগ্যতার ভিত্তিতে সঠিক দেশের চাকরির প্রয়োজনীয় দিকনির্দেশনা গ্রহণ করুন।
            </p>

            <div className="space-y-4 pt-2 text-xs text-slate-700 font-sans">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs flex-shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block text-slate-900">হটলাইন সহায়তা:</span>
                  <span className="font-mono text-slate-600">+880 2 9876543 / +880 1711-000000</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block text-slate-900">অফিসিয়াল ইমেইল:</span>
                  <span className="font-mono text-slate-600">info@shakilglobal.com</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block text-slate-900 font-bengali">অফিস ঠিকানা:</span>
                  <span className="font-bengali text-slate-600">হাউস ১২, রোড ৪, সেক্টর ৭, উত্তরা, ঢাকা-১২৩০</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block text-slate-900 font-bengali">অফিস সময়সূচী:</span>
                  <span className="font-bengali text-slate-600">শনিবার - বৃহস্পতিবার: সকাল ৯:০০ - সন্ধ্যা ৬:০০</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right inquiry form */}
          <Card className="shadow-lg border-slate-200 bg-white">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                ফ্রি প্রাথমিক পরামর্শ ও যোগ্যতা অনুসন্ধান
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                আপনার সঠিক তথ্য দিন, আমাদের প্রতিনিধি ১ কার্যদিবসের মধ্যে যোগাযোগ করবেন।
              </p>

              {isSubmitted ? (
                <Alert variant="success" title="আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে">
                  ধন্যবাদ। আমাদের অভিবাসন ও নিয়োগ পরামর্শক টিম শীঘ্রই আপনার সাথে যোগাযোগ করবেন।
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <Input
                    label="আপনার নাম (পূর্ণ নাম)"
                    required
                    placeholder="উদাঃ মোঃ রফিকুল ইসলাম"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="মোবাইল নম্বর (হোয়াটসঅ্যাপ সচল)"
                      required
                      placeholder="০১৭XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />

                    <Select
                      label="আগ্রহী দেশ"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    >
                      <option value="Saudi Arabia">সৌদি আরব</option>
                      <option value="UAE">সংযুক্ত আরব আমিরাত</option>
                      <option value="Qatar">কাতার</option>
                      <option value="Kuwait">কুয়েত</option>
                      <option value="Oman">ওমান</option>
                      <option value="Malaysia">মালয়েশিয়া</option>
                      <option value="Singapore">সিঙ্গাপুর</option>
                      <option value="Japan">জাপান</option>
                      <option value="Europe">ইউরোপীয় ইউনিয়ন</option>
                    </Select>
                  </div>

                  <Textarea
                    label="আপনার কাজের অভিজ্ঞতা বা কোনো প্রশ্ন থাকলে লিখুন"
                    rows={3}
                    placeholder="আপনার কাজের ধরন ও কোনো পূর্ব অভিজ্ঞতা থাকলে সংক্ষেপে লিখুন..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full bg-navy-950 hover:bg-navy-900 py-2.5 font-bold"
                    isLoading={isSubmitting}
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    পরামর্শের জন্য অনুরোধ পাঠান
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
