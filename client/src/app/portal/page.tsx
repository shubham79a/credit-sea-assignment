'use client';

import Link from 'next/link';
import { BreFailureList } from '@/components/portal/BreFailureList';
import { Stepper } from '@/components/portal/Stepper';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useApplication } from '@/hooks/useApplication';
import { useMyLoans } from '@/hooks/useMyLoans';
import { derivePortalSteps, nextStep, type StepStatus } from '@/lib/portal-steps';

const STATUS_BADGE: Record<StepStatus, { label: string; className: string }> = {
  done: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700' },
  current: { label: 'Up next', className: 'bg-indigo-50 text-indigo-700' },
  blocked: { label: 'Needs attention', className: 'bg-rose-50 text-rose-700' },
  locked: { label: 'Locked', className: 'bg-slate-100 text-slate-500' },
};

export default function PortalHomePage() {
  const { user } = useAuth();
  const { application, loading: appLoading, error: appError } = useApplication();
  const { loans, loading: loansLoading, error: loansError } = useMyLoans();
  const loading = appLoading || loansLoading;
  const error = appError ?? loansError;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const steps = derivePortalSteps(application, loans);
  const current = nextStep(steps);
  const breFailed = application !== null && !application.bre.passed;

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user?.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Complete the steps below to apply for a loan.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <Stepper steps={steps} />
      </div>

      {breFailed && (
        <BreFailureList
          failures={application.bre.failures}
          title="Your last eligibility check did not pass. Update your details to continue."
        />
      )}

      <ol className="grid gap-4 sm:grid-cols-2">
        {steps.map((step, index) => {
          const badge = STATUS_BADGE[step.status];
          const isActionable = step.status !== 'locked';
          return (
            <li
              key={step.key}
              className={`flex flex-col rounded-xl border bg-white p-5 ${
                step.key === current.key ? 'border-indigo-300 shadow-sm' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    {index + 1}
                  </span>
                  <h2 className="font-semibold">{step.title}</h2>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
              <p className="mt-3 flex-1 text-sm text-slate-500">{step.description}</p>
              {isActionable && (
                <div className="mt-4">
                  <Link href={step.href}>
                    <Button
                      size="sm"
                      variant={step.status === 'done' ? 'secondary' : 'primary'}
                    >
                      {step.status === 'done'
                        ? 'Review'
                        : step.status === 'blocked'
                          ? 'Fix details'
                          : 'Continue'}
                    </Button>
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
