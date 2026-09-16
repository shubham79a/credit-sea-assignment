import type { Role } from '@/types';

/**
 * The JWT is kept in a cookie (not localStorage) so that `proxy.ts` can read
 * it on the server and redirect unauthenticated users before a page renders.
 * The API still receives it via the Authorization header.
 */
export const TOKEN_COOKIE = 'lms_token';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days, matches JWT_EXPIRES_IN

export function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${TOKEN_COOKIE}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export function setToken(token: string): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function clearToken(): void {
  document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export interface TokenPayload {
  sub: string;
  role: Role;
  email: string;
  exp: number;
}

/**
 * Decodes the payload WITHOUT verifying the signature. Only used for UX
 * routing decisions (where to redirect). Authorization is enforced by the API.
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString();
    const payload = JSON.parse(json) as TokenPayload;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
