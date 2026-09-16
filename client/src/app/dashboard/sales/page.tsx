'use client';

import { useState } from 'react';
import { ModuleGuard } from '@/components/dashboard/ModuleGuard';
import {
  DataTable,
  EmptyState,
  ModuleHeader,
  Spinner,
  StatCard,
  Tabs,
  Td,
  Th,
} from '@/components/dashboard/primitives';
import { Alert } from '@/components/ui/Alert';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getLeads } from '@/lib/dashboard';
import { formatDate, formatInr } from '@/lib/format';
import { EMPLOYMENT_MODE_LABELS, LEAD_STAGES, LEAD_STAGE_LABELS, type LeadStage } from '@/types';

type Filter = 'ALL' | LeadStage;

const STAGE_TONES: Record<LeadStage, string> = {
  REGISTERED: 'bg-slate-100 text-slate-700 ring-slate-200',
  BRE_FAILED: 'bg-rose-50 text-rose-700 ring-rose-200',
  DETAILS_DONE: 'bg-sky-50 text-sky-700 ring-sky-200',
  DOCS_DONE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

export default function SalesPage() {
  return (
    <ModuleGuard module="sales">
      <SalesLeads />
    </ModuleGuard>
  );
}

function SalesLeads() {
  const { data, loading, error } = useAsyncData(getLeads, 'Could not load leads');
  const [filter, setFilter] = useState<Filter>('ALL');

  const leads = data?.leads ?? [];
  const visible = filter === 'ALL' ? leads : leads.filter((l) => l.stage === filter);

  return (
    <section className="space-y-6">
      <ModuleHeader
        title="Sales — Leads"
        description="Borrowers who have registered but not yet applied for a loan, by funnel stage."
      />

      {error && <Alert tone="error">{error}</Alert>}
      {loading || !data ? (
        <Spinner />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total leads" value={data.stats.total} tone="accent" />
            {LEAD_STAGES.map((stage) => (
              <StatCard key={stage} label={LEAD_STAGE_LABELS[stage]} value={data.stats.byStage[stage]} />
            ))}
          </div>

          <Tabs<Filter>
            tabs={[
              { value: 'ALL', label: 'All', count: leads.length },
              ...LEAD_STAGES.map((s) => ({ value: s, label: LEAD_STAGE_LABELS[s], count: data.stats.byStage[s] })),
            ]}
            value={filter}
            onChange={setFilter}
          />

          <DataTable
            head={
              <>
                <Th>Lead</Th>
                <Th>Registered</Th>
                <Th className="text-right">Monthly salary</Th>
                <Th>Employment</Th>
                <Th>Stage</Th>
                <Th>Notes</Th>
              </>
            }
            empty={visible.length === 0 ? <EmptyState title="No leads in this stage" /> : undefined}
          >
            {visible.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50">
                <Td>
                  <p className="font-medium text-slate-800">{lead.application?.fullName ?? lead.name}</p>
                  <p className="text-xs text-slate-500">{lead.email}</p>
                </Td>
                <Td className="whitespace-nowrap text-slate-500">{formatDate(lead.registeredAt)}</Td>
                <Td className="text-right tabular-nums">
                  {lead.application ? formatInr(lead.application.monthlySalary) : <span className="text-slate-400">—</span>}
                </Td>
                <Td>
                  {lead.application ? EMPLOYMENT_MODE_LABELS[lead.application.employmentMode] : <span className="text-slate-400">—</span>}
                </Td>
                <Td>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STAGE_TONES[lead.stage]}`}>
                    {LEAD_STAGE_LABELS[lead.stage]}
                  </span>
                </Td>
                <Td className="max-w-xs text-xs text-slate-500">
                  {lead.stage === 'BRE_FAILED' && lead.application
                    ? lead.application.breFailures.map((f) => f.rule).join(', ')
                    : lead.stage === 'DOCS_DONE'
                      ? 'Ready — nudge to apply'
                      : lead.stage === 'DETAILS_DONE'
                        ? 'Awaiting salary slip'
                        : 'No application started'}
                </Td>
              </tr>
            ))}
          </DataTable>
        </>
      )}
    </section>
  );
}
