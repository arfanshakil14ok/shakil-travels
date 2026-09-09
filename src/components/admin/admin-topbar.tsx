'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, LogOut, UserRound, ShieldCheck } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { Badge } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import type { AuthUser } from '@/types';

export interface AdminTopbarProps {
  user: AuthUser | null;
  onToggleSidebarMobile: () => void;
  onToggleSidebarDesktop: () => void;
  isCollapsed: boolean;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  user,
  onToggleSidebarMobile,
  onToggleSidebarDesktop,
  isCollapsed,
}) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs print:hidden">
      {/* Left side: Toggles & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Mobile Toggle */}
        <IconButton
          variant="ghost"
          size="md"
          aria-label="Toggle mobile menu"
          onClick={onToggleSidebarMobile}
          className="lg:hidden text-slate-600 hover:text-navy-900"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </IconButton>

        {/* Desktop Collapse Toggle */}
        <IconButton
          variant="ghost"
          size="md"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleSidebarDesktop}
          className="hidden lg:flex text-slate-600 hover:text-navy-900"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </IconButton>

        {/* Global Search */}
        <div className="relative w-full max-w-xs sm:max-w-sm hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Global search (applicants, jobs, staff)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 transition-colors"
            aria-label="Global search input"
          />
        </div>
      </div>

      {/* Right side: Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Icon Button */}
        <div className="relative">
          <IconButton
            variant="ghost"
            size="md"
            aria-label="View notifications"
            className="text-slate-600 hover:text-navy-900"
            onClick={() => router.push('/admin/dashboard')}
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
          </IconButton>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* User Profile Menu */}
        <Dropdown
          trigger={
            <button
              className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition-colors text-left"
              aria-label="User account menu"
            >
              <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center font-semibold text-xs shadow-xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : <UserRound className="w-4 h-4" />}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user?.name || 'Administrator'}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge variant={user?.role?.name === 'SUPER_ADMIN' ? 'gold' : 'navy'} size="sm">
                    {user?.role?.name || 'STAFF'}
                  </Badge>
                </div>
              </div>
            </button>
          }
          items={[
            {
              label: 'System Dashboard',
              onClick: () => router.push('/admin/dashboard'),
              icon: <ShieldCheck className="w-4 h-4" />,
            },
            {
              label: 'Logout',
              onClick: handleLogout,
              icon: <LogOut className="w-4 h-4" />,
              variant: 'destructive',
              disabled: isLoggingOut,
            },
          ]}
        />
      </div>
    </header>
  );
};
