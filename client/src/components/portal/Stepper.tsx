import type { PortalStep, StepStatus } from '@/lib/portal-steps';

const circleClasses: Record<StepStatus, string> = {
  done: 'bg-emerald-600 text-white',
  current: 'bg-indigo-600 text-white ring-4 ring-indigo-100',
  blocked: 'bg-rose-600 text-white ring-4 ring-rose-100',
  locked: 'bg-slate-200 text-slate-500',
};

const labelClasses: Record<StepStatus, string> = {
  done: 'text-emerald-700',
  current: 'text-indigo-700',
  blocked: 'text-rose-700',
  locked: 'text-slate-400',
};

/** Horizontal progress indicator for the 4-step borrower journey. */
export function Stepper({ steps }: { steps: PortalStep[] }) {
  return (
    <ol className="flex items-start gap-2 sm:gap-4" aria-label="Application progress">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li key={step.key} className="flex flex-1 items-start">
            <div className="flex flex-col items-center text-center">
              <span
                aria-current={step.status === 'current' ? 'step' : undefined}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${circleClasses[step.status]}`}
              >
                {step.status === 'done' ? '✓' : step.status === 'blocked' ? '!' : index + 1}
              </span>
              <span className={`mt-2 hidden text-xs font-medium sm:block ${labelClasses[step.status]}`}>
                {step.title}
              </span>
            </div>
            {!isLast && (
              <div
                aria-hidden
                className={`mt-4 h-0.5 flex-1 ${step.status === 'done' ? 'bg-emerald-500' : 'bg-slate-200'}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
