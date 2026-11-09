import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button, ErrorList, Field, TextInput } from '../components/ui';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/games';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors([]);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrors(err instanceof ApiError ? err.messages : ['Could not reach the API.']);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-ink-800 bg-ink-900 p-7 shadow-2xl shadow-black/40">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-accent font-bold text-white">GB</span>
          <div>
            <h1 className="text-lg font-semibold">Game Back Office</h1>
            <p className="text-sm text-ink-400">Sign in to manage game configuration</p>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Username">
            <TextInput autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>
          <Field label="Password">
            <TextInput type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <ErrorList messages={errors} />
          <Button type="submit" variant="primary" className="w-full" disabled={busy || !username || !password}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
      </form>
    </div>
  );
}
