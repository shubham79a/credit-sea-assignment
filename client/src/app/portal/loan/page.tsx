'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { LoanSummary } from '@/components/portal/LoanSummary';
import { StepHeader } from '@/components/portal/StepHeader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useApplication } from '@/hooks/useApplication';
import { useMyLoans } from '@/hooks/useMyLoans';
import { ApiError } from '@/lib/api';
import { formatDate, formatInr } from '@/lib/format';
import { LOAN_RULES, calculateLoan } from '@/lib/loan-math';
import { applyForLoan } from '@/lib/loans';
import type { Loan } from '@/types';

export default function LoanConfigPage() {
  const application = useApplication();
  const loans = useMyLoans();
  const loading = application.loading || loans.loading;
  const error = application.error ?? loans.error;

  return (
    <section className="space-y-8">
      <StepHeader
        step={3}
        title="Loan configuration"
        description="Choose your loan amount and tenure. Interest is fixed at 12% per annum, simple interest."
      />

      {loading ? (
        <Spinner />
      ) : error ? (
        <Alert tone="error">{error}</Alert>
      ) : !application.application || !application.application.bre.passed ? (
        <Gate text="Complete your personal details and pass the eligibility check first." href="/portal/personal-details" cta="Go to step 1" />
      ) : !application.application.salarySlip ? (
        <Gate text="Upload your salary slip before configuring a loan." href="/portal/salary-slip" cta="Go to step 2" />
      ) : loans.activeLoan ? (
        <ActiveLoanNotice loan={loans.activeLoan} />
      ) : (
        <LoanConfigurator previous={loans.latestLoan} onApplied={loans.refetch} />
      )}
    </section>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );
}

function Gate({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <Alert tone="warning">
      <p className="font-medium">{text}</p>
      <Link href={href} className="mt-1 inline-block font-medium underline">
        {cta}
      </Link>
    </Alert>
  );
}

/** Shown instead of the form while a loan is APPLIED / SANCTIONED / DISBURSED. */
function ActiveLoanNotice({ loan }: { loan: Loan }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">You already have a loan in progress</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatInr(loan.principal)}</p>
          <p className="text-sm text-slate-500">
            {loan.tenureDays} days · applied {formatDate(loan.createdAt)}
          </p>
        </div>
        <StatusBadge status={loan.status} />
      </div>
      <p className="mt-4 text-sm text-slate-600">
        Only one loan can be active at a time. You can apply again once this one is closed.
      </p>
      <div className="mt-5">
        <Link href="/portal/track">
          <Button>Track this application</Button>
        </Link>
      </div>
    </div>
  );
}

function LoanConfigurator({
  previous,
  onApplied,
}: {
  previous: Loan | null;
  onApplied: () => Promise<void>;
}) {
  const router = useRouter();
  const [principal, setPrincipal] = useState(previous?.principal ?? 100_000);
  const [tenureDays, setTenureDays] = useState(previous?.tenureDays ?? 180);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live panel: recomputed on every slider move (client mirror of the server formula).
  const quote = useMemo(() => calculateLoan(principal, tenureDays), [principal, tenureDays]);

  async function handleApply() {
    setSubmitting(true);
    setError(null);
    try {
      await applyForLoan({ principal, tenureDays });
      await onApplied();
      router.push('/portal/track?applied=1');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit your application. Please try again.');
      setSubmitting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        {previous?.status === 'REJECTED' && (
          <Alert tone="warning">
            Your previous application was rejected
            {previous.statusHistory.at(-1)?.reason ? ` — “${previous.statusHistory.at(-1)?.reason}”` : ''}.
            You can submit a new one.
          </Alert>
        )}
        {error && <Alert tone="error">{error}</Alert>}

        <Slider
          label="Loan amount"
          value={principal}
          min={LOAN_RULES.MIN_AMOUNT}
          max={LOAN_RULES.MAX_AMOUNT}
          step={LOAN_RULES.AMOUNT_STEP}
          onChange={setPrincipal}
          format={formatInr}
          minLabel="₹50,000"
          maxLabel="₹5,00,000"
          disabled={submitting}
        />

        <Slider
          label="Tenure"
          value={tenureDays}
          min={LOAN_RULES.MIN_TENURE_DAYS}
          max={LOAN_RULES.MAX_TENURE_DAYS}
          step={1}
          onChange={setTenureDays}
          format={(v) => `${v} days`}
          unit="days"
          disabled={submitting}
        />

        {confirming ? (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-sm font-medium text-slate-800">
              Apply for {formatInr(principal)} over {tenureDays} days, repaying{' '}
              <span className="font-semibold">{formatInr(quote.totalRepayment)}</span>?
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Your details and documents will be locked while the application is reviewed.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirming(false)} disabled={submitting}>
                Back
              </Button>
              <Button onClick={handleApply} loading={submitting}>
                Confirm &amp; apply
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button size="lg" onClick={() => setConfirming(true)}>
              Apply for {formatInr(principal)}
            </Button>
          </div>
        )}
      </div>

      <LoanSummary quote={quote} />
    </div>
  );
}
