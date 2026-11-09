import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { ConfigChange } from '../api/types';
import { Badge, Card, ErrorList, Loading } from './ui';

type Flat = Record<string, unknown>;

/** { Rng: { Outcomes: [{ Weight: 5 }] } } → { "Rng.Outcomes[0].Weight": 5 } */
function flatten(value: unknown, prefix = '', out: Flat = {}): Flat {
  if (Array.isArray(value)) {
    if (value.length === 0) out[prefix] = '[]';
    value.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  } else if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0 && prefix) out[prefix] = '{}';
    for (const [k, v] of entries) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out[prefix] = value;
  }
  return out;
}

function parse(json: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return json;
  }
}

function diff(change: ConfigChange) {
  const before = flatten(parse(change.oldValue));
  const after = flatten(parse(change.newValue));
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  return keys
    .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    .map((k) => ({ path: k, before: before[k], after: after[k] }));
}

const show = (v: unknown) => (v === undefined ? '—' : v === null ? 'null' : typeof v === 'string' ? v || '""' : JSON.stringify(v));

/** Every change to a game, newest first, with exactly which fields changed. */
export function HistoryList({ gameId, refreshKey }: { gameId: string; refreshKey: number }) {
  const [changes, setChanges] = useState<ConfigChange[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    api
      .history(gameId)
      .then(setChanges)
      .catch((e) => setErrors(e instanceof ApiError ? e.messages : [String(e)]));
  }, [gameId, refreshKey]);

  if (errors.length) return <ErrorList messages={errors} />;
  if (!changes) return <Loading />;
  if (changes.length === 0) return <Card><p className="text-sm text-ink-400">No changes recorded yet.</p></Card>;

  return (
    <div className="space-y-3">
      {changes.map((c) => {
        const rows = c.oldValue ? diff(c) : [];
        return (
          <Card
            key={c.auditId}
            title={
              <span className="flex items-center gap-2">
                <Badge tone={c.section === 'Evolution' ? 'violet' : 'blue'}>{c.section}</Badge>
                <span>{c.changedBy}</span>
              </span>
            }
            actions={<span className="text-xs text-ink-400">{new Date(c.changedAt).toLocaleString()}</span>}
          >
            {!c.oldValue ? (
              <p className="text-sm text-ink-400">{c.changedBy === 'appsettings' ? 'Imported from appsettings.json.' : 'Created.'}</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-ink-400">Saved with no changes.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-ink-400">
                  <tr>
                    <th className="pb-2 font-medium">Field</th>
                    <th className="pb-2 font-medium">Before</th>
                    <th className="pb-2 font-medium">After</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  {rows.map((r) => (
                    <tr key={r.path} className="border-t border-ink-800">
                      <td className="py-1.5 pr-4 text-ink-300">{r.path}</td>
                      <td className="py-1.5 pr-4 text-red-300/90">{show(r.before)}</td>
                      <td className="py-1.5 text-emerald-300/90">{show(r.after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        );
      })}
    </div>
  );
}
