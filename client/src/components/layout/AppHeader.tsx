'use client';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

/** Top bar shown on every authenticated page: brand, current user, sign out. */
export function AppHeader({ title }: { title: string }) {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            CS
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">CreditSea LMS</p>
            <p className="text-xs text-slate-500">{title}</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">{user.role}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
