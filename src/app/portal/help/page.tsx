'use client';

import React, { useState } from 'react';
import {
  LifeBuoy,
  Phone,
  Mail,
  MapPin,
  Send,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/components/ui/toast';

export default function PortalHelpPage() {
  const { success, error } = useToast();
  const { language, t } = useLanguage();

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState({
    name: '',
    phone: '',
    subject: '',
    message: '',
  });

  const faqs = [
    {
      qBn: 'পাসপোর্ট ও নথিপত্র কীভাবে যাচাই করা হয়?',
      qEn: 'How are passports and identity documents verified?',
      aBn: 'নথি আপলোড করার পর আমাদের কমপ্লায়েন্স টিম ২৪-৪৮ ঘণ্টার মধ্যে পাসপোর্ট, এনআইডি ও মেডিকেল সার্টিফিকেট সরকারি ডেটাবেস এবং বায়োমেট্রিক এজেন্সির সাথে মিলিয়ে যাচাই করে। যাচাই সম্পন্ন হলে প্রোফাইল ও নথিপত্র অংশে সবুজ ব্যাজ প্রদর্শিত হবে।',
      aEn: 'After upload, our compliance desk verifies your passport, NID, and medical certificates against official databases and biometric partner guidelines within 24-48 business hours.',
    },
    {
      qBn: 'অনলাইন আবেদনের পর পরবর্তী ধাপ কী?',
      qEn: 'What is the next step after submitting an application?',
      aBn: 'নথি যাচাই সম্পন্ন হলে আপনাকে প্রাথমিক সাক্ষাৎকারের তারিখ ও সময় এসএমএস এবং পোর্টাল নোটিফিকেশনের মাধ্যমে জানানো হবে। এর পর নির্বাচিত প্রার্থীদের মেডিকেল টেস্ট ও ভিসা ফাইল প্রসেসিং শুরু হবে।',
      aEn: 'Once documents are approved, you will receive an interview invitation via SMS and portal notifications. Selected candidates proceed to biometric medical and visa processing.',
    },
    {
      qBn: 'ভিসা স্ট্যাটাস কীভাবে ট্র্যাক করব?',
      qEn: 'How do I track my visa processing status?',
      aBn: 'পোর্টালের "ভিসা ট্র্যাকিং" মেনুতে ক্লিক করে আপনার অনুমোদিত ভিসা আবেদন, এম্বাসি সাবমিশন তারিখ ও বিএমইটি ইমিগ্রেশন ছাড়পত্রের লাইভ অগ্রগতি দেখতে পারবেন।',
      aEn: 'Navigate to "Visa Tracking" in your portal menu to see live milestones including Embassy submission, visa stamping, and BMET smart card clearance.',
    },
    {
      qBn: 'ইনভয়েস ও পেমেন্টের রসিদ কীভাবে পাব?',
      qEn: 'How do I obtain invoice and payment receipts?',
      aBn: 'যেকোনো সার্ভিস ফি পরিশোধের সাথে সাথে অফিসিয়াল রসিদ (SGR-RCP-2026-XXXXXX) ও ইনভয়েস "ইনভয়েস ও রসিদ" পাতায় পাওয়া যাবে, যা সরাসরি কিউআর কোডসহ প্রিন্ট করা যাবে।',
      aEn: 'Official receipts and itemized invoices are instantly generated under the "Invoices" tab with verified QR codes and A4 print options.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket.name || !ticket.phone || !ticket.message) {
      error(t('অনুগ্রহ করে নাম, ফোন ও বার্তা পূরণ করুন', 'Please fill in name, phone, and message'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ticket.name,
          phone: ticket.phone,
          subject: ticket.subject || 'Portal Candidate Support Request',
          message: ticket.message,
          source: 'PORTAL_SUPPORT',
        }),
      });

      const data = await res.json();
      if (data.success) {
        success(t('আপনার বার্তা সফলভাবে গৃহীত হয়েছে। আমাদের সাপোর্ট প্রতিনিধি দ্রুত যোগাযোগ করবেন।', 'Your support inquiry has been submitted. A representative will reach out shortly.'));
        setTicket({ name: '', phone: '', subject: '', message: '' });
      } else {
        error(data.error || 'Failed to submit support request');
      }
    } catch {
      error('Failed to communicate with support desk');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {t('সহায়তা ও যোগাযোগ', 'Help & Contact')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {t('হেল্প ও সাপোর্ট সেন্টার', 'Help & Support Center')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              'নিয়োগ প্রক্রিয়া, ভিসা স্ট্যাটাস অথবা নথি সংক্রান্ত যেকোনো তথ্যের জন্য আমাদের সাথে সরাসরি যোগাযোগ করুন।',
              'Reach out for assistance regarding applications, visa workflows, document verifications, or payments.'
            )}
          </p>
        </div>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hotline Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {t('হটলাইন হেল্পডেস্ক', 'Hotline Helpdesk')}
            </h4>
            <div className="text-sm font-semibold text-slate-800 font-mono">
              01913681771
            </div>
            <p className="text-[11px] text-slate-500">
              {t('শনিবার - বৃহস্পতিবার (সকাল ৯টা - সন্ধ্যা ৬টা)', 'Sat - Thu: 9:00 AM - 6:00 PM')}
            </p>
          </div>
        </div>

        {/* WhatsApp Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {t('হোয়াটসঅ্যাপ সাপোর্ট', 'WhatsApp Support')}
            </h4>
            <div className="text-sm font-semibold text-emerald-700 font-mono">
              01913681771
            </div>
            <a
              href="https://wa.me/8801913681771"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-emerald-600 hover:underline inline-block"
            >
              {t('সরাসরি চ্যাট শুরু করুন →', 'Start Chat Directly →')}
            </a>
          </div>
        </div>

        {/* Office Location Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {t('প্রধান কার্যালয়', 'Head Office')}
            </h4>
            <div className="text-xs font-semibold text-slate-800">
              SHAKIL GLOBAL MANPOWER
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-bengali">
              {t(
                'ইসলামপুর মোড় , ডায়াবেটিক হাসপাতালের সামনে , পাসপোর্ট অফিস রোড , নেত্রকোনা -২৪০০',
                'Islampur Mor, in front of Diabetic Hospital, Passport Office Road, Netrokona-2400'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content: Support Form + FAQ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Support Inquiry Form */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">
              {t('বার্তা পাঠান / টিকিট খুলুন', 'Send a Message / Open Ticket')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('আপনার সমস্যা বিস্তারিত লিখে পাঠান, দ্রুত সমাধান করা হবে।', 'Submit your query and our operations desk will assist you.')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {t('আপনার নাম *', 'Your Name *')}
              </label>
              <input
                required
                value={ticket.name}
                onChange={(e) => setTicket({ ...ticket, name: e.target.value })}
                placeholder={t('পূর্ণ নাম লিখুন', 'Enter your full name')}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {t('মোবাইল নম্বর *', 'Phone Number *')}
              </label>
              <input
                required
                value={ticket.phone}
                onChange={(e) => setTicket({ ...ticket, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {t('বিষয়ের শিরোনাম', 'Subject')}
              </label>
              <input
                value={ticket.subject}
                onChange={(e) => setTicket({ ...ticket, subject: e.target.value })}
                placeholder={t('যেমন: পাসপোর্ট যাচাই বিলম্ব / ভিসা তথ্য', 'e.g. Passport verification inquiry')}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {t('বিস্তারিত বার্তা *', 'Your Message *')}
              </label>
              <textarea
                required
                rows={4}
                value={ticket.message}
                onChange={(e) => setTicket({ ...ticket, message: e.target.value })}
                placeholder={t('আপনার প্রশ্ন বা সমস্যার বিস্তারিত লিখুন...', 'Describe your query or issue in detail...')}
                className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {submitting && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? t('পাঠানো হচ্ছে...', 'Submitting...') : t('বার্তা জমা দিন', 'Submit Support Request')}</span>
            </button>
          </form>
        </div>

        {/* Frequently Asked Questions */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-base text-slate-900">
              {t('সাধারণ জিজ্ঞাসাবলী (FAQ)', 'Frequently Asked Questions')}
            </h3>
          </div>

          <div className="space-y-2.5">
            {faqs.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="border border-slate-200/80 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left p-3.5 sm:p-4 bg-slate-50/60 hover:bg-slate-100/60 flex items-center justify-between gap-3 text-xs font-semibold text-slate-900 cursor-pointer"
                  >
                    <span>{language === 'bn' ? item.qBn : item.qEn}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="p-3.5 sm:p-4 bg-white border-t border-slate-100 text-xs text-slate-600 leading-relaxed animate-in fade-in duration-150">
                      {language === 'bn' ? item.aBn : item.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Ministry License Badge */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {t(
                'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত রিক্রুটিং এজেন্সি লাইসেন্স নং RL-1892।',
                'Government of Bangladesh Approved Recruiting Agency License No. RL-1892.'
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
