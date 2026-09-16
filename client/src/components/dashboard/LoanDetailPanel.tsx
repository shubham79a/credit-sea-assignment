import type { ReactNode } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { calculateAge } from '@/lib/bre';
import { formatDate, formatInr, formatInrPrecise } from '@/lib/format';
import { EMPLOYMENT_MODE_LABELS, LOAN_STATUS_LABELS, type LoanWithRelations } from '@/types';

/**
 * Everything an executive needs to decide on a loan: borrower identity,
 * KYC details, salary slip, loan figures and the status timeline.
 * Module-specific actions are passed in as children.
 */
export function LoanDetailPanel({ loan, children }: { loan: LoanWithRelations; children?: ReactNode }) {
  const pd = loan.application.personalDetails;
  const slip = loan.application.salarySlip;
  const progress = loan.totalRepayment > 0 ? Math.min(100, (loan.amountPaid / loan.totalRepayment) * 100) : 0;

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Loan · {loan.id.slice(-8)}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{formatInr(loan.principal)}</p>
          <p className="text-sm text-slate-500">
            {loan.tenureDays} days · {loan.interestRate}% p.a. · applied {formatDate(loan.createdAt)}
          </p>
        </div>
        <StatusBadge status={loan.status} className="text-sm" />
      </div>

      {/* Borrower + KYC */}
      <Section title="Borrower">
        <Grid>
          <Field label="Name" value={loan.user.name} />
          <Field label="Email" value={loan.user.email} />
          <Field label="Name on application" value={pd.fullName} />
          <Field label="PAN" value={<span className="font-mono">{pd.pan}</span>} />
          <Field label="Date of birth" value={`${formatDate(pd.dateOfBirth)} (age ${calculateAge(new Date(pd.dateOfBirth))})`} />
          <Field label="Monthly salary" value={formatInr(pd.monthlySalary)} />
          <Field label="Employment" value={EMPLOYMENT_MODE_LABELS[pd.employmentMode]} />
          <Field
            label="Eligibility (BRE)"
            value={
              <span className={loan.application.bre.passed ? 'font-medium text-emerald-700' : 'font-medium text-rose-700'}>
                {loan.application.bre.passed ? 'Passed' : 'Failed'}
              </span>
            }
          />
        </Grid>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-600">
            Salary slip{slip ? `: ${slip.originalName}` : ''}
          </span>
          {slip ? (
            <a href={slip.url} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:underline">
              View document ↗
            </a>
          ) : (
            <span className="text-rose-600">Missing</span>
          )}
        </div>
      </Section>

      {/* Money */}
      <Section title="Repayment">
        <Grid>
          <Field label="Principal" value={formatInr(loan.principal)} />
          <Field label="Simple interest" value={formatInrPrecise(loan.interest)} />
          <Field label="Total repayment" value={<strong>{formatInrPrecise(loan.totalRepayment)}</strong>} />
          <Field label="Paid so far" value={formatInrPrecise(loan.amountPaid)} />
          <Field label="Outstanding" value={<strong>{formatInrPrecise(loan.outstanding)}</strong>} />
        </Grid>
        {loan.amountPaid > 0 && (
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-500">{progress.toFixed(1)}% repaid</p>
          </div>
        )}
      </Section>

      {/* Timeline */}
      <Section title="History">
        <ol className="space-y-2 text-sm">
          {loan.statusHistory.map((entry, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-hidden />
              <div>
                <p className="font-medium text-slate-800">
                  {LOAN_STATUS_LABELS[entry.to]}
                  <span className="ml-2 font-normal text-slate-500">{formatDate(entry.at)}</span>
                </p>
                {entry.reason && <p className="text-slate-600">“{entry.reason}”</p>}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {children && <div className="border-t border-slate-200 pt-5">{children}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

const Grid = ({ children }: { children: ReactNode }) => (
  <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">{children}</dl>
);

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 sm:block">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-800 sm:text-left">{value}</dd>
    </div>
  );
}
