import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api, ApiError } from '../api/client';
import type { EvolutionTier } from '../api/types';
import { Badge, Button, Card, ErrorList, Loading, NumberInput, TextInput } from './ui';

const same = (a: EvolutionTier[], b: EvolutionTier[]) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The multipliers at which the player's fish / ship evolves. Saved on its own (separate endpoint from the game).
 * Codes are fixed — the game has art for each one.
 */
export function EvolutionEditor({ gameId, readOnly, onSaved }: { gameId: string; readOnly: boolean; onSaved: () => void }) {
  const [saved, setSaved] = useState<EvolutionTier[] | null>(null);
  const [draft, setDraft] = useState<EvolutionTier[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .evolution(gameId)
      .then(({ tiers }) => {
        setSaved(tiers);
        setDraft(tiers);
      })
      .catch((e) => setErrors(e instanceof ApiError ? e.messages : [String(e)]));
  }, [gameId]);

  if (!saved) return errors.length ? <ErrorList messages={errors} /> : <Loading />;

  const dirty = !same(saved, draft);
  const set = (level: number, patch: Partial<EvolutionTier>) => setDraft((d) => d.map((t) => (t.level === level ? { ...t, ...patch } : t)));
  const top = Math.max(...draft.map((t) => t.multiplier), 1);

  async function save() {
    setBusy(true);
    setErrors([]);
    try {
      const { tiers } = await api.updateEvolution(gameId, draft);
      setSaved(tiers);
      setDraft(tiers);
      toast.success('Evolution ladder saved — players get it the next time they load the game.');
      onSaved();
    } catch (e) {
      setErrors(e instanceof ApiError ? e.messages : [String(e)]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Evolution ladder"
      actions={
        !readOnly && (
          <>
            <Button variant="ghost" disabled={!dirty || busy} onClick={() => setDraft(saved)}>
              Reset
            </Button>
            <Button variant="primary" disabled={!dirty || busy} onClick={save}>
              {busy ? 'Saving…' : 'Save ladder'}
            </Button>
          </>
        )
      }
    >
      <p className="mb-5 text-sm text-ink-400">
        The round multiplier at which the player evolves into each tier. Level 0 is the food tier (below 1.00×), level 1 is the starting tier
        (always 1.00×), and each level must need more than the one before. The server uses the same ladder to decide what the player is big enough to collect.
      </p>

      {/* Ladder on a log scale, so 1× … 25× spread out evenly. */}
      <div className="relative mb-6 h-14 rounded-md border border-ink-800 bg-ink-950">
        {draft
          .filter((t) => t.multiplier >= 1)
          .map((t) => {
            const pct = top > 1 ? (Math.log(t.multiplier) / Math.log(top)) * 84 + 8 : 8;
            return (
              <div key={t.level} className="absolute top-2 -translate-x-1/2 text-center" style={{ left: `${pct}%` }}>
                <div className="mx-auto h-3 w-3 rounded-full border-2 border-violet-300 bg-violet-500" />
                <div className="mt-1 whitespace-nowrap text-[11px] text-ink-300">
                  {t.name} <span className="font-mono text-violet-300">{t.multiplier}×</span>
                </div>
              </div>
            );
          })}
      </div>

      <div className="overflow-hidden rounded-md border border-ink-800">
        <table className="w-full text-sm">
          <thead className="bg-ink-850 text-left text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-3 py-2 font-medium">Level</th>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Evolves at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {draft.map((t) => (
              <tr key={t.level} className="bg-ink-950">
                <td className="px-3 py-1.5">
                  <span className="font-mono">{t.level}</span>
                  {t.level === 0 && <span className="ml-2"><Badge>food</Badge></span>}
                  {t.level === 1 && <span className="ml-2"><Badge tone="green">start</Badge></span>}
                </td>
                <td className="px-3 py-1.5 font-mono text-ink-400">{t.code}</td>
                <td className="px-3 py-1.5">
                  <TextInput value={t.name} disabled={readOnly} onChange={(e) => set(t.level, { name: e.target.value })} className="max-w-[14rem]" />
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <NumberInput
                      value={t.multiplier}
                      disabled={readOnly || t.level === 1}
                      onChange={(v) => set(t.level, { multiplier: v ?? 0 })}
                      className="max-w-[8rem]"
                    />
                    <span className="text-ink-400">×</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {errors.length > 0 && (
        <div className="mt-4">
          <ErrorList messages={errors} />
        </div>
      )}
    </Card>
  );
}
