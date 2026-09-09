import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Stamp,
  Globe2,
  FileCheck2,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { getCountryFlagUrl } from '@/lib/image-constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const visa = await prisma.visaInformation.findFirst({
    where: {
      OR: [{ slug: params.slug }, { id: params.slug }],
    },
    include: { country: true },
  });

  if (!visa) return { title: 'Visa Information Not Found' };

  return {
    title: `${visa.title} Requirements & Guidelines | SHAKIL GLOBAL MANPOWER`,
    description: `Official requirements, eligibility, document checklist, and government guidelines for ${visa.title} (${visa.country?.name}).`,
  };
}

export default async function VisaInformationDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const visa = await prisma.visaInformation.findFirst({
    where: {
      OR: [{ slug: params.slug }, { id: params.slug }],
    },
    include: {
      country: true,
    },
  });

  if (!visa) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:underline">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/visa-information" className="hover:underline">Visa Information</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="font-semibold text-slate-800">{visa.country?.name}</span>
        </nav>

        {/* Title Card */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-7 h-5 rounded-xs overflow-hidden shadow-xs border border-slate-200 flex-shrink-0">
              <Image
                src={getCountryFlagUrl(visa.country?.code)}
                alt={visa.country?.name || 'Country flag'}
                fill
                className="object-cover"
              />
            </div>
            <span className="text-sm font-semibold text-slate-700">{visa.country?.name}</span>
            <Badge variant="outline">{visa.visaType.replace(/_/g, ' ')}</Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {visa.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            {visa.officialSourceName && (
              <span className="flex items-center gap-1">
                Official Authority: <strong className="text-slate-700">{visa.officialSourceName}</strong>
              </span>
            )}
            {visa.lastVerifiedAt && (
              <span>Last Verified: <strong className="text-slate-700">{new Date(visa.lastVerifiedAt).toLocaleDateString()}</strong></span>
            )}
          </div>
        </div>

        {/* Mandatory Official Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3.5 text-xs text-amber-900 leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Mandatory Verification Advisory:</strong> Visa and immigration requirements may change. Always verify the latest information with the relevant government or immigration authority. SHAKIL GLOBAL MANPOWER does not guarantee visa approvals or employment outcomes; foreign visa issuance is subject solely to destination government vetting.
          </div>
        </div>

        {/* Overview */}
        {visa.overview && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Stamp className="w-4 h-4 text-primary-600" />
              Visa Overview & Objective
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {visa.overview}
            </p>
          </div>
        )}

        {/* Eligibility Criteria */}
        {visa.eligibility && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              General Eligibility Criteria
            </h2>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {visa.eligibility}
            </div>
          </div>
        )}

        {/* Required Documents */}
        {visa.requiredDocuments && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-primary-600" />
              Required Documentation Checklist
            </h2>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {visa.requiredDocuments}
            </div>
          </div>
        )}

        {/* Application Process & Fees */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visa.applicationProcess && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-600" />
                Application Process
              </h2>
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {visa.applicationProcess}
              </div>
            </div>
          )}

          {visa.feesInformation && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Fees & Validity Guidelines
              </h2>
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {visa.feesInformation}
                {visa.validityInformation && `\n\nValidity: ${visa.validityInformation}`}
              </div>
            </div>
          )}
        </div>

        {/* Official Source Link */}
        {visa.officialSourceUrl && (
          <div className="bg-slate-100 rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Government Authority Source</div>
              <div className="text-sm font-bold text-slate-900">{visa.officialSourceName || 'Official Immigration Website'}</div>
            </div>
            <a
              href={visa.officialSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold bg-white px-4 py-2 rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-50"
            >
              Verify on Government Portal <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
