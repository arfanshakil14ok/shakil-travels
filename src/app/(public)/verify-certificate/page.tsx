'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Award,
  Building2,
  Calendar,
  Phone,
  Printer,
  FileBadge,
  ArrowRight,
} from 'lucide-react';
import { BRAND } from '@/config/brand';
import { BrandLogo, BrandMark } from '@/components/brand/brand-logo';

function VerifyCertificateForm() {
  const searchParams = useSearchParams();
  const certParam = searchParams.get('cert') || '';

  const [query, setQuery] = useState(certParam);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (codeToVerify: string) => {
    const clean = codeToVerify.trim();
    if (!clean) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/certificates/verify/${encodeURIComponent(clean)}`);
      const json = await res.json();

      if (res.ok && json.success) {
        setResult(json.data);
      } else {
        setResult(null);
        setError(json.error || 'No matching certificate found in the official registry.');
      }
    } catch {
      setError('Network connection error. Please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certParam) {
      handleVerify(certParam);
    }
  }, [certParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(query);
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Verification Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Official BMET RL-1892 Registry
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Verify Skill Training Certificate
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Verify the authenticity of vocational training certificates issued by <span className="font-semibold text-slate-800">SHAKIL GLOBAL MANPOWER</span> and affiliated technical training centers.
          </p>
        </div>

        {/* Search Bar Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm print:hidden">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Certificate No (e.g. SGR-CERT-2026-000001 or Verification Code)"
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="h-11 px-6 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Now</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span>Example test search:</span>
            <button
              type="button"
              onClick={() => {
                setQuery('SGR-CERT-2026-000001');
                handleVerify('SGR-CERT-2026-000001');
              }}
              className="font-mono text-emerald-700 hover:underline cursor-pointer"
            >
              SGR-CERT-2026-000001
            </button>
          </div>
        </div>

        {/* Verification Result Card */}
        {result && (
          <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-md overflow-hidden animate-in fade-in duration-200">
            {/* Authenticity Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                    Official Verification Passed
                  </div>
                  <div className="text-lg font-bold">Authentic Verified Certificate</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-medium backdrop-blur-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Verification
              </button>
            </div>

            {/* Certificate Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Agency Identification */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <BrandMark size="md" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      {BRAND.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Govt Approved Recruiting Agency • License RL-1892
                    </p>
                  </div>
                </div>
                <div className="text-right sm:border-l sm:border-slate-100 sm:pl-4">
                  <div className="text-xs text-slate-500 font-medium">Certificate Number</div>
                  <div className="font-mono font-bold text-sm text-slate-900">{result.certificateNumber}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Code: {result.verificationCode}</div>
                </div>
              </div>

              {/* Verified Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <div className="text-xs text-slate-500 font-medium">Candidate Name</div>
                  <div className="text-base font-bold text-slate-900">{result.candidateName}</div>
                  <div className="text-xs text-slate-500 font-mono">ID: {result.candidateId} • {result.nationality}</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <div className="text-xs text-slate-500 font-medium">Skill & Qualification</div>
                  <div className="text-base font-bold text-slate-900">{result.skillAcquired}</div>
                  <div className="text-xs text-emerald-700 font-medium">Grade Awarded: {result.grade}</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <div className="text-xs text-slate-500 font-medium">Course Program</div>
                  <div className="text-sm font-semibold text-slate-900">{result.courseTitle}</div>
                  <div className="text-xs text-slate-500">{result.courseTitleBn} • {result.durationWeeks} Weeks</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <div className="text-xs text-slate-500 font-medium">Training Center & Institute</div>
                  <div className="text-sm font-semibold text-slate-900">{result.trainingCenter}</div>
                  <div className="text-xs text-slate-500">{result.trainingCenterBn} ({result.centerDistrict})</div>
                </div>
              </div>

              {/* Official Seal Footer */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
                <div>
                  <strong>Official Status:</strong> Confirmed in Active Registry as a certified overseas candidate.
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Issue Date: {new Date(result.issueDate).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Government RL-1892 Verified
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error / Not Found Card */}
        {searched && error && (
          <div className="bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h2 className="text-base font-bold text-slate-900">Certificate Not Found</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                The reference code entered does not match any authenticated record in the SHAKIL GLOBAL MANPOWER registry. Please verify the digits or contact our Netrokona office hotline.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-4 text-xs font-medium">
              <a
                href={`tel:${BRAND.phone}`}
                className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                Hotline: {BRAND.phone}
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
              >
                Contact Agency <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyCertificatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] bg-slate-50 flex items-center justify-center p-4">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyCertificateForm />
    </Suspense>
  );
}
