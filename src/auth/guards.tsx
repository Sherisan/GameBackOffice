import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/** Signed-in users only; everyone else goes to the sign-in page and comes back afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="grid h-screen place-items-center text-ink-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/games" replace />;
}

export function RequireEditor({ children }: { children: ReactNode }) {
  const { canEdit } = useAuth();
  return canEdit ? <>{children}</> : <Navigate to="/games" replace />;
}
