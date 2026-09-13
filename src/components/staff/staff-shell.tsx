'use client';

import React, { useState } from 'react';
import { StaffSidebar } from './staff-sidebar';
import { AdminTopbar } from '@/components/admin/admin-topbar';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/types';

export interface StaffShellProps {
  user: AuthUser | null;
  children: React.ReactNode;
}

export const StaffShell: React.FC<StaffShellProps> = ({ user, children }) => {
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSidebarCollapsedDesktop, setIsSidebarCollapsedDesktop] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex print:bg-white print:block">
      {/* Staff Sidebar */}
      <StaffSidebar
        isOpen={isSidebarOpenMobile}
        onClose={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isSidebarCollapsedDesktop}
        user={user}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out',
          isSidebarCollapsedDesktop ? 'lg:pl-20' : 'lg:pl-64',
          'print:pl-0 print:p-0'
        )}
      >
        <AdminTopbar
          user={user}
          onToggleSidebarMobile={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          onToggleSidebarDesktop={() => setIsSidebarCollapsedDesktop(!isSidebarCollapsedDesktop)}
          isCollapsed={isSidebarCollapsedDesktop}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200 print:p-0 print:m-0 print:max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
};
