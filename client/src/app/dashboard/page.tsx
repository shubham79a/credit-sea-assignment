'use client';

import Link from 'next/link';
import { ModuleHeader, Spinner, StatCard } from '@/components/dashboard/primitives';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getSummary } from '@/lib/dashboard';
import { modulesForRole } from '@/lib/dashboard-modules';
import { LOAN_STATUS_LABELS, ROLES } from '@/types';

export default function DashboardHomePage() {
  const { user } = useAuth();
  const { data: summary, loading, error } = useAsyncData(getSummary, 'Could not load summary');
  if (!user) return null;

  const modules = modulesForRole(user.role);

  return (
    <section className="space-y-8">
      <ModuleHeader
        title="Overview"
        description={
          user.role === ROLES.ADMIN
            ? 'You have access to every module.'
            : `Signed in as ${user.role} — you can see your module only.`
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <Spinner />
      ) : summary && summary.visibleStatuses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {summary.visibleStatuses.map((status) => (
            <StatCard
              key={status}
              label={LOAN_STATUS_LABELS[status]}
              value={summary.loansByStatus[status] ?? 0}
              hint="loans"
            />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((module) => (
          <div key={module.key} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">{module.label}</h2>
            <p className="mt-1 flex-1 text-sm text-slate-500">{module.description}</p>
            <div className="mt-4">
              <Link href={module.href}>
                <Button size="sm">Open {module.label}</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
