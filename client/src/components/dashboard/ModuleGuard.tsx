'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MODULES, canAccessModule, type ModuleKey } from '@/lib/dashboard-modules';
import { ROUTES } from '@/lib/routes';

/**
 * Client-side half of module RBAC (proxy.ts handles the edge). Renders nothing
 * and redirects to the dashboard home if the signed-in role doesn't own it.
 */
export function ModuleGuard({ module, children }: { module: ModuleKey; children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const def = MODULES.find((m) => m.key === module)!;
  const allowed = user ? canAccessModule(user.role, def) : false;

  useEffect(() => {
    if (user && !allowed) router.replace(ROUTES.dashboard);
  }, [user, allowed, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
