import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Globe2,
  Briefcase,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  MapPin,
  Banknote,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const country = await prisma.country.findFirst({
    where: {
      OR: [{ slug: params.slug }, { code: params.slug.toUpperCase() }],
    },
  });

  if (!country) return { title: 'Country Not Found' };

  return {
    title: `${country.name} Recruitment & Work Visa Information | Shakil Global`,
    description: `Official recruitment guidelines, open jobs, work permits, and living conditions for Bangladeshi workers in ${country.name}.`,
  };
}

export default async function CountryPublicDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const country = await prisma.country.findFirst({
    where: {
      OR: [{ slug: params.slug }, { code: params.slug.toUpperCase() }],
    },
    include: {
      jobs: {
        where: { status: 'PUBLISHED' },
        include: {
          jobCategory: true,
          employer: { select: { companyName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      visaInformations: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!country) {
    notFound();
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">RECRUITMENT ACTIVE</Badge>;
      case 'LIMITED':
        return <Badge variant="warning">LIMITED QUOTA</Badge>;
      case 'PAUSED':
        return <Badge variant="navy">TEMPORARILY PAUSED</Badge>;
      default:
        return <Badge variant="neutral">INACTIVE</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:underline">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/countries" className="hover:underline">Destination Countries</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="font-semibold text-slate-800">{country.name}</span>
        </nav>

        {/* Hero Banner */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{country.flag || '🌐'}</span>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-extrabold text-slate-900">{country.name}</h1>
                  {getStatusDisplay(country.recruitmentStatus || 'ACTIVE')}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                  <span>ISO: <strong className="text-slate-700">{country.code}</strong></span>
                  {country.continent && <span>Region: <strong className="text-slate-700">{country.continent}</strong></span>}
                  {country.currency && (
                    <span>Currency: <strong className="text-slate-700">{country.currency} ({country.currencyCode || ''})</strong></span>
                  )}
                  {country.timezone && <span>Timezone: <strong className="text-slate-700">{country.timezone}</strong></span>}
                </div>
              </div>
            </div>

            <Link href="#available-jobs">
              <Button className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                View Open Vacancies ({country.jobs.length})
              </Button>
            </Link>
          </div>

          {country.description && (
            <p className="mt-6 text-sm text-slate-600 leading-relaxed max-w-3xl border-t border-slate-100 pt-4">
              {country.description}
            </p>
          )}
        </div>

        {/* Official Disclaimer Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Official Immigration & Visa Policy Disclaimer:</span> Visa and immigration regulations, required documents, and minimum wage scales are determined exclusively by the respective sovereign governments and relevant immigration authorities. Shakil Global Recruitment facilitates authorized government-to-government (G2G) and licensed B2B recruitment. We do not claim 100% visa guarantees; all approvals are subject to official embassy vetting.
          </div>
        </div>

        {/* 2-Column Details: Visa Criteria & Worker Rights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visa Guidelines */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary-600" />
              Work Visa & Entry Guidelines
            </h2>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {country.visaInformation || 'Official work visa procedures require GAMCA medical clearance, BMET smart card processing, and bilateral agreement clearance.'}
            </div>

            {country.visaInformations.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase">Available Visa Categories:</div>
                <div className="space-y-1.5">
                  {country.visaInformations.map((vi) => (
                    <Link
                      key={vi.id}
                      href={`/visa-information/${vi.slug}`}
                      className="p-2.5 rounded-lg border border-slate-100 hover:border-primary-200 bg-slate-50 flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="font-medium text-slate-800">{vi.title}</span>
                      <span className="text-primary-600 font-semibold flex items-center gap-1">
                        Criteria <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Worker Rights & Living Conditions */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Worker Rights & Living Conditions
            </h2>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {country.workerInformation || 'All recruits are covered under legal foreign worker protection laws with mandatory employer-provided accommodation, health insurance, and structured overtime compensation.'}
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2 text-xs">
              <div className="font-semibold text-slate-800">Key Protection Standards:</div>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Legal labor contract verified by Bangladesh Embassy abroad</li>
                <li>BMET Emigration Clearance Smart Card required prior to departure</li>
                <li>Bank-disbursed monthly salary compliance (WPS system where applicable)</li>
                <li>Comprehensive emergency consular helpline support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Available Jobs Section */}
        <div id="available-jobs" className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary-600" />
                Published Jobs in {country.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified foreign employer vacancies accepting Bangladeshi applicants.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full">
              {country.jobs.length} Active Positions
            </span>
          </div>

          {country.jobs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Currently no published job circulars for {country.name}. Please check back shortly or register your profile with us.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {country.jobs.map((job) => (
                <div key={job.id} className="p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-3 bg-slate-50">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{job.title}</h3>
                      <Badge size="sm">{job.jobCategory?.name || 'General'}</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {job.employer?.companyName || 'Verified Foreign Company'}
                    </div>

                    <div className="mt-3 text-xs space-y-1 text-slate-600">
                      <div>Vacancies: <strong>{job.vacancyCount || 1}</strong></div>
                      {job.salaryMin && (
                        <div className="text-primary-700 font-semibold">
                          Salary: {job.currency || ''} {Number(job.salaryMin).toLocaleString()}/month
                        </div>
                      )}
                    </div>
                  </div>

                  <Link href={`/jobs/${job.slug}`} className="block pt-2">
                    <Button size="sm" className="w-full text-xs flex items-center justify-center gap-1.5">
                      Apply Now <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary-600" />
            Frequently Asked Questions for {country.name}
          </h2>
          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-3">
              <h3 className="font-semibold text-slate-800">What documents do I need before applying?</h3>
              <p className="text-xs text-slate-600 mt-1">
                You will need a machine-readable or e-passport with at least 1 year validity, digital passport-size photographs, verified educational/technical certificates, and police clearance.
              </p>
            </div>
            <div className="py-3">
              <h3 className="font-semibold text-slate-800">How long does embassy visa processing take?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Processing duration varies by destination country, usually taking between 4 to 12 weeks following medical clearance and contract issuance.
              </p>
            </div>
            <div className="py-3">
              <h3 className="font-semibold text-slate-800">Is BMET smart card clearance mandatory?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Yes. Under Government of Bangladesh regulations, every citizen departing for overseas employment must have a valid BMET Smart Card and briefing clearance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
