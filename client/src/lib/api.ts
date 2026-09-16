import type { ApiFailure, ApiSuccess, RuleFailure } from '@/types';
import { getToken } from './token';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

// Thrown for any non-2xx response so callers can `catch (e instanceof ApiError)`.
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: ApiFailure['errors'],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Convenience: map field errors to `{ email: 'msg', ... }` for forms. */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(
      (this.errors ?? []).filter((e) => e.field).map((e) => [e.field as string, e.message]),
    );
  }

  /** Business-rule failures (422 from the BRE) — items that carry a `rule`. */
  get ruleErrors(): RuleFailure[] {
    return (this.errors ?? [])
      .filter((e) => e.rule)
      .map((e) => ({ rule: e.rule as string, message: e.message }));
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * Thin typed wrapper around fetch. Attaches the JWT, JSON-encodes bodies
 * (leaves FormData untouched for file uploads) and unwraps the `data` envelope.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const token = getToken();
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;

  if (!response.ok || !payload || !payload.success) {
    const failure = payload as ApiFailure | null;
    throw new ApiError(
      response.status,
      failure?.message ?? `Request failed with status ${response.status}`,
      failure?.errors,
    );
  }

  return payload.data;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
