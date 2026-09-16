'use client';

import { useAuth } from '@/context/AuthContext';

const STEPS = ['Personal details', 'Salary slip', 'Loan configuration', 'Track application'];

export default function PortalHomePage() {
  const { user } = useAuth();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user?.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Complete the steps below to apply for a loan.
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2">
        {STEPS.map((step, index) => (
          <li
            key={step}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-medium">{step}</p>
              <p className="text-xs text-slate-500">Coming next</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
