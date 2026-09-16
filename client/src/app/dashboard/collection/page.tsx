'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { LoanQueue, type QueueHelpers } from '@/components/dashboard/LoanQueue';
import { ModuleGuard } from '@/components/dashboard/ModuleGuard';
import { ModuleHeader } from '@/components/dashboard/primitives';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiError } from '@/lib/api';
import { getPayments, recordPayment } from '@/lib/dashboard';
import { formatDate, formatInrPrecise, toDateInputValue } from '@/lib/format';
import { LOAN_STATUS, type LoanWithRelations, type Payment } from '@/types';

export default function CollectionPage() {
  return (
    <ModuleGuard module="collection">
      <section className="space-y-6">
        <ModuleHeader
          title="Collection"
          description="Record borrower repayments against disbursed loans. A loan closes automatically when fully repaid."
        />
        <LoanQueue
          tabs={[
            { status: LOAN_STATUS.DISBURSED, label: 'Active' },
            { status: LOAN_STATUS.CLOSED, label: 'Closed' },
          ]}
          extraColumns={[
            { header: 'Paid', cell: (l) => formatInrPrecise(l.amountPaid) },
            { header: 'Outstanding', cell: (l) => <strong>{formatInrPrecise(l.outstanding)}</strong> },
          ]}
          renderActions={(loan, helpers) => <CollectionActions key={loan.id} loan={loan} helpers={helpers} />}
        />
      </section>
    </ModuleGuard>
  );
}

function CollectionActions({ loan, helpers }: { loan: LoanWithRelations; helpers: QueueHelpers }) {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [form, setForm] = useState({ utr: '', amount: String(loan.outstanding), paidAt: toDateInputValue(new Date()) });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadPayments = useCallback(async () => {
    try {
      const result = await getPayments(loan.id);
      setPayments(result.payments);
    } catch {
      setPayments([]);
    }
  }, [loan.id]);

  useEffect(() => {
    let cancelled = false;
    getPayments(loan.id)
      .then((r) => { if (!cancelled) setPayments(r.payments); })
      .catch(() => { if (!cancelled) setPayments([]); });
    return () => { cancelled = true; };
  }, [loan.id]);

  const isActive = loan.status === LOAN_STATUS.DISBURSED;
  const amount = Number(form.amount);

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!/^[A-Za-z0-9]{6,40}$/.test(form.utr.trim())) errors.utr = 'UTR must be 6–40 letters/digits';
    if (!form.amount || Number.isNaN(amount) || amount <= 0) errors.amount = 'Enter a positive amount';
    else if (amount > loan.outstanding + 1e-9) errors.amount = `Cannot exceed outstanding ${formatInrPrecise(loan.outstanding)}`;
    if (!form.paidAt) errors.paidAt = 'Payment date is required';
    return errors;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setBusy(true);
    try {
      const result = await recordPayment(loan.id, { utr: form.utr.trim().toUpperCase(), amount, paidAt: form.paidAt });
      helpers.notify(
        result.closed
          ? `Payment recorded — ${loan.user.name}'s loan is fully repaid and now CLOSED.`
          : `Payment of ${formatInrPrecise(amount)} recorded. Outstanding: ${formatInrPrecise(result.loan.outstanding)}.`,
      );
      await helpers.refresh(result.loan);
      await loadPayments();
      setForm({ utr: '', amount: String(result.loan.outstanding), paidAt: toDateInputValue(new Date()) });
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        setError(err.message);
      } else {
        setError('Could not record the payment. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payments</h3>
        {payments === null ? (
          <p className="mt-2 text-sm text-slate-400">Loading…</p>
        ) : payments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No payments recorded yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div>
                  <p className="font-mono text-xs text-slate-700">{p.utr}</p>
                  <p className="text-xs text-slate-500">{formatDate(p.paidAt)}</p>
                </div>
                <span className="font-medium tabular-nums">{formatInrPrecise(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isActive ? (
        <form onSubmit={handleSubmit} noValidate className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Record payment</h3>
          {error && <Alert tone="error">{error}</Alert>}
          <Input
            label="UTR number"
            value={form.utr}
            onChange={(e) => setForm({ ...form, utr: e.target.value.toUpperCase() })}
            placeholder="e.g. HDFC2409160001"
            className="font-mono uppercase"
            error={fieldErrors.utr}
            hint="Must be unique across all payments"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Amount (₹)"
              type="number"
              min={0.01}
              step={0.01}
              max={loan.outstanding}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              error={fieldErrors.amount}
              hint={`Outstanding ${formatInrPrecise(loan.outstanding)}`}
            />
            <Input
              label="Payment date"
              type="date"
              max={toDateInputValue(new Date())}
              value={form.paidAt}
              onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
              error={fieldErrors.paidAt}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={busy}>Record payment</Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-slate-500">Loan is {loan.status.toLowerCase()} — no further payments can be recorded.</p>
      )}
    </div>
  );
}
