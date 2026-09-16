'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ROUTES, homeForRole } from '@/lib/routes';
import type { Role } from '@/types';

/**
 * Client-side guard used inside protected layouts. `proxy.ts` already blocks
 * most bad requests at the edge; this covers the in-app case where the token
 * expires or the profile fails to load after hydration.
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(ROUTES.login);
    } else if (!roles.includes(user.role)) {
      router.replace(homeForRole(user.role));
    }
  }, [loading, user, roles, router]);

  if (loading || !user || !roles.includes(user.role)) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
