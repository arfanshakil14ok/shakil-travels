'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { Phone, Mail, MapPin, Send } from 'lucide-react';

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
    <section className="py-16 sm:py-24 bg-slate-50 font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left info */}
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              যোগাযোগ ও পরামর্শ
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              বিদেশে ক্যারিয়ার গড়ার ব্যাপারে কোনো প্রশ্ন আছে?
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              আমাদের অনুমোদিত ক্যারিয়ার কনসালট্যান্টদের সাথে কথা বলুন। আপনার অভিজ্ঞতা ও যোগ্যতার ভিত্তিতে সঠিক দেশের চাকরির পরামর্শ গ্রহণ করুন।
            </p>

            <div className="space-y-4 pt-2 text-xs text-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold block text-slate-900">সরাসরি হটলাইন:</span>
                  <span>+880 2 9876543 / +880 1711-000000</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold block text-slate-900">ইমেইল পরামর্শ:</span>
                  <span>info@shakilglobal.com</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold block text-slate-900">অফিস ভিজিট:</span>
                  <span>হাউস ১২, রোড ৪, সেক্টর ৭, উত্তরা, ঢাকা-১২৩০</span>
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
                    className="w-full bg-navy-950 hover:bg-navy-900"
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
