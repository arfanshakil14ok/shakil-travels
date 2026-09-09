'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Stamp,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Plane,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

export default function PortalVisaTrackingPage() {
  const { language, t } = useLanguage();
  const [visaCases, setVisaCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVisa() {
      try {
        const res = await fetch('/api/portal/visa');
        const data = await res.json();
        if (data.success) {
          setVisaCases(data.data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadVisa();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
            {t('ইমিগ্রেশন ও ভিসা', 'Immigration & Visa')}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
          {t('ভিসা ও বহির্গমন প্রস্তুতি ট্র্যাকিং', 'Visa & Departure Readiness Tracking')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t(
            'আপনার সরকারি ভিসা আবেদন ফাইল, দূতাবাস সাক্ষাতের সূচি এবং ৮-দফা বহির্গমন চেকলিস্ট পর্যবেক্ষণ করুন।',
            'Monitor your official visa application file, embassy appointments, and pre-departure compliance checklist.'
          )}
        </p>
      </div>

      {/* Visa Cases List */}
      {loading ? (
        <LoadingState text={t('ভিসা ফাইল যাচাই করা হচ্ছে...', 'Checking visa records...')} />
      ) : visaCases.length === 0 ? (
        <EmptyState
          title={t('কোনো চলমান ভিসা ফাইল নেই', 'No active visa cases')}
          description={t(
            'বিদেশি নিয়োগকারী প্রতিষ্ঠানের সাথে চুক্তি চূড়ান্ত হলে এবং কাজের অনুমোদন ইস্যু হলে আপনার ভিসা ফাইল স্বয়ংক্রিয়ভাবে এখানে যুক্ত হবে।',
            'Once an overseas employer extends a formal offer and bilateral contracts are executed, your visa case will appear here.'
          )}
          action={{
            label: t('আবেদনের অগ্রগতি দেখুন', 'Check Application Milestones'),
            href: '/portal/applications',
          }}
        />
      ) : (
        <div className="space-y-6">
          {visaCases.map((vc) => {
            const readiness = vc.readiness;
            return (
              <div
                key={vc.id}
                className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-6"
              >
                {/* Case File Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {vc.visaApplicationNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {vc.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 mt-1">
                      {vc.visaType} • {vc.country?.name}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {t('আবেদন কোড:', 'Application Code:')}{' '}
                      <span className="font-mono text-slate-700">{vc.application?.applicationCode}</span> (
                      {vc.application?.job?.title})
                    </div>
                  </div>

                  {readiness && (
                    <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80 text-right min-w-[170px]">
                      <div className="text-xs text-slate-500 font-medium">
                        {t('বহির্গমন প্রস্তুতি', 'Departure Readiness')}
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        {readiness.readinessScore}% {t('সম্পূর্ণ', 'Complete')}
                      </div>
                    </div>
                  )}
                </div>

                {/* 8-Point Pre-Departure Checklist */}
                {readiness && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>
                        {t('প্রাক-বহির্গমন ৮-দফা বাধ্যতামূলক যাচাই তালিকা', 'Pre-Departure 8-Point Compliance Checklist')}
                      </span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {readiness.checklist?.map((item: any) => (
                        <div
                          key={item.category}
                          className={`p-3 rounded-lg border text-xs space-y-1 ${
                            item.passed
                              ? 'bg-emerald-50/60 border-emerald-200/80'
                              : 'bg-amber-50/60 border-amber-200/80'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-slate-800">{item.name}</span>
                            {item.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-slate-500 text-[11px] leading-tight">
                            {item.details}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scheduled Appointments */}
                {vc.appointments && vc.appointments.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-700" />
                      <span>{t('দূতাবাস ও বায়োমেট্রিক সাক্ষাতের সূচি', 'Embassy & Biometrics Appointments')}</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {vc.appointments.map((apt: any) => (
                        <div
                          key={apt.id}
                          className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-semibold text-slate-900">
                            <span>{apt.appointmentType}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-800">
                              {apt.status}
                            </span>
                          </div>
                          <div className="text-slate-500">
                            {new Date(apt.appointmentDate).toLocaleString()}
                          </div>
                          {apt.location && (
                            <div className="text-slate-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {apt.location}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Embassy Notice */}
                <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-lg text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-700" />
                    <span>{t('দূতাবাস ও সরকারি নীতিমালা', 'Government Immigration Notice')}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    {t(
                      `ভিসা মঞ্জুর করা সংশ্লিষ্ট রাষ্ট্র (${vc.country?.name || 'গন্তব্য দেশ'}) এবং তার দূতাবাসের সার্বভৌম অধিকার। শাকিল গ্লোবাল ম্যানপাওয়ার সকল আইনি নথি যথাযথভাবে উপস্থাপন ও ট্র্যাকিং নিশ্চিত করে।`,
                      `Visa issuance is the sole prerogative of the embassy and sovereign authorities of ${vc.country?.name || 'the destination country'}. SHAKIL GLOBAL MANPOWER ensures transparent tracking and authorized legal document submission.`
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
