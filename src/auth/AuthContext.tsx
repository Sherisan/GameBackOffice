import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../api/client';
import type { User } from '../api/types';

interface AuthState {
  user: User | null;
  /** True while a saved session is being checked on page load. */
  loading: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  /** After a password change the API issues a new token (the old one stops working). */
  replaceSession: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => tokenStore.get() != null);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    if (!tokenStore.get()) return;
    api
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { token, user } = await api.login(username, password);
    tokenStore.set(token);
    setUser(user);
  }, []);

  const replaceSession = useCallback((token: string, next: User) => {
    tokenStore.set(token);
    setUser(next);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      canEdit: user?.role === 'Editor' || user?.role === 'Admin',
      isAdmin: user?.role === 'Admin',
      login,
      logout,
      replaceSession,
    }),
    [user, loading, login, logout, replaceSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
