'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  GraduationCap,
  HeartPulse,
  Stamp,
  ShieldCheck,
  Plane,
  Receipt,
  Headset,
  X,
  FileCheck2,
  Building2,
  ClipboardList,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/brand/brand-logo';
import type { AuthUser } from '@/types';

interface StaffNavItem {
  title: string;
  banglaTitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roleRequirement?: string[];
}

const STAFF_NAV_ITEMS: StaffNavItem[] = [
  {
    title: 'Staff Dashboard',
    banglaTitle: 'ড্যাশবোর্ড',
    href: '/staff/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Overseas Employers',
    banglaTitle: 'নিয়োগকারী কোম্পানি',
    href: '/staff/employers',
    icon: Building2,
    roleRequirement: ['SUPER_ADMIN', 'ADMIN', 'RECRUITMENT_MANAGER', 'RECRUITER', 'RECRUITMENT_STAFF'],
  },
  {
    title: 'Overseas Jobs & Demands',
    banglaTitle: 'চাকরি ও ভিসা ডিমান্ড',
    href: '/staff/jobs',
    icon: BriefcaseBusiness,
    roleRequirement: ['SUPER_ADMIN', 'ADMIN', 'RECRUITMENT_MANAGER', 'RECRUITER'],
  },
  {
    title: 'Applications & Pipeline',
    banglaTitle: 'আবেদন ও নিয়োগ পাইপলাইন',
    href: '/staff/applications',
    icon: ClipboardList,
    roleRequirement: ['SUPER_ADMIN', 'ADMIN', 'RECRUITMENT_MANAGER', 'RECRUITER', 'RECRUITMENT_STAFF'],
  },
  {
    title: 'Post-Selection Processing',
    banglaTitle: 'সিলেকশন পরবর্তী প্রসেসিং',
    href: '/staff/processing',
    icon: ShieldCheck,
    roleRequirement: ['SUPER_ADMIN', 'ADMIN', 'RECRUITMENT_MANAGER', 'RECRUITER', 'VISA_OFFICER', 'RECRUITMENT_STAFF'],
  },
  {
    title: 'Candidates & Applicants',
    banglaTitle: 'প্রার্থী ও আবেদনকারী',
    href: '/admin/applicants',
    icon: Users,
    roleRequirement: ['SUPER_ADMIN', 'ADMIN', 'RECRUITMENT_MANAGER', 'RECRUITER', 'RECRUITMENT_STAFF'],
  },
  {
    title: 'Skill Training & Batches',
    banglaTitle: 'স্কিল ট্রেনিং ও ব্যাচ',
    href: '/staff/training',
    icon: GraduationCap,
    roleRequirement: ['SUPER_ADMIN', 'ADMIN', 'TRAINING_MANAGER'],
  },
  {
    title: 'Document Verification',
    banglaTitle: 'ডকুমেন্ট ভেরিফিকেশন',
    href: '/admin/documents',
    icon: FileCheck2,
    roleRequirement: ['SUPER_ADMIN', 'ADMIN', 'DOCUMENT_OFFICER', 'RECRUITMENT_STAFF'],
  },
  {
    title: 'Medical Processing (GAMCA)',
    banglaTitle: 'মেডিকেল ও গামকা রিপোর্ট',
    href: '/staff/medical',
    icon: HeartPulse,
    roleRequirement: ['SUPER_ADMIN', 'ADMIN', 'VISA_OFFICER', 'RECRUITMENT_MANAGER'],
  },
  {
    title: 'Visa & Endorsement',
    banglaTitle: 'ভিসা ও ইমিগ্রেশন',
    href: '/admin/visa',
    icon: Stamp,
    roleRequirement: ['SUPER_ADMIN', 'ADMIN', 'VISA_OFFICER'],
  },
  {
    title: 'BMET Clearance & Smart Card',
    banglaTitle: 'বিএমইটি ক্লিয়ারেন্স ও স্মার্ট কার্ড',
    href: '/staff/clearance',
    icon: ShieldCheck,
    roleRequirement: ['SUPER_ADMIN', 'ADMIN', 'VISA_OFFICER', 'RECRUITMENT_MANAGER'],
  },
  {
    title: 'Departure & Flight Operations',
    banglaTitle: 'ফ্লাইট টিকিট ও ডিপার্চার',
    href: '/staff/departure',
    icon: Plane,
    roleRequirement: ['SUPER_ADMIN', 'ADMIN', 'VISA_OFFICER', 'RECRUITMENT_MANAGER'],
  },
  {
    title: 'Finance & Accounting',
    banglaTitle: 'ফাইন্যান্স ও অ্যাকাউন্টিং',
    href: '/staff/finance',
    icon: Receipt,
    roleRequirement: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'ACCOUNTS_STAFF', 'RECRUITMENT_MANAGER'],
  },
  {
    title: 'Invoices & Billing',
    banglaTitle: 'ইনভয়েস ও রসিদ ব্যবস্থাপনা',
    href: '/staff/invoices',
    icon: FileCheck2,
    roleRequirement: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'ACCOUNTS_STAFF', 'RECRUITMENT_MANAGER', 'RECRUITER'],
  },
  {
    title: 'Support Tickets',
    banglaTitle: 'ক্যান্ডিডেট সাপোর্ট ডেস্ক',
    href: '/staff/support',
    icon: Headset,
    roleRequirement: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_OFFICER'],
  },
  {
    title: 'Main Website',
    banglaTitle: 'মূল ওয়েবসাইট (হোমপেজ)',
    href: '/',
    icon: ExternalLink,
  },
];

interface StaffSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  user: AuthUser | null;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  user,
}) => {
  const pathname = usePathname();
  const userRole = user?.role?.name || '';

  const filteredItems = STAFF_NAV_ITEMS.filter((item) => {
    if (!item.roleRequirement || item.roleRequirement.length === 0) return true;
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') return true;
    return item.roleRequirement.includes(userRole);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Header / Brand */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 shrink-0">
          <Link href="/staff/dashboard" className="flex items-center gap-3 group">
            <BrandMark size="sm" />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm text-white tracking-tight leading-tight">
                  SHAKIL GLOBAL
                </span>
                <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">
                  Staff ERP • কর্মকর্তা
                </span>
              </div>
            )}
          </Link>

          {/* Close button for mobile */}
          <button
            type="button"
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Badge */}
        {!isCollapsed && user && (
          <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 text-xs">
            <div className="text-slate-400 text-[11px]">Logged in as:</div>
            <div className="font-semibold text-slate-200 truncate">{user.name}</div>
            <div className="inline-block mt-1 text-[10px] uppercase font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-700/60 px-2 py-0.5 rounded">
              {user.role?.description || user.role?.name}
            </div>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/staff/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => {
                  if (isOpen) onClose();
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors group',
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                  )}
                />
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal truncate">
                      {item.banglaTitle}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
          {!isCollapsed ? (
            <div>RL-1892 • Staff Workspace</div>
          ) : (
            <div className="text-[10px]">RL-1892</div>
          )}
        </div>
      </aside>
    </>
  );
};
