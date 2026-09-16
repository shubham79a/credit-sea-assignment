import { formatDate, formatInr, formatInrPrecise } from '@/lib/format';
import type { LoanQuote } from '@/lib/loan-math';

/**
 * Live calculation panel. Pure presentation — recomputed by the parent on every
 * slider move via `calculateLoan()`.
 */
export function LoanSummary({ quote, title = 'Your repayment' }: { quote: LoanQuote; title?: string }) {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-700">{title}</h2>

      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
        {formatInrPrecise(quote.totalRepayment)}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        total repayable in {quote.tenureDays} days · due {formatDate(quote.dueDate)}
      </p>

      <dl className="mt-5 space-y-2.5 text-sm">
        <Row label="Principal" value={formatInr(quote.principal)} />
        <Row label="Interest rate" value={`${quote.interestRate}% p.a. (fixed)`} />
        <Row label="Tenure" value={`${quote.tenureDays} days`} />
        <Row label="Simple interest" value={formatInrPrecise(quote.interest)} emphasis />
        <Row label="Per day" value={`≈ ${formatInrPrecise(quote.dailyInterest)}`} muted />
      </dl>

      <p className="mt-5 border-t border-indigo-100 pt-3 font-mono text-[11px] text-slate-500">
        SI = (P × R × T) / (365 × 100)
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  emphasis = false,
  muted = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={muted ? 'text-slate-400' : 'text-slate-600'}>{label}</dt>
      <dd
        className={`tabular-nums ${
          emphasis ? 'font-semibold text-slate-900' : muted ? 'text-slate-500' : 'font-medium text-slate-800'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
