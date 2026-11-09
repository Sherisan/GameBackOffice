import type { ReactNode } from 'react';
import type { RngSettings } from '../api/types';
import { formatChance, formatPercent, rtpOf, totalWeight } from '../lib/rtp';
import { Badge, Button, Card, Field, NumberInput, TextInput } from './ui';

interface Props {
  rng: RngSettings;
  onChange: (rng: RngSettings) => void;
  readOnly: boolean;
  /** RTP as saved — shown next to the live figure while editing. */
  savedRtp?: number;
}

const MODEL_HELP: Record<RngSettings['model'], string> = {
  Multiplier: 'Each play draws one prize multiplier from the weighted table. 0 = loss.',
  Pick: 'The player picks an option and the RNG draws one; a match pays that option’s payout (stake included).',
  Target: 'The player picks a target; the RNG draws a crash point. Crash ≥ target pays the target.',
  Wheel: 'European single-zero roulette: 37 equally likely pockets.',
};

export function RngEditor({ rng, onChange, readOnly, savedRtp }: Props) {
  const rtp = rtpOf(rng);
  const set = (patch: Partial<RngSettings>) => onChange({ ...rng, ...patch });

  return (
    <div className="space-y-5">
      <Card
        title={
          <span className="flex items-center gap-2">
            RNG <Badge tone="blue">{rng.model}</Badge>
            {rng.card && <Badge tone="violet">card: {rng.card}</Badge>}
          </span>
        }
        actions={<RtpReadout rtp={rtp} savedRtp={savedRtp} />}
      >
        <p className="mb-4 text-sm text-ink-400">{MODEL_HELP[rng.model]}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {rng.model === 'Target' && (
            <>
              <Field label="House edge %">
                <NumberInput value={rng.houseEdgePercent} disabled={readOnly} onChange={(v) => set({ houseEdgePercent: v ?? 0 })} />
              </Field>
              <Field label="Max multiplier" hint="Highest crash point the RNG can draw.">
                <NumberInput value={rng.maxMultiplier} disabled={readOnly} onChange={(v) => set({ maxMultiplier: v ?? 0 })} />
              </Field>
            </>
          )}
          {rng.model === 'Wheel' && (
            <Field label="Pockets">
              <NumberInput value={rng.pockets} disabled onChange={() => {}} />
            </Field>
          )}
          <Field label="Rotate seed every" hint="Draws per server seed before it's revealed for verification.">
            <NumberInput value={rng.rotateSeedEvery} disabled={readOnly} onChange={(v) => set({ rotateSeedEvery: Math.round(v ?? 0) })} />
          </Field>
          {rng.model === 'Multiplier' && (
            <Field label="Stakes" hint="Fixed card prices, comma separated. Empty = any stake within the limits." className="sm:col-span-2">
              <StakesInput key={rng.stakes.join(',')} stakes={rng.stakes} disabled={readOnly} onChange={(stakes) => set({ stakes })} />
            </Field>
          )}
        </div>
        <p className="mt-4 text-xs text-ink-400">
          Saving a change to this section reveals the current server seed and starts a new one, so every past draw stays verifiable.
        </p>
      </Card>

      {rng.model === 'Multiplier' && <OutcomesTable rng={rng} onChange={onChange} readOnly={readOnly} />}
      {rng.model === 'Pick' && <OptionsTable rng={rng} onChange={onChange} readOnly={readOnly} />}
    </div>
  );
}

function RtpReadout({ rtp, savedRtp }: { rtp: number; savedRtp?: number }) {
  const changed = savedRtp != null && Math.abs(savedRtp - rtp) > 1e-9;
  const tone = rtp > 1 ? 'text-red-300' : rtp > 0.99 ? 'text-amber-300' : 'text-emerald-300';
  return (
    <div className="text-right">
      <div className="text-[11px] uppercase tracking-wide text-ink-400">RTP</div>
      <div className={`font-mono text-lg font-semibold tabular-nums ${tone}`}>{formatPercent(rtp, 3)}</div>
      {changed && <div className="text-[11px] text-ink-400">was {formatPercent(savedRtp, 3)}</div>}
      {rtp > 1 && <div className="text-[11px] text-red-300">Pays out more than it takes in</div>}
    </div>
  );
}

function StakesInput({ stakes, onChange, disabled }: { stakes: number[]; onChange: (s: number[]) => void; disabled: boolean }) {
  return (
    <TextInput
      className="font-mono"
      defaultValue={stakes.join(', ')}
      disabled={disabled}
      onBlur={(e) =>
        onChange(
          e.target.value
            .split(/[,\s]+/)
            .map((s) => Number(s))
            .filter((n) => Number.isFinite(n) && n > 0),
        )
      }
    />
  );
}

function Table({ head, children, footer }: { head: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-md border border-ink-800">
      <table className="w-full text-sm">
        <thead className="bg-ink-850 text-left text-xs uppercase tracking-wide text-ink-400">{head}</thead>
        <tbody className="divide-y divide-ink-800">{children}</tbody>
        {footer && <tfoot className="border-t border-ink-700 bg-ink-850">{footer}</tfoot>}
      </table>
    </div>
  );
}

