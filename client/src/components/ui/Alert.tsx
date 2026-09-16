import type { ReactNode } from 'react';

type Tone = 'error' | 'success' | 'info' | 'warning';

const toneClasses: Record<Tone, string> = {
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

export function Alert({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div role="alert" className={`rounded-lg border px-3 py-2 text-sm ${toneClasses[tone]}`}>
      {children}
    </div>
  );
}
