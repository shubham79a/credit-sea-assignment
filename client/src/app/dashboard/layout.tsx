import type { ReactNode } from 'react';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { AppHeader } from '@/components/layout/AppHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { EXECUTIVE_ROLES } from '@/types';

/** Operations dashboard shell — executives and admin only; nav is role-scoped. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole roles={EXECUTIVE_ROLES}>
      <AppHeader title="Operations Dashboard" />
      {/* Fluid: dashboards use the full viewport width — tables need the room. */}
      <div className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-8 lg:py-8">
        <DashboardNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </RequireRole>
  );
}
