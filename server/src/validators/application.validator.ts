import { z } from 'zod';
import { EMPLOYMENT_MODES } from '../constants/loan';

/**
 * Shape validation only. Eligibility rules (age range, salary floor, PAN
 * format, employment) deliberately live in the BRE so they surface as a 422
 * "eligibility failed" response instead of a generic 400 validation error.
 */
export const personalDetailsSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  pan: z.string({ error: 'PAN is required' }).trim().toUpperCase().min(1, 'PAN is required').max(20),
  dateOfBirth: z.coerce
    .date({ error: 'Enter a valid date of birth' })
    .refine((date) => date < new Date(), 'Date of birth must be in the past'),
  monthlySalary: z.coerce
    .number({ error: 'Monthly salary must be a number' })
    .min(0, 'Monthly salary cannot be negative'),
  employmentMode: z.enum(EMPLOYMENT_MODES, { error: 'Select a valid employment mode' }),
});

export type PersonalDetailsInput = z.infer<typeof personalDetailsSchema>;

/** Sent after the browser has uploaded straight to Cloudinary. */
export const linkSalarySlipSchema = z.object({
  publicId: z.string().trim().min(1, 'publicId is required').max(300),
  originalName: z.string().trim().min(1, 'originalName is required').max(255),
});

export type LinkSalarySlipInput = z.infer<typeof linkSalarySlipSchema>;
