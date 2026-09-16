import { z } from 'zod';
import { ALL_LOAN_STATUSES, LOAN_RULES } from '../constants/loan';

/**
 * Only the two borrower-controlled inputs are accepted. Interest and total are
 * always recomputed server-side — any money fields in the body are ignored.
 */
export const applyLoanSchema = z.object({
  principal: z.coerce
    .number({ error: 'Loan amount must be a number' })
    .int('Loan amount must be a whole number of rupees')
    .min(LOAN_RULES.MIN_AMOUNT, `Loan amount must be at least ₹${LOAN_RULES.MIN_AMOUNT.toLocaleString('en-IN')}`)
    .max(LOAN_RULES.MAX_AMOUNT, `Loan amount cannot exceed ₹${LOAN_RULES.MAX_AMOUNT.toLocaleString('en-IN')}`),
  tenureDays: z.coerce
    .number({ error: 'Tenure must be a number' })
    .int('Tenure must be a whole number of days')
    .min(LOAN_RULES.MIN_TENURE_DAYS, `Tenure must be at least ${LOAN_RULES.MIN_TENURE_DAYS} days`)
    .max(LOAN_RULES.MAX_TENURE_DAYS, `Tenure cannot exceed ${LOAN_RULES.MAX_TENURE_DAYS} days`),
});

export type ApplyLoanInput = z.infer<typeof applyLoanSchema>;

/** Sanction module: a rejection must carry a reason the borrower will see. */
export const rejectLoanSchema = z.object({
  reason: z
    .string({ error: 'A rejection reason is required' })
    .trim()
    .min(5, 'Rejection reason must be at least 5 characters')
    .max(500, 'Rejection reason must be at most 500 characters'),
});

export type RejectLoanInput = z.infer<typeof rejectLoanSchema>;

/** `?status=` filter for the executive listing. */
export const listLoansQuerySchema = z.object({
  status: z.enum(ALL_LOAN_STATUSES, { error: 'status must be a valid loan status' }),
});

/** `:id` route param must be a Mongo ObjectId. */
export const loanIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid loan id'),
});
