import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { StaffShell } from '@/components/staff/staff-shell';

export const dynamic = 'force-dynamic';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // If unauthenticated or on login route, render children without shell
  if (!user) {
    return <>{children}</>;
  }

  return <StaffShell user={user}>{children}</StaffShell>;
}
