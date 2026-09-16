'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { ROUTES } from '@/lib/routes';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        setError(err.message);
      } else {
        setError('Unable to reach the server. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <>
      <h2 className="text-lg font-semibold">Sign in</h2>
      <p className="mt-1 text-sm text-slate-500">Borrowers and executives use the same login.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={fieldErrors.email}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={fieldErrors.password}
        />

        <Button type="submit" fullWidth loading={submitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New borrower?{' '}
        <Link href={ROUTES.register} className="font-medium text-indigo-600 hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo accounts</p>
        <p className="mt-1 text-xs text-slate-500">Click a role to fill in its seeded credentials.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setForm({ email: account.email, password: DEMO_PASSWORD });
                setError(null);
                setFieldErrors({});
              }}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {account.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/** Accounts created by `npm run seed` (server/src/scripts/seed.ts). */
const DEMO_PASSWORD = 'Password@123';
const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@creditsea.com' },
  { label: 'Sales', email: 'sales@creditsea.com' },
  { label: 'Sanction', email: 'sanction@creditsea.com' },
  { label: 'Disbursement', email: 'disbursement@creditsea.com' },
  { label: 'Collection', email: 'collection@creditsea.com' },
  { label: 'Borrower', email: 'borrower@creditsea.com' },
];
