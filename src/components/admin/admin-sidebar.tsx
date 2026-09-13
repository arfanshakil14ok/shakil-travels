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
  MessageCircle,
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
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'RECRUITMENT',
    items: [
      { title: 'Applicants', href: '/admin/applicants', icon: Users },
      { title: 'Applications', href: '/admin/applications', icon: ClipboardList },
      { title: 'Pipeline Board', href: '/admin/applications/pipeline', icon: Layers },
      { title: 'Interviews', href: '/admin/interviews', icon: CalendarCheck },
      { title: 'Jobs', href: '/admin/jobs', icon: BriefcaseBusiness },
      { title: 'Employers', href: '/admin/employers', icon: Building2 },
      { title: 'Job Categories', href: '/admin/job-categories', icon: ClipboardList },
    ],
  },
  {
    title: 'DOCUMENTS',
    items: [
      { title: 'Documents', href: '/admin/documents', icon: Files },
      { title: 'Document Types', href: '/admin/document-types', icon: ShieldCheck },
    ],
  },
  {
    title: 'FINANCE & ACCOUNTS',
    items: [
      { title: 'Accounts Overview', href: '/admin/accounts', icon: Landmark },
      { title: 'Invoices', href: '/admin/invoices', icon: Receipt },
      { title: 'Payments & Receipts', href: '/admin/payments', icon: CreditCard },
      { title: 'Customer Ledger', href: '/admin/accounts/ledger', icon: Wallet },
      { title: 'Service Catalog', href: '/admin/services', icon: BriefcaseBusiness },
      { title: 'Financial Reports', href: '/admin/accounts/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    title: 'VISA & IMMIGRATION',
    items: [
      { title: 'Visa Operations', href: '/admin/visa', icon: Stamp },
      { title: 'Visa Cases', href: '/admin/visa/applications', icon: ClipboardList },
      { title: 'Visa Criteria', href: '/admin/visa-information', icon: FileCheck2 },
      { title: 'Countries', href: '/admin/countries', icon: Globe2 },
      { title: 'Country Guidelines', href: '/admin/country-information', icon: ShieldCheck },
    ],
  },
  {
    title: 'COMMUNICATIONS & LEADS',
    items: [
      { title: 'Inquiries & Leads', href: '/admin/inquiries', icon: MessageSquare },
      { title: 'Message Delivery', href: '/admin/communications', icon: Send },
      { title: 'Message Templates', href: '/admin/communications/templates', icon: FileText },
      { title: 'Articles & Overseas News', href: '/admin/blog', icon: BookOpen },
      { title: 'Migrant Advisories', href: '/admin/migrant-information', icon: Info },
    ],
  },
  {
    title: 'ENTERPRISE REPORTS',
    items: [
      { title: 'Recruitment Funnel', href: '/admin/reports/recruitment', icon: ChartNoAxesCombined },
      { title: 'Job Performance', href: '/admin/reports/jobs', icon: BriefcaseBusiness },
      { title: 'Country Analytics', href: '/admin/reports/countries', icon: Globe2 },
      { title: 'Staff Performance', href: '/admin/reports/staff-performance', icon: UserCheck },
      { title: 'Staff Workload', href: '/admin/reports/staff-workload', icon: ListTodo },
      { title: 'Financial Analytics', href: '/admin/reports/financial', icon: Landmark },
      { title: 'Visa Analytics', href: '/admin/reports/visa', icon: Stamp },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { title: 'Users', href: '/admin/users', icon: Users },
      { title: 'Settings', href: '/admin/settings', icon: Settings },
      { title: 'Audit Logs', href: '/admin/audit-logs', icon: History },
      { title: 'Trash / রিসাইকেল বিন', href: '/admin/trash', icon: Trash2 },
    ],
  },
  {
    title: 'MAIN WEBSITE',
    items: [
      { title: 'Public Homepage', href: '/', icon: ExternalLink },
      { title: 'Public Job Board', href: '/jobs', icon: BriefcaseBusiness },
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
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 overflow-hidden">
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
