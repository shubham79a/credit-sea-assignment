'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { StepHeader } from '@/components/portal/StepHeader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useMyLoans } from '@/hooks/useMyLoans';
import { formatDate, formatInr, formatInrPrecise } from '@/lib/format';
import type { Loan } from '@/types';

export default function TrackPage() {
  return (
    <section className="space-y-8">
      <StepHeader
        step={4}
        title="Track application"
        description="Follow your loan from review through disbursement to closure."
      />
      <Suspense fallback={null}>
        <TrackContent />
      </Suspense>
    </section>
  );
}

function TrackContent() {
  const { loans, activeLoan, latestLoan, loading, error } = useMyLoans();
  const justApplied = useSearchParams().get('applied') === '1';

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }
  if (error) return <Alert tone="error">{error}</Alert>;

  if (!latestLoan) {
    return (
      <Alert tone="info">
        You haven&apos;t applied for a loan yet.{' '}
        <Link href="/portal/loan" className="font-medium underline">
          Configure a loan
        </Link>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {justApplied && (
        <Alert tone="success">
          Your application has been submitted. Our sanction team will review it shortly.
        </Alert>
      )}

      <LoanCard loan={activeLoan ?? latestLoan} />

      {!activeLoan && (
        <div className="flex justify-end">
          <Link href="/portal/loan">
            <Button>Apply for a new loan</Button>
          </Link>
        </div>
      )}

      {loans.length > 1 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Previous applications</h2>
          <ul className="mt-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {loans
              .filter((loan) => loan.id !== (activeLoan ?? latestLoan).id)
              .map((loan) => (
                <li key={loan.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  <span className="tabular-nums">
                    {formatInr(loan.principal)} · {loan.tenureDays} days · {formatDate(loan.createdAt)}
                  </span>
                  <StatusBadge status={loan.status} />
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LoanCard({ loan }: { loan: Loan }) {
  const rejection = loan.status === 'REJECTED' ? loan.statusHistory.at(-1)?.reason : undefined;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Loan amount</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{formatInr(loan.principal)}</p>
          <p className="mt-1 text-sm text-slate-500">
            {loan.tenureDays} days at {loan.interestRate}% p.a. · applied {formatDate(loan.createdAt)}
          </p>
        </div>
        <StatusBadge status={loan.status} className="text-sm" />
      </div>

      {rejection && (
        <div className="mt-5">
          <Alert tone="error">
            <span className="font-medium">Reason:</span> {rejection}
          </Alert>
        </div>
      )}

      <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-3">
        <Stat label="Interest" value={formatInrPrecise(loan.interest)} />
        <Stat label="Total repayment" value={formatInrPrecise(loan.totalRepayment)} />
        <Stat label="Outstanding" value={formatInrPrecise(loan.outstanding)} />
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}
