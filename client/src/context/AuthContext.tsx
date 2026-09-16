'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import { ROUTES, homeForRole } from '@/lib/routes';
import { clearToken, getToken, setToken } from '@/lib/token';
import type { AuthResponse, User } from '@/types';

interface AuthContextValue {
  user: User | null;
  /** True until the initial `/auth/me` check has finished. */
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /** Validates the stored token against the API and returns the profile (or null). */
  const fetchProfile = useCallback(async (): Promise<User | null> => {
    if (!getToken()) return null;
    try {
      const { user } = await api.get<{ user: User }>('/auth/me');
      return user;
    } catch {
      clearToken();
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    const profile = await fetchProfile();
    setUser(profile);
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    let cancelled = false;
    fetchProfile().then((profile) => {
      if (cancelled) return;
      setUser(profile);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchProfile]);

  const applyAuth = useCallback(
    (result: AuthResponse) => {
      setToken(result.token);
      setUser(result.user);
      router.replace(homeForRole(result.user.role));
      return result.user;
    },
    [router],
  );

  const login = useCallback(
    async (email: string, password: string) =>
      applyAuth(await api.post<AuthResponse>('/auth/login', { email, password })),
    [applyAuth],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) =>
      applyAuth(await api.post<AuthResponse>('/auth/register', { name, email, password })),
    [applyAuth],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.replace(ROUTES.login);
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
