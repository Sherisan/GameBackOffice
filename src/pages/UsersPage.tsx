import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'react-toastify';
import { api, ApiError } from '../api/client';
import type { Role, User } from '../api/types';
import { ROLES } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Badge, Button, Card, ErrorList, Field, Loading, PageHeader, Select, TextInput, Toggle } from '../components/ui';

const ROLE_HELP: Record<Role, string> = {
  Viewer: 'Read every game and its history.',
  Editor: 'Also change games and evolution ladders.',
  Admin: 'Also manage back-office users.',
};

export function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [resetFor, setResetFor] = useState<User | null>(null);

  const load = () => api.users().then(setUsers).catch((e) => setErrors(e instanceof ApiError ? e.messages : [String(e)]));
  useEffect(() => {
    load();
  }, []);

  async function update(u: User, body: { role?: Role; enabled?: boolean }) {
    try {
      const next = await api.updateUser(u.userId, body);
      setUsers((all) => all?.map((x) => (x.userId === next.userId ? next : x)) ?? null);
      toast.success(`${next.username} updated${body.role || body.enabled === false ? ' — signed out of their sessions' : ''}.`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Who can sign in to the back office. Role and access changes apply on the user's next request."
        actions={
          <Button variant="primary" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Cancel' : '+ New user'}
          </Button>
        }
      />
      <ErrorList messages={errors} />

      {showCreate && (
        <CreateUser
          onCreated={(u) => {
            setUsers((all) => [...(all ?? []), u].sort((a, b) => a.username.localeCompare(b.username)));
            setShowCreate(false);
          }}
        />
      )}
      {resetFor && <ResetPassword user={resetFor} onDone={() => setResetFor(null)} />}

      {!users ? (
        <Loading />
      ) : (
        <div className="overflow-hidden rounded-lg border border-ink-800">
          <table className="w-full text-sm">
            <thead className="bg-ink-900 text-left text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Last sign-in</th>
                <th className="px-4 py-3 font-medium">Enabled</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {users.map((u) => {
                const self = u.userId === me?.userId;
                return (
                  <tr key={u.userId} className="bg-ink-950">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {u.displayName} {self && <Badge tone="blue">you</Badge>}
                      </div>
                      <div className="font-mono text-xs text-ink-400">{u.username}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Select value={u.role} options={ROLES} disabled={self} onChange={(role) => update(u, { role })} className="w-32" />
                    </td>
                    <td className="px-4 py-3 text-ink-400">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
                    <td className="px-4 py-3">
                      <Toggle label={`${u.username} enabled`} checked={u.enabled} disabled={self} onChange={(enabled) => update(u, { enabled })} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" onClick={() => setResetFor(u)}>
                        Reset password
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function CreateUser({ onCreated }: { onCreated: (u: User) => void }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Viewer');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors([]);
    try {
      const user = await api.createUser({ username, displayName, password, role });
      toast.success(`${user.username} created. Give them their password securely — they can change it under their account.`);
      onCreated(user);
    } catch (err) {
      setErrors(err instanceof ApiError ? err.messages : [String(err)]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6">
      <Card title="New user">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Username">
            <TextInput value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Display name">
            <TextInput value={displayName} placeholder={username} onChange={(e) => setDisplayName(e.target.value)} />
          </Field>
          <Field label="Password" hint="At least 10 characters.">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Role" hint={ROLE_HELP[role]}>
            <Select value={role} options={ROLES} onChange={setRole} />
          </Field>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex-1">
            <ErrorList messages={errors} />
          </div>
          <Button type="submit" variant="primary" disabled={busy || !username || !password}>
            {busy ? 'Creating…' : 'Create user'}
          </Button>
        </div>
      </Card>
    </form>
  );
}

function ResetPassword({ user, onDone }: { user: User; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    try {
      await api.resetPassword(user.userId, password);
      toast.success(`Password for ${user.username} reset — they've been signed out everywhere.`);
      onDone();
    } catch (err) {
      setErrors(err instanceof ApiError ? err.messages : [String(err)]);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6">
      <Card title={`Reset password — ${user.username}`}>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="New password" hint="At least 10 characters." className="w-72">
            <TextInput type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <Button type="submit" variant="primary" disabled={!password}>
            Set password
          </Button>
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
        {errors.length > 0 && (
          <div className="mt-3">
            <ErrorList messages={errors} />
          </div>
        )}
      </Card>
    </form>
  );
}
