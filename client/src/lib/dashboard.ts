import type {
  DashboardSummary,
  LeadsResult,
  LoanStatus,
  LoanWithRelations,
  Payment,
  RecordPaymentInput,
} from '@/types';
import { api } from './api';

// --- Read ---------------------------------------------------------------------

export const getSummary = () => api.get<DashboardSummary>('/loans/summary');

export const getLeads = () => api.get<LeadsResult>('/leads');

export async function getLoansByStatus(status: LoanStatus): Promise<LoanWithRelations[]> {
  const { loans } = await api.get<{ loans: LoanWithRelations[] }>(`/loans?status=${status}`);
  return loans;
}

export async function getPayments(loanId: string): Promise<{ loan: LoanWithRelations; payments: Payment[] }> {
  return api.get<{ loan: LoanWithRelations; payments: Payment[] }>(`/loans/${loanId}/payments`);
}

// --- Transitions --------------------------------------------------------------

const transition = async (loanId: string, action: string, body?: unknown) => {
  const { loan } = await api.post<{ loan: LoanWithRelations }>(`/loans/${loanId}/${action}`, body);
  return loan;
};

export const sanctionLoan = (loanId: string) => transition(loanId, 'sanction');
export const rejectLoan = (loanId: string, reason: string) => transition(loanId, 'reject', { reason });
export const disburseLoan = (loanId: string) => transition(loanId, 'disburse');

// --- Collection ---------------------------------------------------------------

export async function recordPayment(
  loanId: string,
  input: RecordPaymentInput,
): Promise<{ payment: Payment; loan: LoanWithRelations; closed: boolean }> {
  return api.post(`/loans/${loanId}/payments`, input);
}
