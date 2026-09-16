import { Alert } from '@/components/ui/Alert';
import type { RuleFailure } from '@/types';

const RULE_LABELS: Record<string, string> = {
  AGE: 'Age',
  SALARY: 'Salary',
  PAN: 'PAN',
  EMPLOYMENT: 'Employment',
};

/** Renders BRE rule failures as a clear, itemised eligibility error. */
export function BreFailureList({
  failures,
  title = 'You are not eligible to apply yet',
}: {
  failures: RuleFailure[];
  title?: string;
}) {
  if (failures.length === 0) return null;

  return (
    <Alert tone="error">
      <p className="font-semibold">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {failures.map((failure) => (
          <li key={failure.rule} className="flex gap-2">
            <span className="mt-0.5 inline-flex shrink-0 rounded bg-rose-100 px-1.5 text-[11px] font-semibold uppercase tracking-wide text-rose-700">
              {RULE_LABELS[failure.rule] ?? failure.rule}
            </span>
            <span>{failure.message}</span>
          </li>
        ))}
      </ul>
    </Alert>
  );
}