function OutcomesTable({ rng, onChange, readOnly }: { rng: RngSettings; onChange: (r: RngSettings) => void; readOnly: boolean }) {
  const total = totalWeight(rng.outcomes.map((o) => o.weight));
  const setOutcome = (i: number, patch: Partial<RngSettings['outcomes'][number]>) =>
    onChange({ ...rng, outcomes: rng.outcomes.map((o, j) => (j === i ? { ...o, ...patch } : o)) });

  return (
    <Card
      title="Payout table"
      actions={
        !readOnly && (
          <Button onClick={() => onChange({ ...rng, outcomes: [...rng.outcomes, { multiplier: 0, weight: 1 }] })}>+ Add prize</Button>
        )
      }
    >
      {rng.card && (
        <p className="mb-4 text-sm text-amber-200/80">
          This game shows a “{rng.card}” card built from these prizes. The API rejects prizes the card can't display.
        </p>
      )}
      <Table
        head={
          <tr>
            <th className="px-3 py-2 font-medium">Multiplier</th>
            <th className="px-3 py-2 font-medium">Weight</th>
            <th className="px-3 py-2 text-right font-medium">Chance</th>
            <th className="px-3 py-2 text-right font-medium">RTP share</th>
            <th className="w-10" />
          </tr>
        }
        footer={
          <tr className="text-xs text-ink-300">
            <td className="px-3 py-2">Total</td>
            <td className="px-3 py-2 font-mono tabular-nums">{total.toLocaleString()}</td>
            <td className="px-3 py-2 text-right">100%</td>
            <td className="px-3 py-2 text-right font-mono tabular-nums">{formatPercent(rtpOf(rng), 3)}</td>
            <td />
          </tr>
        }
      >
        {rng.outcomes.map((o, i) => (
          <tr key={i} className="bg-ink-950">
            <td className="px-3 py-1.5">
              <NumberInput value={o.multiplier} disabled={readOnly} onChange={(v) => setOutcome(i, { multiplier: v ?? 0 })} className="max-w-[9rem]" />
            </td>
            <td className="px-3 py-1.5">
              <NumberInput value={o.weight} disabled={readOnly} onChange={(v) => setOutcome(i, { weight: Math.max(0, Math.round(v ?? 0)) })} className="max-w-[9rem]" />
            </td>
            <td className="px-3 py-1.5 text-right font-mono tabular-nums text-ink-300">{formatChance(total ? o.weight / total : 0)}</td>
            <td className="px-3 py-1.5 text-right font-mono tabular-nums text-ink-300">{formatPercent(total ? (o.weight * o.multiplier) / total : 0, 3)}</td>
            <td className="px-2">
              {!readOnly && (
                <Button variant="ghost" aria-label="Remove prize" onClick={() => onChange({ ...rng, outcomes: rng.outcomes.filter((_, j) => j !== i) })}>
                  ✕
                </Button>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

function OptionsTable({ rng, onChange, readOnly }: { rng: RngSettings; onChange: (r: RngSettings) => void; readOnly: boolean }) {
  const total = totalWeight(rng.options.map((o) => o.weight));
  const setOption = (i: number, patch: Partial<RngSettings['options'][number]>) =>
    onChange({ ...rng, options: rng.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) });

  return (
    <Card
      title="Options"
      actions={
        !readOnly && (
          <Button onClick={() => onChange({ ...rng, options: [...rng.options, { key: `option${rng.options.length + 1}`, weight: 1, payout: 2 }] })}>
            + Add option
          </Button>
        )
      }
    >
      <Table
        head={
          <tr>
            <th className="px-3 py-2 font-medium">Key</th>
            <th className="px-3 py-2 font-medium">Weight</th>
            <th className="px-3 py-2 font-medium">Payout</th>
            <th className="px-3 py-2 text-right font-medium">Chance</th>
            <th className="px-3 py-2 text-right font-medium">RTP if picked</th>
            <th className="w-10" />
          </tr>
        }
      >
        {rng.options.map((o, i) => (
          <tr key={i} className="bg-ink-950">
            <td className="px-3 py-1.5">
              <TextInput value={o.key} disabled={readOnly} onChange={(e) => setOption(i, { key: e.target.value })} className="max-w-[10rem] font-mono" />
            </td>
            <td className="px-3 py-1.5">
              <NumberInput value={o.weight} disabled={readOnly} onChange={(v) => setOption(i, { weight: Math.max(0, Math.round(v ?? 0)) })} className="max-w-[8rem]" />
            </td>
            <td className="px-3 py-1.5">
              <NumberInput value={o.payout} disabled={readOnly} onChange={(v) => setOption(i, { payout: v ?? 0 })} className="max-w-[8rem]" />
            </td>
            <td className="px-3 py-1.5 text-right font-mono tabular-nums text-ink-300">{formatChance(total ? o.weight / total : 0)}</td>
            <td className="px-3 py-1.5 text-right font-mono tabular-nums text-ink-300">{formatPercent(total ? (o.weight * o.payout) / total : 0, 3)}</td>
            <td className="px-2">
              {!readOnly && rng.options.length > 2 && (
                <Button variant="ghost" aria-label="Remove option" onClick={() => onChange({ ...rng, options: rng.options.filter((_, j) => j !== i) })}>
                  ✕
                </Button>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}
