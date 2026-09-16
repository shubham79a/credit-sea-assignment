import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { EXECUTIVE_ROLES } from '@/types';

/** Operations dashboard shell — executives and admin only. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole roles={EXECUTIVE_ROLES}>
      <AppHeader title="Operations Dashboard" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </RequireRole>
  );
}
