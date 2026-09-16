import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { ROLES } from '@/types';

/** Borrower portal shell — only BORROWER accounts may enter. */
export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole roles={[ROLES.BORROWER]}>
      <AppHeader title="Borrower Portal" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </RequireRole>
  );
}
