'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  Files,
  Receipt,
  CreditCard,
  Stamp,
  Globe2,
  Info,
  ChartNoAxesCombined,
  Settings,
  History,
  ShieldCheck,
  Layers,
  Landmark,
  Wallet,
  FileCheck2,
  BookOpen,
  MessageSquare,
  Send,
  FileText,
  UserCheck,
  ListTodo,
  X,
  ExternalLink,
  Trash2,
  GraduationCap,
  Inbox,
  Columns3,
  CheckSquare,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui/icon-button';
import { BRAND } from '@/config/brand';
import { BrandMark } from '@/components/brand/brand-logo';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isComingSoon?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {
        title: 'ড্যাশবোর্ড (Dashboard)',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'ইনবক্স (Inbox)',
        href: '/admin/inquiries',
        icon: Inbox,
      },
    ],
  },
  {
    title: 'টাস্ক ও ক্যালেন্ডার',
    items: [
      {
        title: 'ফাইল কানবান বোর্ড',
        href: '/admin/applications/pipeline',
        icon: Columns3,
      },
      {
        title: 'টাস্ক ও কার্যাবলী',
        href: '/admin/tasks',
        icon: CheckSquare,
      },
      {
        title: 'বিজনেস ক্যালেন্ডার',
        href: '/admin/calendar',
        icon: Calendar,
      },
      {
        title: 'হোয়াটসঅ্যাপ ও এসএমএস',
        href: '/admin/whatsapp-sms',
        icon: MessageSquare,
      },
    ],
  },
  {
    title: 'রিক্রুটমেন্ট ও নিয়োগ (RECRUITMENT)',
    items: [
      { title: 'আবেদনকারী (Applicants)', href: '/admin/applicants', icon: Users },
      { title: 'আবেদনসমূহ (Applications)', href: '/admin/applications', icon: ClipboardList },
      { title: 'পাইপলাইন বোর্ড (Pipeline)', href: '/admin/applications/pipeline', icon: Layers },
      { title: 'ইন্টারভিউ (Interviews)', href: '/admin/interviews', icon: CalendarCheck },
      { title: 'চাকরির সার্কুলার (Jobs)', href: '/admin/jobs', icon: BriefcaseBusiness },
      { title: 'নিয়োগকারী কোম্পানি (Employers)', href: '/admin/employers', icon: Building2 },
      { title: 'চাকরির ক্যাটাগরি (Categories)', href: '/admin/job-categories', icon: ClipboardList },
    ],
  },
  {
    title: 'ডকুমেন্ট ও ফাইল (DOCUMENTS)',
    items: [
      { title: 'সমস্ত ডকুমেন্টস (Documents)', href: '/admin/documents', icon: Files },
      { title: 'ডকুমেন্ট ক্যাটাগরি (Doc Types)', href: '/admin/document-types', icon: ShieldCheck },
    ],
  },
  {
    title: 'ট্রেনিং ও স্কিল (TRAINING)',
    items: [
      { title: 'প্রশিক্ষণ ও সনদ (Training)', href: '/admin/training', icon: GraduationCap },
    ],
  },
  {
    title: 'হিসাব ও ফাইন্যান্স (FINANCE)',
    items: [
      { title: 'একাউন্টস ওভারভিউ (Accounts)', href: '/admin/accounts', icon: Landmark },
      { title: 'ইনভয়েস ও বিল (Invoices)', href: '/admin/invoices', icon: Receipt },
      { title: 'পেমেন্ট ও রসিদ (Payments)', href: '/admin/payments', icon: CreditCard },
      { title: 'কাস্টমার লেজার (Ledger)', href: '/admin/accounts/ledger', icon: Wallet },
      { title: 'সার্ভিস ক্যাটালগ (Services)', href: '/admin/services', icon: BriefcaseBusiness },
      { title: 'আর্থিক রিপোর্ট (Financial Reports)', href: '/admin/accounts/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    title: 'ভিসা ও ইমিগ্রেশন (VISA)',
    items: [
      { title: 'ভিসা প্রসেসিং (Visa Operations)', href: '/admin/visa', icon: Stamp },
      { title: 'ভিসা কেসসমূহ (Visa Cases)', href: '/admin/visa/applications', icon: ClipboardList },
      { title: 'ভিসার নীতিমালা (Visa Criteria)', href: '/admin/visa-information', icon: FileCheck2 },
      { title: 'অনুমোদিত দেশসমূহ (Countries)', href: '/admin/countries', icon: Globe2 },
      { title: 'দেশভিত্তিক গাইডলাইন (Guidelines)', href: '/admin/country-information', icon: ShieldCheck },
    ],
  },
  {
    title: 'যোগাযোগ ও মেসেজ (COMMUNICATIONS)',
    items: [
      { title: 'মেসেজ ডেলিভারি (Delivery)', href: '/admin/communications', icon: Send },
      { title: 'মেসেজ টেমপ্লেট (Templates)', href: '/admin/communications/templates', icon: FileText },
      { title: 'নিউজ ও ব্লগ (News & Blog)', href: '/admin/blog', icon: BookOpen },
      { title: 'প্রবাসী সহায়িকা (Advisories)', href: '/admin/migrant-information', icon: Info },
    ],
  },
  {
    title: 'ব্যবসায়িক রিপোর্ট (REPORTS)',
    items: [
      { title: 'রিক্রুটমেন্ট ফানেল (Funnel)', href: '/admin/reports/recruitment', icon: ChartNoAxesCombined },
      { title: 'জব পারফরম্যান্স (Job Analytics)', href: '/admin/reports/jobs', icon: BriefcaseBusiness },
      { title: 'দেশভিত্তিক অ্যানালিটিক্স (Countries)', href: '/admin/reports/countries', icon: Globe2 },
      { title: 'স্টাফ পারফরম্যান্স (Staff Reports)', href: '/admin/reports/staff-performance', icon: UserCheck },
      { title: 'স্টাফ কাজের চাপ (Workload)', href: '/admin/reports/staff-workload', icon: ListTodo },
      { title: 'আর্থিক অ্যানালিটিক্স (Financial)', href: '/admin/reports/financial', icon: Landmark },
      { title: 'ভিসা অ্যানালিটিক্স (Visa Analytics)', href: '/admin/reports/visa', icon: Stamp },
    ],
  },
  {
    title: 'সিস্টেম ও নিরাপত্তা (SYSTEM)',
    items: [
      { title: 'ইউজার ও স্টাফ (Users)', href: '/admin/users', icon: Users },
      { title: 'কোম্পানি সেটিংস (Settings)', href: '/admin/settings', icon: Settings },
      { title: 'অডিট ট্রেইল (Audit Logs)', href: '/admin/audit-logs', icon: History },
      { title: 'রিসাইকেল বিন (Trash)', href: '/admin/trash', icon: Trash2 },
    ],
  },
  {
    title: 'মূল ওয়েবসাইট (WEBSITE)',
    items: [
      { title: 'ওয়েবসাইট হোমপেজ (Homepage)', href: '/', icon: ExternalLink },
      { title: 'পাবলিক জব বোর্ড (Job Board)', href: '/jobs', icon: BriefcaseBusiness },
    ],
  },
];

export interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose, isCollapsed }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 bg-navy-950 text-slate-200 border-r border-navy-800/80 flex flex-col transition-all duration-300 ease-in-out print:hidden',
          // Desktop widths
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          // Mobile state
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-navy-800/80 bg-navy-900/50 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden" title="Go to Main Homepage">
            <BrandMark size="sm" />
            {(!isCollapsed || isOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-xs uppercase tracking-tight text-white truncate font-sans">
                  {BRAND.name}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold tracking-tight truncate">
                  Admin Panel • অ্যাডমিন প্যানেল
                </span>
              </div>
            )}
          </Link>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Close sidebar"
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </IconButton>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-navy-800">
          {NAV_SECTIONS.map((section, sIndex) => (
            <div key={sIndex} className="space-y-1">
              {section.title && (!isCollapsed || isOpen) && (
                <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {section.title}
                </div>
              )}
              {section.title && isCollapsed && !isOpen && (
                <div className="border-t border-navy-800/60 my-2" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onClose()}
                      title={isCollapsed && !isOpen ? item.title : undefined}
                      className={cn(
                        'group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors relative',
                        isActive
                          ? 'bg-navy-800 text-white font-semibold shadow-sm'
                          : 'text-slate-300 hover:bg-navy-900 hover:text-white'
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-400 rounded-r-full" />
                      )}
                      <Icon
                        className={cn(
                          'w-4 h-4 flex-shrink-0 transition-colors',
                          isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                        )}
                        aria-hidden="true"
                      />
                      {(!isCollapsed || isOpen) && (
                        <div className="flex items-center justify-between flex-1 truncate">
                          <span className="truncate">{item.title}</span>
                          {item.isComingSoon && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-navy-900 text-slate-400 font-mono">
                              Soon
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Area */}
        <div className="p-3 border-t border-navy-800/80 bg-navy-900/30 flex-shrink-0">
          <div className={cn('flex items-center gap-2 text-slate-400 text-[11px]', isCollapsed && !isOpen && 'justify-center')}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {(!isCollapsed || isOpen) && <span>Phase 2 Active</span>}
          </div>
        </div>
      </aside>
    </>
  );
};
