import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { CandidateProfileWizard } from '@/components/portal/category-wizard/candidate-profile-wizard';
import { BRAND } from '@/config/brand';

export const metadata = {
  title: `চাকরির আবেদন | ${BRAND.name} (লাইসেন্স ${BRAND.licenseNumber})`,
  description: 'ক্যাটাগরি ভিত্তিক স্টেপ-বাই-স্টেপ প্রোফাইল তথ্য পূরণ ও চাকরির আবেদন।',
};

interface ApplyJobPageProps {
  params: Promise<{ jobId: string }>;
}

export default async function ApplyJobPage({ params }: ApplyJobPageProps) {
  const { jobId } = await params;

  return (
    <div className="space-y-5 max-w-4xl mx-auto font-sans">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-[#66758A] font-bengali">
        <Link href="/portal" className="hover:text-[#102B50] transition-colors">
          ড্যাশবোর্ড
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/portal/jobs" className="hover:text-[#102B50] transition-colors">
          চাকরির সার্কুলার
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#102B50] font-bold">স্টেপ-বাই-স্টেপ আবেদন</span>
      </nav>

      {/* Main Category Wizard */}
      <CandidateProfileWizard jobId={jobId} isModal={false} />
    </div>
  );
}
