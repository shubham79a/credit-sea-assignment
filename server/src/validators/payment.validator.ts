import { z } from 'zod';

export const recordPaymentSchema = z.object({
  utr: z
    .string({ error: 'UTR number is required' })
    .trim()
    .toUpperCase()
    .min(6, 'UTR number must be at least 6 characters')
    .max(40, 'UTR number is too long')
    .regex(/^[A-Z0-9]+$/, 'UTR number may only contain letters and digits'),
  amount: z.coerce
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be greater than zero')
    // Epsilon compare: 144438.36 * 100 is 14443835.999999998 in floating point.
    .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, 'Amount can have at most 2 decimal places'),
  paidAt: z.coerce
    .date({ error: 'Enter a valid payment date' })
    .refine((d) => d.getTime() <= Date.now() + 60_000, 'Payment date cannot be in the future'),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
