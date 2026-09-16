'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ApiError } from '@/lib/api';
import { getLoansByStatus } from '@/lib/dashboard';
import { formatDate, formatInr, formatInrPrecise } from '@/lib/format';
import { LOAN_STATUS_LABELS, type LoanStatus, type LoanWithRelations } from '@/types';
import { LoanDetailPanel } from './LoanDetailPanel';
import { DataTable, EmptyState, Spinner, Tabs, Td, Th } from './primitives';

export interface QueueHelpers {
  /** Re-fetch the current tab and update the selected loan in place. */
  refresh: (updated?: LoanWithRelations) => Promise<void>;
  notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

interface LoanQueueProps {
  /** Tabs, in order. The first is the module's work queue. */
  tabs: { status: LoanStatus; label: string }[];
  /** Module-specific actions rendered under the detail panel (only for the work-queue tab). */
  renderActions?: (loan: LoanWithRelations, helpers: QueueHelpers) => ReactNode;
  /** Extra columns for the table, e.g. paid/outstanding for Collection. */
  extraColumns?: { header: string; cell: (loan: LoanWithRelations) => ReactNode }[];
}

/**
 * Shared list → detail workflow for the Sanction, Disbursement and Collection
 * modules. Each module only supplies its tabs and its action buttons.
 */
export function LoanQueue({ tabs, renderActions, extraColumns = [] }: LoanQueueProps) {
  const [status, setStatus] = useState<LoanStatus>(tabs[0].status);
  const [loans, setLoans] = useState<LoanWithRelations[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; tone: 'success' | 'error' | 'info' } | null>(null);

  const toMessage = (err: unknown) => (err instanceof ApiError ? err.message : 'Could not load loans');

  // Loading/selection state is reset in the tab handler (not here) so the
  // effect only performs the async fetch; all setState calls run in callbacks.
  useEffect(() => {
    let cancelled = false;
    getLoansByStatus(status)
      .then((result) => {
        if (cancelled) return;
        setLoans(result);
        setError(null);
        if (result.length > 0) setSelectedId((current) => current ?? result[0].id);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  /** Used after a mutation — not from the effect. */
  const load = useCallback(async (target: LoanStatus): Promise<LoanWithRelations[]> => {
    try {
      const result = await getLoansByStatus(target);
      setLoans(result);
      setError(null);
      return result;
    } catch (err) {
      setError(toMessage(err));
      return [];
    }
  }, []);

  function changeTab(next: LoanStatus) {
    if (next === status) return;
    setNotice(null);
    setLoading(true);
    setSelectedId(null);
    setStatus(next);
  }

  const selected = loans.find((l) => l.id === selectedId) ?? null;
  const isWorkQueue = status === tabs[0].status;

  const helpers: QueueHelpers = {
    refresh: async (updated) => {
      const result = await load(status);
      // If the loan moved to another status it drops out of this tab; show the
      // updated document once more so the executive sees the outcome.
      if (updated && !result.some((l) => l.id === updated.id)) {
        setLoans([updated, ...result]);
        setSelectedId(updated.id);
      }
    },
    notify: (message, tone = 'success') => setNotice({ message, tone }),
  };

  return (
    <div className="space-y-4">
      <Tabs tabs={tabs.map((t) => ({ value: t.status, label: t.label }))} value={status} onChange={changeTab} />

      {notice && <Alert tone={notice.tone}>{notice.message}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <Spinner />
      ) : (
        <div
          className={
            selected
              ? 'grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px] 2xl:grid-cols-[minmax(0,1fr)_520px]'
              : 'grid gap-6'
          }
        >
          <DataTable
            head={
              <>
                <Th>Borrower</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-right">Tenure</Th>
                <Th className="text-right">Total repayment</Th>
                {extraColumns.map((c) => (
                  <Th key={c.header} className="text-right">{c.header}</Th>
                ))}
                <Th>Updated</Th>
                <Th>Status</Th>
              </>
            }
            empty={
              loans.length === 0 ? (
                <EmptyState
                  title={`No ${LOAN_STATUS_LABELS[status].toLowerCase()} loans`}
                  hint={isWorkQueue ? 'Nothing waiting for you right now.' : undefined}
                />
              ) : undefined
            }
          >
            {loans.map((loan) => {
              const active = loan.id === selectedId;
              return (
                <tr
                  key={loan.id}
                  onClick={() => setSelectedId(loan.id)}
                  aria-selected={active}
                  className={`cursor-pointer transition ${active ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                >
                  <Td>
                    <p className="font-medium text-slate-800">{loan.user.name}</p>
                    <p className="text-xs text-slate-500">{loan.user.email}</p>
                  </Td>
                  <Td className="text-right tabular-nums">{formatInr(loan.principal)}</Td>
                  <Td className="text-right tabular-nums">{loan.tenureDays} d</Td>
                  <Td className="text-right tabular-nums">{formatInrPrecise(loan.totalRepayment)}</Td>
                  {extraColumns.map((c) => (
                    <Td key={c.header} className="text-right tabular-nums">{c.cell(loan)}</Td>
                  ))}
                  <Td className="whitespace-nowrap text-slate-500">{formatDate(loan.updatedAt)}</Td>
                  <Td><StatusBadge status={loan.status} /></Td>
                </tr>
              );
            })}
          </DataTable>

          {selected && (
            <LoanDetailPanel loan={selected}>
              {isWorkQueue && renderActions ? renderActions(selected, helpers) : null}
            </LoanDetailPanel>
          )}
        </div>
      )}
    </div>
  );
}
