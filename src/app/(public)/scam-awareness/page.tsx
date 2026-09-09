import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileSearch,
  PhoneCall,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Recruitment Scam & Fake Visa Awareness | SHAKIL GLOBAL MANPOWER',
  description: 'Protect yourself from recruitment fraud, fake visa guarantees, unauthorized middlemen, and fraudulent overseas employment offers.',
};

export default function ScamAwarenessPage() {
  const redFlags = [
    { title: 'Guaranteed 100% Visa Approval', desc: 'No legal agency can guarantee visa approval. Sovereign foreign embassies make all visa decisions based on formal background checks.' },
    { title: 'Unusually High Salaries with No Skills', desc: 'Offers promising unrealistic monthly salaries (e.g. ৳2-3 Lakhs for unskilled labor) without experience or interviews are classic fraud indicators.' },
    { title: 'Payment Demanded to Personal Accounts', desc: 'Never pay fees to personal bKash/Nagad numbers or cash to unauthorized middlemen. Genuine agencies issue official money receipts and bank deposit vouchers.' },
    { title: 'Fake Appointment or Offer Letters', desc: 'Fraudsters forge embassy seals or employer letterheads. Verify all employer demand letters directly on the BMET Ami Probashi portal.' },
    { title: 'Tourist/Visit Visa Offered for Work', desc: 'Traveling on a tourist/visit visa with promises of "conversion to work permit on arrival" is illegal and results in arrest, detention, and deportation.' },
    { title: 'Withholding Original Passports', desc: 'Unauthorized brokers often withhold candidate passports to extort payments. Only submit documents against an official registration receipt.' },
  ];

  const verificationSteps = [
    { step: '01', title: 'Verify Agency RL License', desc: 'Check the recruiting agency license number on the official BMET website (www.bmet.gov.bd) or Ministry of Expatriates Welfare.' },
    { step: '02', title: 'Check BMET Job Approval', desc: 'Verify that the overseas job vacancy has formal Government of Bangladesh Bureau of Manpower clearance.' },
    { step: '03', title: 'Verify Visa via Embassy Portal', desc: 'Use the official foreign government visa verification portal (e.g. Enjaz/Muqeem for KSA, VFS tracking, etc.) to confirm your permit status.' },
    { step: '04', title: 'Insist on Official Receipts', desc: 'Every payment must be accompanied by an official, signed money receipt with sequential receipt numbers.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Hero */}
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
            <ShieldAlert className="w-4 h-4" />
            Public Safety & Fraud Advisory
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Recruitment Scam & Fake Visa Protection Guide
          </h1>
          <p className="text-sm sm:text-base text-slate-700 max-w-2xl mx-auto leading-relaxed">
            Essential knowledge to protect yourself and your family from unauthorized brokers, counterfeit visas, and illegal migration rackets.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
          <div className="text-sm text-slate-700 space-y-1 leading-relaxed">
            <strong className="text-slate-900 font-bold block">Important Notice Regarding Sub-Agents & Middlemen (Dalals):</strong>
            SHAKIL GLOBAL MANPOWER operates strictly through our authorized headquarters and verified digital portal. We do not authorize unverified third-party brokers or commission agents to collect cash from candidates.
          </div>
        </div>

        {/* Red Flags Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600" />
            Top 6 Warning Signs of a Recruitment Scam
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {redFlags.map((flag, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  {flag.title}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{flag.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Safe Verification Steps */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            4 Safe Steps Before Making Any Payment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {verificationSteps.map((step) => (
              <div key={step.step} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="text-2xl font-mono font-extrabold text-primary-600">{step.step}</div>
                <h3 className="font-bold text-slate-900 text-sm">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Official Reporting Helplines */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold">Suspect Fraud or Illegal Dalal Demand?</h2>
              <p className="text-xs text-slate-300 mt-1">
                Report complaints immediately to the Bureau of Manpower, Employment and Training (BMET).
              </p>
            </div>
            <a
              href="https://www.bmet.gov.bd"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              BMET Official Portal <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block">Probashi Kallyan Helpline:</span>
              <strong className="text-white font-mono text-sm">16135 (Toll Free in BD)</strong>
            </div>
            <div>
              <span className="text-slate-400 block">International Calling:</span>
              <strong className="text-white font-mono text-sm">+880 9610 102030</strong>
            </div>
            <div>
              <span className="text-slate-400 block">SHAKIL GLOBAL MANPOWER Anti-Fraud Desk:</span>
              <strong className="text-white font-mono text-sm">compliance@shakilglobal.com</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
