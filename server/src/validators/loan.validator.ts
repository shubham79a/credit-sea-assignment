import { z } from 'zod';
import { LOAN_RULES } from '../constants/loan';

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
