import { LOAN_STATUS_LABELS, type LoanStatus } from '@/types';

const toneClasses: Record<LoanStatus, string> = {
  APPLIED: 'bg-sky-50 text-sky-700 ring-sky-200',
  SANCTIONED: 'bg-amber-50 text-amber-700 ring-amber-200',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200',
  DISBURSED: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  CLOSED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

/** Coloured pill for a loan status — used by the portal and every dashboard module. */
export function StatusBadge({ status, className = '' }: { status: LoanStatus; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${toneClasses[status]} ${className}`}
    >
      {LOAN_STATUS_LABELS[status]}
    </span>
  );
}
