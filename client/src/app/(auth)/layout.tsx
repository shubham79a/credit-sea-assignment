import type { ReactNode } from 'react';

/** Centered card shell shared by the login and register pages. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            CS
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">CreditSea LMS</h1>
          <p className="mt-1 text-sm text-slate-500">Loan Management System</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </main>
  );
}
