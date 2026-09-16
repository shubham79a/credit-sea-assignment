'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { BreFailureList } from '@/components/portal/BreFailureList';
import { StepHeader } from '@/components/portal/StepHeader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/context/AuthContext';
import { useApplication } from '@/hooks/useApplication';
import { ApiError } from '@/lib/api';
import { submitPersonalDetails } from '@/lib/applications';
import { BRE_RULES, evaluateBre } from '@/lib/bre';
import { formatInr, toDateInputValue } from '@/lib/format';
import {
  EMPLOYMENT_MODES,
  EMPLOYMENT_MODE_LABELS,
  type Application,
  type EmploymentMode,
  type RuleFailure,
} from '@/types';

interface FormState {
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: string;
  employmentMode: EmploymentMode | '';
}

const EMPLOYMENT_OPTIONS = EMPLOYMENT_MODES.map((mode) => ({
  value: mode,
  label: EMPLOYMENT_MODE_LABELS[mode],
}));

export default function PersonalDetailsPage() {
  const { application, loading } = useApplication();

  return (
    <section className="space-y-8">
      <StepHeader
        step={1}
        title="Personal details"
        description="We run a quick eligibility check on these details before you can continue."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <PersonalDetailsForm existing={application} />
      )}
    </section>
  );
}

/**
 * Rendered only after the existing application (if any) has loaded, so the
 * initial form state can be derived synchronously — no effect needed.
 */
function PersonalDetailsForm({ existing }: { existing: Application | null }) {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>(() => ({
    fullName: existing?.personalDetails.fullName ?? user?.name ?? '',
    pan: existing?.personalDetails.pan ?? '',
    dateOfBirth: existing ? toDateInputValue(existing.personalDetails.dateOfBirth) : '',
    monthlySalary: existing ? String(existing.personalDetails.monthlySalary) : '',
    employmentMode: existing?.personalDetails.employmentMode ?? '',
  }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [breFailures, setBreFailures] = useState<RuleFailure[]>(
    existing && !existing.bre.passed ? existing.bre.failures : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function validateShape(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (form.fullName.trim().length < 2) errors.fullName = 'Enter your full name';
    if (!form.pan.trim()) errors.pan = 'PAN is required';
    if (!form.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (form.monthlySalary === '' || Number.isNaN(Number(form.monthlySalary)))
      errors.monthlySalary = 'Enter your monthly salary';
    if (!form.employmentMode) errors.employmentMode = 'Select your employment mode';
    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBreFailures([]);

    const shapeErrors = validateShape();
    setFieldErrors(shapeErrors);
    if (Object.keys(shapeErrors).length > 0) return;

    // Client-side BRE mirror: instant feedback, no round-trip for obvious misses.
    const localFailures = evaluateBre({
      pan: form.pan,
      dateOfBirth: form.dateOfBirth,
      monthlySalary: Number(form.monthlySalary),
      employmentMode: form.employmentMode,
    });
    if (localFailures.length > 0) {
      setBreFailures(localFailures);
      return;
    }

    setSubmitting(true);
    try {
      await submitPersonalDetails({
        fullName: form.fullName.trim(),
        pan: form.pan.trim().toUpperCase(),
        dateOfBirth: form.dateOfBirth,
        monthlySalary: Number(form.monthlySalary),
        employmentMode: form.employmentMode as EmploymentMode,
      });
      router.push('/portal/salary-slip');
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        // Server-side BRE is authoritative — show exactly what it rejected.
        setBreFailures(err.ruleErrors);
      } else if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        setError(err.message);
      } else {
        setError('Unable to reach the server. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        {error && <Alert tone="error">{error}</Alert>}
        <BreFailureList failures={breFailures} />

        <Input
          label="Full name"
          autoComplete="name"
          required
          value={form.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          error={fieldErrors.fullName}
        />

        <Input
          label="PAN"
          placeholder="ABCDE1234F"
          maxLength={10}
          required
          value={form.pan}
          onChange={(e) => update('pan', e.target.value.toUpperCase())}
          error={fieldErrors.pan}
          hint="10 characters: 5 letters, 4 digits, 1 letter"
          className="font-mono uppercase tracking-widest"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Date of birth"
            type="date"
            required
            max={toDateInputValue(new Date())}
            value={form.dateOfBirth}
            onChange={(e) => update('dateOfBirth', e.target.value)}
            error={fieldErrors.dateOfBirth}
          />
          <Input
            label="Monthly salary (₹)"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            required
            placeholder="e.g. 45000"
            value={form.monthlySalary}
            onChange={(e) => update('monthlySalary', e.target.value)}
            error={fieldErrors.monthlySalary}
          />
        </div>

        <Select
          label="Employment mode"
          placeholder="Select…"
          required
          options={EMPLOYMENT_OPTIONS}
          value={form.employmentMode}
          onChange={(e) => update('employmentMode', e.target.value as EmploymentMode | '')}
          error={fieldErrors.employmentMode}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" loading={submitting}>
            Check eligibility &amp; continue
          </Button>
        </div>
      </form>

      <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
        <h2 className="font-semibold">Eligibility criteria</h2>
        <ul className="mt-3 space-y-2 text-slate-600">
          <li>
            Age between <strong>{BRE_RULES.MIN_AGE}</strong> and <strong>{BRE_RULES.MAX_AGE}</strong>
          </li>
          <li>
            Monthly salary of at least <strong>{formatInr(BRE_RULES.MIN_MONTHLY_SALARY)}</strong>
          </li>
          <li>
            A valid PAN (format <span className="font-mono">AAAAA9999A</span>)
          </li>
          <li>Salaried or self-employed</li>
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          All checks must pass. You can update your details and try again at any time.
        </p>
      </aside>
    </div>
  );
}
