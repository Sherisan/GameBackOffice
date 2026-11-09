import { useState, type FormEvent } from 'react';
import { toast } from 'react-toastify';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Badge, Button, Card, ErrorList, Field, PageHeader, TextInput } from '../components/ui';

export function AccountPage() {
  const { user, replaceSession } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setErrors(["The new passwords don't match."]);
      return;
    }
    setBusy(true);
    setErrors([]);
    try {
      const { token, user } = await api.changePassword(current, next);
      replaceSession(token, user);
      setCurrent('');
      setNext('');
      setConfirm('');
      toast.success('Password changed. Your other sessions have been signed out.');
    } catch (err) {
      setErrors(err instanceof ApiError ? err.messages : [String(err)]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Your account"
        subtitle={
          <span className="flex items-center gap-2">
            {user?.displayName} · <span className="font-mono">{user?.username}</span> <Badge>{user?.role}</Badge>
          </span>
        }
      />
      <form onSubmit={submit} className="max-w-md">
        <Card title="Change password">
          <div className="space-y-4">
            <Field label="Current password">
              <TextInput type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
            </Field>
            <Field label="New password" hint="At least 10 characters.">
              <TextInput type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password">
              <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </Field>
            <ErrorList messages={errors} />
            <Button type="submit" variant="primary" disabled={busy || !current || !next || !confirm}>
              {busy ? 'Saving…' : 'Change password'}
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
}
