import React from 'react';
import Link from 'next/link';
import {
  Stamp,
  Globe2,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { getCountryFlagUrl } from '@/lib/image-constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Official Work Visa & Immigration Information | SHAKIL GLOBAL MANPOWER',
  description: 'Country-specific foreign employment visa requirements, eligibility criteria, documentation, and official embassy guidelines.',
};

export default async function VisaInformationPublicPage() {
  const visaList = await prisma.visaInformation.findMany({
    where: { isActive: true },
    include: {
      country: {
        select: { id: true, name: true, code: true, flag: true, slug: true },
      },
    },
    orderBy: [{ country: { name: 'asc' } }, { title: 'asc' }],
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
            <Stamp className="w-3.5 h-3.5" />
            Official Visa Guidelines & Criteria
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Overseas Work Visa & Permit Guidelines
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Verified requirements, document checklists, and government immigration processes for Bangladeshi migrant workers.
          </p>
        </div>

        {/* Mandatory Policy Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3.5 text-xs text-amber-900 leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Important Advisory:</strong> Visa and immigration requirements may change without prior notice. Always verify the latest information with the relevant government or immigration authority. SHAKIL GLOBAL MANPOWER does not make unsupported guarantees of visa issuance or immigration outcomes; all decisions rest with sovereign destination embassies.
          </div>
        </div>

        {/* Visa Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visaList.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
              No visa information published yet. Please consult our counseling team.
            </div>
          ) : (
            visaList.map((visa) => (
              <div
                key={visa.id}
                className="bg-white p-6 rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative w-5 h-3.5 rounded-xs overflow-hidden shadow-xs border border-slate-200 flex-shrink-0">
                        <Image
                          src={getCountryFlagUrl(visa.country?.code)}
                          alt={visa.country?.name || 'Country flag'}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="font-semibold text-slate-800 text-sm">{visa.country?.name}</span>
                    </div>
                    <Badge variant="outline" size="sm">{visa.visaType.replace(/_/g, ' ')}</Badge>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    <Link href={`/visa-information/${visa.slug}`} className="hover:text-primary-600 hover:underline">
                      {visa.title}
                    </Link>
                  </h2>

                  {visa.overview && (
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {visa.overview}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {visa.officialSourceName && (
                    <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                      Source: {visa.officialSourceName}
                    </span>
                  )}
                  <Link
                    href={`/visa-information/${visa.slug}`}
                    className="font-semibold text-primary-600 hover:underline flex items-center gap-1 ml-auto"
                  >
                    View Guidelines <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
