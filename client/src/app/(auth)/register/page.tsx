'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { ROUTES } from '@/lib/routes';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (form.password !== form.confirm) {
      setFieldErrors({ confirm: 'Passwords do not match' });
      return;
    }

    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
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
      <h2 className="text-lg font-semibold">Create your borrower account</h2>
      <p className="mt-1 text-sm text-slate-500">Apply for a loan in a few guided steps.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}

        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Rahul Sharma"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={fieldErrors.name}
        />
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
          autoComplete="new-password"
          placeholder="Create a password"
          required
          minLength={6}
          hint="At least 6 characters"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={fieldErrors.password}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          required
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          error={fieldErrors.confirm}
        />

        <Button type="submit" fullWidth loading={submitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href={ROUTES.login} className="font-medium text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
