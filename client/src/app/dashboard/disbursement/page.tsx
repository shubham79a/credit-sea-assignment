'use client';

import { useState } from 'react';
import { LoanQueue, type QueueHelpers } from '@/components/dashboard/LoanQueue';
import { ModuleGuard } from '@/components/dashboard/ModuleGuard';
import { ModuleHeader } from '@/components/dashboard/primitives';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/lib/api';
import { disburseLoan } from '@/lib/dashboard';
import { formatDate, formatInr } from '@/lib/format';
import { LOAN_STATUS, type LoanWithRelations } from '@/types';

export default function DisbursementPage() {
  return (
    <ModuleGuard module="disbursement">
      <section className="space-y-6">
        <ModuleHeader
          title="Disbursement"
          description="Release funds for sanctioned loans. Disbursed loans move to the Collection queue."
        />
        <LoanQueue
          tabs={[
            { status: LOAN_STATUS.SANCTIONED, label: 'Ready to disburse' },
            { status: LOAN_STATUS.DISBURSED, label: 'Disbursed' },
          ]}
          renderActions={(loan, helpers) => <DisburseActions loan={loan} helpers={helpers} />}
        />
      </section>
    </ModuleGuard>
  );
}

function DisburseActions({ loan, helpers }: { loan: LoanWithRelations; helpers: QueueHelpers }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loan.status !== LOAN_STATUS.SANCTIONED) {
    return <p className="text-sm text-slate-500">This loan has been {loan.status.toLowerCase()} — no further action here.</p>;
  }

  const sanctioned = loan.statusHistory.find((h) => h.to === LOAN_STATUS.SANCTIONED);

  async function disburse() {
    setBusy(true);
    setError(null);
    try {
      const updated = await disburseLoan(loan.id);
      helpers.notify(`${formatInr(loan.principal)} disbursed to ${loan.user.name}`);
      await helpers.refresh(updated);
      setConfirming(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Disbursement</h3>
      {sanctioned && (
        <p className="text-sm text-slate-600">Sanctioned on {formatDate(sanctioned.at)}.</p>
      )}
      {error && <Alert tone="error">{error}</Alert>}

      {confirming ? (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-sm font-medium text-slate-800">
            Confirm that {formatInr(loan.principal)} has been released to {loan.user.name}?
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Repayment of {formatInr(loan.totalRepayment)} becomes collectible immediately.
          </p>
          <div className="mt-3 flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={busy}>Back</Button>
            <Button onClick={disburse} loading={busy}>Mark as disbursed</Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setConfirming(true)}>Disburse {formatInr(loan.principal)}</Button>
      )}
    </div>
  );
}
