import type { ReactNode } from 'react';

const HIGHLIGHTS = [
  { title: 'Instant eligibility check', text: 'Age, income, PAN and employment rules run the moment you submit.' },
  { title: 'Transparent pricing', text: 'Fixed 12% p.a. simple interest — see your total repayment before you apply.' },
  { title: 'Track every step', text: 'From review to disbursement to closure, always know where your loan stands.' },
];

/**
 * Auth shell. On small screens: a centered card. On large screens: a brand
 * panel on the left and the form on the right so the width is put to use.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1">
      {/* Brand panel — large screens only */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-indigo-600 p-12 text-white lg:flex xl:p-16">
        <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/60" />
        <div aria-hidden className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-indigo-700/60" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-base font-bold text-indigo-600">
            CS
          </div>
          <div>
            <p className="text-lg font-semibold leading-tight">CreditSea LMS</p>
            <p className="text-sm text-indigo-200">Loan Management System</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
            Personal loans from ₹50,000 to ₹5,00,000 — decided in minutes.
          </h2>
          <ul className="mt-8 space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs">✓</span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-indigo-200">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-indigo-300">Borrower portal · Operations dashboard · Role-based access</p>
      </aside>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md lg:max-w-lg">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
              CS
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">CreditSea LMS</h1>
            <p className="mt-1 text-sm text-slate-500">Loan Management System</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">{children}</div>
        </div>
      </div>
    </main>
  );
}
