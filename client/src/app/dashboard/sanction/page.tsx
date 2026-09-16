'use client';

import { useState } from 'react';
import { LoanQueue, type QueueHelpers } from '@/components/dashboard/LoanQueue';
import { ModuleGuard } from '@/components/dashboard/ModuleGuard';
import { ModuleHeader } from '@/components/dashboard/primitives';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { ApiError } from '@/lib/api';
import { rejectLoan, sanctionLoan } from '@/lib/dashboard';
import { formatInr } from '@/lib/format';
import { LOAN_STATUS, type LoanWithRelations } from '@/types';

export default function SanctionPage() {
  return (
    <ModuleGuard module="sanction">
      <section className="space-y-6">
        <ModuleHeader
          title="Sanction"
          description="Review applied loans against the borrower's details and documents, then approve or reject."
        />
        <LoanQueue
          tabs={[
            { status: LOAN_STATUS.APPLIED, label: 'Pending review' },
            { status: LOAN_STATUS.SANCTIONED, label: 'Sanctioned' },
            { status: LOAN_STATUS.REJECTED, label: 'Rejected' },
          ]}
          renderActions={(loan, helpers) => <SanctionActions loan={loan} helpers={helpers} />}
        />
      </section>
    </ModuleGuard>
  );
}

function SanctionActions({ loan, helpers }: { loan: LoanWithRelations; helpers: QueueHelpers }) {
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loan.status !== LOAN_STATUS.APPLIED) {
    return <p className="text-sm text-slate-500">This loan has been {loan.status.toLowerCase()} — no further action here.</p>;
  }

  async function run(action: () => Promise<LoanWithRelations>, successMessage: string) {
    setBusy(true);
    setError(null);
    try {
      const updated = await action();
      helpers.notify(successMessage);
      await helpers.refresh(updated);
      setMode('idle');
      setReason('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Decision</h3>
      {error && <Alert tone="error">{error}</Alert>}

      {mode === 'idle' && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setMode('approve')}>Approve</Button>
          <Button variant="danger" onClick={() => setMode('reject')}>Reject</Button>
        </div>
      )}

      {mode === 'approve' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-slate-800">
            Sanction {formatInr(loan.principal)} for {loan.user.name}? It moves to the Disbursement queue.
          </p>
          <div className="mt-3 flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setMode('idle')} disabled={busy}>Back</Button>
            <Button onClick={() => run(() => sanctionLoan(loan.id), `Loan for ${loan.user.name} sanctioned`)} loading={busy}>
              Confirm approval
            </Button>
          </div>
        </div>
      )}

      {mode === 'reject' && (
        <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <Textarea
            label="Reason for rejection"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Income documents could not be verified"
            hint="Shown to the borrower. 5–500 characters."
            error={reason.length > 0 && reason.trim().length < 5 ? 'At least 5 characters' : undefined}
          />
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setMode('idle')} disabled={busy}>Back</Button>
            <Button
              variant="danger"
              disabled={reason.trim().length < 5}
              loading={busy}
              onClick={() => run(() => rejectLoan(loan.id, reason.trim()), `Loan for ${loan.user.name} rejected`)}
            >
              Confirm rejection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
