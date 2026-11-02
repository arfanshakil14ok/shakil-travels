import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | SHAKIL TRAVELS (RL-1558)',
  description: 'Official Privacy Policy of Shakil Travels for mobile app and overseas recruitment recruitment platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
        <div className="border-b border-slate-200 pb-6 mb-8">
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full mb-3">
            RL-1558 • GOVT. APPROVED
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mt-2">
            Last Updated: November 02, 2026 | Effective Date: November 02, 2026
          </p>
        </div>

        <div className="space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Introduction</h2>
            <p>
              Welcome to <strong>SHAKIL TRAVELS</strong> (License No: RL-1558), an authorized government-approved overseas recruitment agency registered in Bangladesh. This Privacy Policy applies to our official mobile application (&quot;SHAKIL TRAVELS&quot;) and our web portal at shakiltravels.com.
            </p>
            <p className="mt-2">
              We take the privacy and confidentiality of our prospective candidates, overseas workers, and clients very seriously. This policy explains what information we collect, why we collect it, and how it is protected under national labor regulations (BMET) and international data privacy standards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Information We Collect</h2>
            <p>To provide overseas employment processing and visa tracking services, we may collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Identification Details:</strong> Full Name, Father&apos;s Name, Date of Birth, National ID (NID), and Passport Number.</li>
              <li><strong>Contact Information:</strong> Phone/Mobile Number, WhatsApp Number, Email Address, and Home District.</li>
              <li><strong>Recruitment Documents:</strong> Passport copies, photographs, trade trade certificates, driver&apos;s license copies, GAMCA medical fit certificates, and BMET smart card records.</li>
              <li><strong>Processing Status:</strong> Application codes, visa stamping confirmation numbers, and flight details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. How We Use Your Information</h2>
            <p>Your data is used strictly for legitimate overseas recruitment purposes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Submitting candidate resumes and trade qualifications to verified overseas employers.</li>
              <li>Processing foreign embassy visa stamping and immigration paperwork.</li>
              <li>Securing government clearance and Smart Cards from the Bureau of Manpower, Employment and Training (BMET).</li>
              <li>Enabling candidates to track their live visa and file status via the mobile app.</li>
              <li>Communicating interview schedules, medical test guidelines, and flight briefings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Data Sharing and Disclosure</h2>
            <p>
              We do <strong>not</strong> sell, rent, or trade your personal information to third-party advertisers. Information is only shared with:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Authorized Government Bodies:</strong> Ministry of Expatriates&apos; Welfare and Overseas Employment, BMET, and relevant foreign embassies.</li>
              <li><strong>Verified Overseas Employers:</strong> For interview selection and employment contract issuance.</li>
              <li><strong>Authorized Medical Centers:</strong> GAMCA and designated medical test authorities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Security & Storage</h2>
            <p>
              All personal records and passport information are encrypted both in transit (using modern SSL/TLS encryption) and at rest on secure cloud servers. Access to sensitive applicant files is strictly restricted to authorized agency officers through multi-factor authentication and role-based access control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Children&apos;s Privacy</h2>
            <p>
              Our services and mobile application are intended exclusively for individuals aged 18 and older seeking overseas employment. We do not knowingly collect personal data from minors under 18 years of age.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Contact Us & Data Deletion Requests</h2>
            <p>
              If you have any questions regarding this Privacy Policy, or if you wish to review, update, or request the deletion of your personal data from our recruitment records, please contact us:
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-3 space-y-1 text-sm">
              <p><strong>Agency:</strong> SHAKIL TRAVELS (RL-1558)</p>
              <p><strong>Address:</strong> Nayapaltan, VIP Road, Dhaka-1000, Bangladesh</p>
              <p><strong>Email:</strong> privacy@shakiltravels.com / info@shakiltravels.com</p>
              <p><strong>Hotline:</strong> +880 1711-000000</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
