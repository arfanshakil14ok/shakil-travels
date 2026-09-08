import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { AdminShell } from '@/components/admin/admin-shell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // If on login route or unauthenticated, children handles login layout
  if (!user) {
    return <>{children}</>;
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
