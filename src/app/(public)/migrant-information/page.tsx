import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plane,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Scale,
  PhoneCall,
  DollarSign,
  HeartPulse,
  Home,
  Briefcase,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Migrant Worker Information Portal | SHAKIL GLOBAL MANPOWER',
  description: 'Pre-departure guidance, airport procedures, labor rights, salary protection, contract awareness, and emergency consular assistance.',
};

const CATEGORIES_METADATA = [
  { code: 'BEFORE_TRAVEL', label: 'Before Travel & Briefing', icon: BookOpen, desc: 'BMET briefing, smart cards, and packing lists.' },
  { code: 'RECRUITMENT', label: 'Recruitment Transparency', icon: Briefcase, desc: 'Understanding agency fees and verification.' },
  { code: 'VISA', label: 'Visa Authentication', icon: FileText, desc: 'How to verify your foreign work permit validity.' },
  { code: 'DOCUMENTS', label: 'Document Checklists', icon: FileText, desc: 'Essential original files to carry overseas.' },
  { code: 'AIRPORT', label: 'Airport Preparation', icon: Plane, desc: 'Departure procedures at Hazrat Shahjalal International Airport.' },
  { code: 'ARRIVAL', label: 'Airport Arrival & Reception', icon: Home, desc: 'Immigration clearance and employer reception.' },
  { code: 'WORKPLACE', label: 'Workplace Rules & Etiquette', icon: Briefcase, desc: 'Adapting to international workplace standards.' },
  { code: 'WORKER_RIGHTS', label: 'Labor Rights & Protections', icon: Scale, desc: 'Working hours, rest days, and legal recourse.' },
  { code: 'SALARY', label: 'Salary & Remittance', icon: DollarSign, desc: 'Banking, electronic wage protection, and home remittances.' },
  { code: 'CONTRACT', label: 'Employment Contracts', icon: FileText, desc: 'Understanding terms, overtime, and probation.' },
  { code: 'SAFETY', label: 'Health & Occupational Safety', icon: HeartPulse, desc: 'Workplace PPE, insurance, and medical care.' },
  { code: 'SCAM_AWARENESS', label: 'Recruitment Scam Awareness', icon: AlertTriangle, desc: 'Identifying illegal sub-agents and fake visas.' },
  { code: 'EMERGENCY', label: 'Emergency Consular Helplines', icon: PhoneCall, desc: 'Bangladesh Embassy and labor wing 24/7 contacts.' },
  { code: 'RETURN', label: 'Return & Reintegration', icon: Home, desc: 'Safe return and post-migration opportunities.' },
];

export default async function MigrantInformationPublicPage() {
  const advisories = await prisma.migrantInformation.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Migrant Empowerment & Safe Migration
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Migrant Worker Information & Advisory Portal
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Comprehensive step-by-step guidance for safe, legal, and informed migration from Bangladesh to overseas destinations.
          </p>
        </div>

        {/* 14 Categories Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES_METADATA.map((cat) => {
            const IconComp = cat.icon;
            const articleCount = advisories.filter((a) => a.category === cat.code).length;
            return (
              <div
                key={cat.code}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="p-2 w-fit rounded-lg bg-slate-50 text-primary-600 mb-2">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-slate-800 text-xs sm:text-sm">{cat.label}</h2>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{cat.desc}</p>
                </div>
                <div className="text-[10px] font-semibold text-primary-700 pt-2 border-t border-slate-50">
                  {articleCount} Official Guides
                </div>
              </div>
            );
          })}
        </div>

        {/* Advisory Articles */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Featured Migrant Advisories</h2>
            <Link href="/scam-awareness" className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1">
              Read Scam Awareness Guide →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {advisories.map((advisory) => (
              <div key={advisory.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" size="sm">
                    {advisory.category.replace(/_/g, ' ')}
                  </Badge>
                  {advisory.lastVerifiedAt && (
                    <span className="text-[11px] text-slate-400">
                      Verified: {new Date(advisory.lastVerifiedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900">{advisory.title}</h3>

                {advisory.summary && (
                  <p className="text-xs text-slate-600 leading-relaxed">{advisory.summary}</p>
                )}

                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line border-t border-slate-100 pt-3">
                  {advisory.content}
                </div>

                {advisory.officialSource && (
                  <div className="text-[11px] text-slate-400 pt-2 flex items-center justify-between">
                    <span>Source: {advisory.officialSource}</span>
                    {advisory.officialSourceUrl && (
                      <a
                        href={advisory.officialSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline flex items-center gap-1"
                      >
                        Official Reference <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
