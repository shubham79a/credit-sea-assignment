'use client';

import { useAuth } from '@/context/AuthContext';
import { ROLES, type Role } from '@/types';

const MODULES: { key: string; label: string; description: string; roles: Role[] }[] = [
  { key: 'sales', label: 'Sales', description: 'Registered users who have not applied yet', roles: [ROLES.SALES] },
  { key: 'sanction', label: 'Sanction', description: 'Review applied loans — approve or reject', roles: [ROLES.SANCTION] },
  { key: 'disbursement', label: 'Disbursement', description: 'Release funds for sanctioned loans', roles: [ROLES.DISBURSEMENT] },
  { key: 'collection', label: 'Collection', description: 'Record repayments on disbursed loans', roles: [ROLES.COLLECTION] },
];

export default function DashboardHomePage() {
  const { user } = useAuth();
  const visible = MODULES.filter((m) => user?.role === ROLES.ADMIN || m.roles.includes(user!.role));

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Operations Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as <span className="font-medium text-slate-700">{user?.role}</span>. You can see{' '}
          {visible.length === MODULES.length ? 'all modules' : 'your module only'}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((module) => (
          <div key={module.key} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">{module.label}</h2>
            <p className="mt-1 text-sm text-slate-500">{module.description}</p>
            <p className="mt-3 text-xs text-slate-400">Module coming next</p>
          </div>
        ))}
      </div>
    </section>
  );
}
