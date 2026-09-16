import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

/** Title block for an individual step page, with a link back to the overview. */
export function StepHeader({
  step,
  total = 4,
  title,
  description,
}: {
  step: number;
  total?: number;
  title: string;
  description: string;
}) {
  return (
    <div>
      <Link href={ROUTES.portal} className="text-sm text-indigo-600 hover:underline">
        ← Back to overview
      </Link>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-indigo-600">
        Step {step} of {total}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
