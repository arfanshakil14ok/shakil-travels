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
  HeartPulse,
  CreditCard,
  Clock,
  FileCheck,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

export default function PortalVisaTrackingPage() {
  const { language, t } = useLanguage();
  const [visaCases, setVisaCases] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [clearanceRecords, setClearanceRecords] = useState<any[]>([]);
  const [departureRecords, setDepartureRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVisa() {
      try {
        const res = await fetch('/api/portal/visa');
        const data = await res.json();
        if (data.success) {
          setVisaCases(data.data || []);
          setMedicalRecords(data.medicalRecords || []);
          setClearanceRecords(data.clearanceRecords || []);
          setDepartureRecords(data.departureRecords || []);
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

      {/* Post-Selection Overview Cards */}
      {loading ? (
        <LoadingState text={t('ভিসা ও বহির্গমন ফাইল যাচাই করা হচ্ছে...', 'Checking visa & departure records...')} />
      ) : visaCases.length === 0 && medicalRecords.length === 0 && clearanceRecords.length === 0 && departureRecords.length === 0 ? (
        <EmptyState
          title={t('কোনো চলমান ভিসা বা বহির্গমন ফাইল নেই', 'No active visa or departure cases')}
          description={t(
            'বিদেশি নিয়োগকারী প্রতিষ্ঠানের সাথে চুক্তি চূড়ান্ত হলে এবং কাজের অনুমোদন ইস্যু হলে আপনার ভিসা, মেডিকেল ও ফ্লাইট ফাইল স্বয়ংক্রিয়ভাবে এখানে যুক্ত হবে।',
            'Once an overseas employer extends a formal offer and bilateral contracts are executed, your visa, medical, clearance, and flight files will appear here.'
          )}
          action={{
            label: t('আবেদনের অগ্রগতি দেখুন', 'Check Application Milestones'),
            href: '/portal/applications',
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Departure & Flight Operations Section */}
          {departureRecords.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plane className="w-4 h-4 text-sky-600" />
                <span>{t('ফ্লাইট টিকেট ও বহির্গমন নির্দেশনা', 'Flight Ticket & Airport Dispatch')}</span>
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {departureRecords.map((dep) => (
                  <div
                    key={dep.id}
                    className="bg-gradient-to-br from-navy-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-navy-800"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                      <div>
                        <div className="text-[11px] text-emerald-400 font-mono font-bold tracking-wider uppercase">
                          {dep.status} • {dep.airline} ({dep.flightNumber})
                        </div>
                        <div className="text-base sm:text-lg font-bold text-white mt-0.5">
                          {dep.application?.job?.title || 'Overseas Employment Flight'}
                        </div>
                      </div>
                      {dep.pnrNumber && (
                        <div className="bg-white/10 px-3.5 py-1.5 rounded-lg text-right">
                          <span className="text-[10px] text-slate-300 block">PNR / Booking Ref</span>
                          <span className="font-mono text-sm font-bold text-amber-300">{dep.pnrNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">{t('ফ্লাইটের তারিখ ও সময়', 'Departure Time')}</span>
                        <span className="font-semibold text-white">
                          {new Date(dep.departureDate).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">{t('প্রস্থান বিমানবন্দর', 'Origin Airport')}</span>
                        <span className="font-medium text-slate-200">{dep.departureAirport}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">{t('গন্তব্য বিমানবন্দর', 'Destination Airport')}</span>
                        <span className="font-semibold text-emerald-300">{dep.destinationAirport}</span>
                      </div>
                    </div>

                    {dep.reportingInstructions && (
                      <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-slate-300">
                        <span className="font-bold text-amber-300 block mb-1">
                          {t('বিমানবন্দর রিপোর্টিং ও ব্রিফিং:', 'Airport Reporting Instructions:')}
                        </span>
                        {dep.reportingInstructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BMET Clearance & Smart Card Section */}
          {clearanceRecords.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>{t('বিএমইটি ইমিগ্রেশন ক্লিয়ারেন্স ও স্মার্ট কার্ড', 'BMET Emigration Clearance & Smart Card')}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clearanceRecords.map((clr) => (
                  <div key={clr.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{clr.clearanceType}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          clr.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {clr.status}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      {clr.smartCardNumber && (
                        <div>
                          <span className="text-slate-400">{t('স্মার্ট কার্ড নং:', 'Smart Card No:')}</span>{' '}
                          <span className="font-mono font-bold text-slate-900">{clr.smartCardNumber}</span>
                        </div>
                      )}
                      {clr.certificateNumber && (
                        <div>
                          <span className="text-slate-400">{t('সনদপত্র নং:', 'Certificate No:')}</span>{' '}
                          <span className="font-mono font-semibold text-slate-800">{clr.certificateNumber}</span>
                        </div>
                      )}
                      {clr.approvalDate && (
                        <div className="text-[11px] text-slate-500">
                          {t('অনুমোদনের তারিখ:', 'Approved On:')} {new Date(clr.approvalDate).toLocaleDateString()}
                        </div>
                      )}
                      {clr.remarks && <p className="text-[11px] text-slate-500 italic mt-1">{clr.remarks}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GAMCA Medical Examination Section */}
          {medicalRecords.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span>{t('গামকা ও প্রি-ডিপার্চার মেডিকেল রিপোর্ট', 'GAMCA Medical & Fitness Status')}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medicalRecords.map((med) => (
                  <div key={med.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{med.medicalCenterName}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          med.result === 'PASSED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : med.result === 'FAILED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {med.result}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      {med.gamcaNumber && (
                        <div>
                          <span className="text-slate-400">GAMCA Slip No:</span>{' '}
                          <span className="font-mono font-bold text-slate-900">{med.gamcaNumber}</span>
                        </div>
                      )}
                      {med.fitnessExpiryDate && (
                        <div className="text-[11px] text-slate-500">
                          {t('মেয়াদ শেষ:', 'Fitness Expiry:')}{' '}
                          <span className="font-semibold text-slate-700">
                            {new Date(med.fitnessExpiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {med.examinationDate && (
                        <div className="text-[11px] text-slate-500">
                          {t('পরীক্ষার তারিখ:', 'Exam Date:')} {new Date(med.examinationDate).toLocaleDateString()}
                        </div>
                      )}
                      {med.remarks && <p className="text-[11px] text-slate-500 italic mt-1">{med.remarks}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visa Cases List */}
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
