import type { ReactNode } from 'react';

/** Page heading for a dashboard module. */
export function ModuleHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = 'default' }: { label: string; value: ReactNode; hint?: string; tone?: 'default' | 'accent' }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === 'accent' ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/** Horizontal filter tabs with optional counts. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={[
              'flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition',
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
            ].join(' ')}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`rounded-full px-1.5 text-xs tabular-nums ${active ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Responsive table wrapper — the table may scroll, the page never does. */
export function DataTable({ head, children, empty }: { head: ReactNode; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>{head}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
      {empty}
    </div>
  );
}

export const Th = ({ children, className = '' }: { children?: ReactNode; className?: string }) => (
  <th scope="col" className={`px-4 py-3 ${className}`}>{children}</th>
);

export const Td = ({ children, className = '' }: { children?: ReactNode; className?: string }) => (
  <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>
);

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );
}
