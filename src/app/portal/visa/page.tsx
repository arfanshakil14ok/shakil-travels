'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Stamp,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  RefreshCw,
  Plane,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PortalVisaTrackingPage() {
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Stamp className="w-7 h-7 text-primary" />
          Visa & Departure Readiness Tracking
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Monitor your official visa application file, embassy appointments, and pre-departure compliance checklist.
        </p>
      </div>

      {/* Visa Cases List */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          Checking visa records...
        </div>
      ) : visaCases.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl p-6">
          <Stamp className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-base text-foreground">No active visa cases</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Once an overseas employer extends a formal offer and contracts are executed, your visa case will be initiated here.
          </p>
          <Link href="/portal/applications" className="inline-block mt-4">
            <Button size="sm">Check Application Milestones</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {visaCases.map((vc) => {
            const readiness = vc.readiness;
            return (
              <div
                key={vc.id}
                className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6"
              >
                {/* Case File Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {vc.visaApplicationNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                        {vc.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-foreground mt-1">
                      {vc.visaType} • {vc.country?.name}
                    </h3>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Application Code: {vc.application?.applicationCode} (
                      {vc.application?.job?.title})
                    </div>
                  </div>

                  {readiness && (
                    <div className="bg-muted/40 px-4 py-2.5 rounded-xl border border-border text-right min-w-[180px]">
                      <div className="text-xs text-muted-foreground">Departure Readiness</div>
                      <div className="text-lg font-bold text-foreground">
                        {readiness.readinessScore}% Complete
                      </div>
                    </div>
                  )}
                </div>

                {/* 8-Point Pre-Departure Checklist */}
                {readiness && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Pre-Departure 8-Point Compliance Checklist
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {readiness.checklist?.map((item: any) => (
                        <div
                          key={item.category}
                          className={`p-3 rounded-xl border text-xs space-y-1 ${
                            item.passed
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-foreground">{item.name}</span>
                            {item.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-muted-foreground text-[11px] leading-tight">
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
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      Embassy & Biometrics Appointments
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {vc.appointments.map((apt: any) => (
                        <div
                          key={apt.id}
                          className="p-3 bg-muted/40 rounded-xl border border-border text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-semibold text-foreground">
                            <span>{apt.appointmentType}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                              {apt.status}
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            Date: {new Date(apt.appointmentDate).toLocaleString()}
                          </div>
                          {apt.location && (
                            <div className="text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {apt.location}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sovereign Authority Disclaimer */}
                <div className="p-3.5 bg-muted/30 border border-border rounded-xl text-[11px] text-muted-foreground space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-primary" />
                    Government Immigration Notice
                  </div>
                  <p>
                    Visa issuance is the sole prerogative of the embassy and immigration authorities of {vc.country?.name}. Shakil Global ensures 100% legal document submission and transparent tracking. No unauthorized agency can guarantee approval times.
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
