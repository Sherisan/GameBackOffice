import type { BlackjackSettings, LiveCrashSettings, RouletteSettings } from '../api/types';
import { formatMoney } from '../lib/rtp';
import { ROULETTE_BET_TYPES } from '../lib/gameBody';
import { Card, Field, NumberInput, Select } from './ui';

// Engine-specific settings: live crash round timing and roulette table limits.

export function LiveCrashForm({ live, onChange, readOnly }: { live: LiveCrashSettings; onChange: (l: LiveCrashSettings) => void; readOnly: boolean }) {
  const set = (patch: Partial<LiveCrashSettings>) => onChange({ ...live, ...patch });
  // Seconds of flight to reach a multiplier: ln(m) / rate.
  const secondsTo = (m: number) => (live.growthRate > 0 ? Math.log(m) / live.growthRate : NaN);

  return (
    <Card title="Live crash rounds">
      <p className="mb-4 text-sm text-amber-200/80">Round timing is read when the API starts — changes here apply after the next API restart.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Betting window (ms)">
          <NumberInput value={live.bettingMs} disabled={readOnly} onChange={(v) => set({ bettingMs: Math.round(v ?? 0) })} />
        </Field>
        <Field label="Crashed pause (ms)" hint="How long the result stays up.">
          <NumberInput value={live.crashedMs} disabled={readOnly} onChange={(v) => set({ crashedMs: Math.round(v ?? 0) })} />
        </Field>
        <Field label="Tick (ms)" hint="20-1000.">
          <NumberInput value={live.tickMs} disabled={readOnly} onChange={(v) => set({ tickMs: Math.round(v ?? 0) })} />
        </Field>
        <Field
          label="Growth rate (per second)"
          hint={`2× at ${secondsTo(2).toFixed(1)}s · 10× at ${secondsTo(10).toFixed(1)}s · 100× at ${secondsTo(100).toFixed(1)}s`}
        >
          <NumberInput value={live.growthRate} disabled={readOnly} onChange={(v) => set({ growthRate: v ?? 0 })} />
        </Field>
        <Field label="Bets per player">
          <NumberInput value={live.maxBetsPerPlayer} disabled={readOnly} onChange={(v) => set({ maxBetsPerPlayer: Math.round(v ?? 0) })} />
        </Field>
        <Field label="Min auto cash-out">
          <NumberInput value={live.minAutoCashOut} disabled={readOnly} onChange={(v) => set({ minAutoCashOut: v ?? 0 })} />
        </Field>
        <Field label="History size" hint="Past crash points kept for the ticker.">
          <NumberInput value={live.historySize} disabled={readOnly} onChange={(v) => set({ historySize: Math.round(v ?? 0) })} />
        </Field>
      </div>
    </Card>
  );
}

export function RouletteForm({
  roulette,
  maxBet,
  onChange,
  readOnly,
}: {
  roulette: RouletteSettings;
  maxBet: number;
  onChange: (r: RouletteSettings) => void;
  readOnly: boolean;
}) {
  // Limits keys may be stored with any casing; match case-insensitively like the API does.
  const limitKey = (type: string) => Object.keys(roulette.limits).find((k) => k.toLowerCase() === type.toLowerCase());
  const setLimit = (type: string, value: number | null) => {
    const limits = { ...roulette.limits };
    const existing = limitKey(type);
    if (existing) delete limits[existing];
    if (value != null) limits[type] = value;
    onChange({ ...roulette, limits });
  };

  return (
    <Card title="Roulette table">
      <div className="mb-5 max-w-xs">
        <Field label="Max positions per spin" hint="1-500. Call bets alone use up to 9.">
          <NumberInput
            value={roulette.maxBetsPerSpin}
            disabled={readOnly}
            onChange={(v) => onChange({ ...roulette, maxBetsPerSpin: Math.round(v ?? 0) })}
          />
        </Field>
      </div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">Max stake per position</div>
      <p className="mb-4 text-sm text-ink-400">Empty = the game's max bet ({formatMoney(maxBet)}). The total per spin is bounded by min / max bet.</p>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {ROULETTE_BET_TYPES.map((type) => {
          const key = limitKey(type);
          return (
            <Field key={type} label={type}>
              <NumberInput
                nullable
                placeholder={formatMoney(maxBet)}
                value={key ? roulette.limits[key] : null}
                disabled={readOnly}
                onChange={(v) => setLimit(type, v)}
              />
            </Field>
          );
        })}
      </div>
    </Card>
  );
}

export function BlackjackForm({ rules, onChange, readOnly }: { rules: BlackjackSettings; onChange: (r: BlackjackSettings) => void; readOnly: boolean }) {
  const set = (patch: Partial<BlackjackSettings>) => onChange({ ...rules, ...patch });
  return (
    <Card title="Blackjack table rules">
      <p className="mb-4 text-sm text-ink-400">
        One player against the dealer. The dealer checks for blackjack under an ace or a ten; split aces get one card each; no insurance or
        surrender. Each round is dealt from a freshly shuffled, provably-fair shoe. With 6 decks, stand on soft 17, 3 to 2 and double after
        split the house edge is about 0.5%. Changes apply from the next deal.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Decks" hint="1-8.">
          <NumberInput value={rules.decks} disabled={readOnly} onChange={(v) => set({ decks: Math.round(v ?? 0) })} />
        </Field>
        <Field label="Blackjack pays">
          <Select
            value={rules.blackjackPays >= 1.5 ? '3 to 2' : '6 to 5'}
            options={['3 to 2', '6 to 5'] as const}
            disabled={readOnly}
            onChange={(v) => set({ blackjackPays: v === '3 to 2' ? 1.5 : 1.2 })}
          />
        </Field>
        <Field label="Most hands after splits" hint="1 = no splitting, up to 4.">
          <NumberInput value={rules.maxHands} disabled={readOnly} onChange={(v) => set({ maxHands: Math.round(v ?? 0) })} />
        </Field>
        <Field label="Dealer on soft 17">
          <Select
            value={rules.dealerHitsSoft17 ? 'Hits' : 'Stands'}
            options={['Stands', 'Hits'] as const}
            disabled={readOnly}
            onChange={(v) => set({ dealerHitsSoft17: v === 'Hits' })}
          />
        </Field>
        <Field label="Double after split">
          <Select
            value={rules.doubleAfterSplit ? 'Allowed' : 'Not allowed'}
            options={['Allowed', 'Not allowed'] as const}
            disabled={readOnly}
            onChange={(v) => set({ doubleAfterSplit: v === 'Allowed' })}
          />
        </Field>
      </div>
    </Card>
  );
}

/** DEFUSE (Engine Defuse): mirrors DefuseRules in the API — six wires, one detonator, fixed 97% RTP. */
const DEFUSE_WIRES = 6;
const DEFUSE_RTP = 0.97;
const defuseMultiplier = (rung: number) => Math.floor((DEFUSE_RTP * DEFUSE_WIRES * 100) / (DEFUSE_WIRES - rung) + 1e-9) / 100;

export function DefuseLadder({ maxBet, maxWin }: { maxBet: number; maxWin: number }) {
  const rungs = Array.from({ length: DEFUSE_WIRES - 1 }, (_, i) => i + 1);
  const top = defuseMultiplier(DEFUSE_WIRES - 1);
  const short = maxWin < maxBet * top;
  return (
    <Card title="DEFUSE payout ladder">
      <p className="mb-4 text-sm text-ink-400">
        Six wires, one detonator. Each safe wire moves the player up a rung; they can cash out after any safe cut. The ladder is fixed at
        97% RTP and isn't editable. The Bomb Squad Tip (once per round) reveals a safe wire for (next multiplier − current) ÷ 0.97 × bet, which keeps RTP at
        97%. Each round has its own provably-fair seed.
      </p>
      {short && (
        <p className="mb-4 text-sm text-red-300">
          MaxWin {formatMoney(maxWin)} is below MaxBet × {top} = {formatMoney(maxBet * top)}. The API won't accept it: raise MaxWin or lower MaxBet.
        </p>
      )}
      <div className="overflow-hidden rounded-md border border-ink-800">
        <table className="w-full text-sm">
          <thead className="bg-ink-850 text-left text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-3 py-2 font-medium">Safe wires</th>
              <th className="px-3 py-2 font-medium">Chance</th>
              <th className="px-3 py-2 font-medium">Pays</th>
              <th className="px-3 py-2 font-medium">At max bet</th>
              <th className="px-3 py-2 font-medium">Tip cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {rungs.map((r) => (
              <tr key={r} className="bg-ink-950">
                <td className="px-3 py-1.5 font-mono">{r === DEFUSE_WIRES - 1 ? `${r} · defuse` : r}</td>
                <td className="px-3 py-1.5 font-mono">{(((DEFUSE_WIRES - r) / DEFUSE_WIRES) * 100).toFixed(1)}%</td>
                <td className="px-3 py-1.5 font-mono">×{defuseMultiplier(r).toFixed(2)}</td>
                <td className="px-3 py-1.5 font-mono">{formatMoney(maxBet * defuseMultiplier(r))}</td>
                <td className="px-3 py-1.5 font-mono text-ink-400">{(((defuseMultiplier(r) - defuseMultiplier(r - 1)) / DEFUSE_RTP) * 100).toFixed(1)}% of bet at rung {r - 1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** VAULT CRACKER (Engine Vault): mirrors VaultRules in the API — 5 digits, 4 tumblers per digit, fixed 97% RTP. */
const VAULT_STEPS = 5;
const VAULT_TUMBLERS = 4;
const VAULT_RTP = 0.97;
const vaultMultiplier = (rung: number) =>
  rung <= 0 ? 1 : Math.floor((VAULT_RTP * 100 * VAULT_TUMBLERS ** rung) / (VAULT_TUMBLERS - 1) ** rung + 1e-9) / 100;

export function VaultLadder({ maxBet, maxWin }: { maxBet: number; maxWin: number }) {
  const rungs = Array.from({ length: VAULT_STEPS }, (_, i) => i + 1);
  const top = vaultMultiplier(VAULT_STEPS);
  const short = maxWin < maxBet * top;
  return (
    <Card title="Vault Cracker payout ladder">
      <p className="mb-4 text-sm text-ink-400">
        A five-digit combination; each digit is a ring of four tumblers and one trips the alarm. Each cracked digit moves the player up a
        rung; they can cash out after any digit. The ladder is fixed at 97% RTP and isn't editable. The Stethoscope (once per round) cracks
        the current digit for (next multiplier − current) ÷ 0.97 × bet, which keeps RTP at 97%. Each round has its own provably-fair seed.
      </p>
      {short && (
        <p className="mb-4 text-sm text-red-300">
          MaxWin {formatMoney(maxWin)} is below MaxBet × {top} = {formatMoney(maxBet * top)}. The API won't accept it: raise MaxWin or lower MaxBet.
        </p>
      )}
      <div className="overflow-hidden rounded-md border border-ink-800">
        <table className="w-full text-sm">
          <thead className="bg-ink-850 text-left text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-3 py-2 font-medium">Digits</th>
              <th className="px-3 py-2 font-medium">Chance</th>
              <th className="px-3 py-2 font-medium">Pays</th>
              <th className="px-3 py-2 font-medium">At max bet</th>
              <th className="px-3 py-2 font-medium">Stethoscope</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {rungs.map((r) => (
              <tr key={r} className="bg-ink-950">
                <td className="px-3 py-1.5 font-mono">{r === VAULT_STEPS ? `${r} · open` : r}</td>
                <td className="px-3 py-1.5 font-mono">{(((VAULT_TUMBLERS - 1) / VAULT_TUMBLERS) ** r * 100).toFixed(1)}%</td>
                <td className="px-3 py-1.5 font-mono">×{vaultMultiplier(r).toFixed(2)}</td>
                <td className="px-3 py-1.5 font-mono">{formatMoney(maxBet * vaultMultiplier(r))}</td>
                <td className="px-3 py-1.5 font-mono text-ink-400">
                  {(((vaultMultiplier(r) - vaultMultiplier(r - 1)) / VAULT_RTP) * 100).toFixed(1)}% of bet for digit {r}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** DEEP DIVE (Engine Dive): mirrors DiveRules in the API — 8 zones, 3 caves per zone, fixed 97% RTP. */
const DIVE_ZONES = 8;
const DIVE_CAVES = 3;
const DIVE_RTP = 0.97;
const diveMultiplier = (rung: number) =>
  rung <= 0 ? 1 : Math.floor((DIVE_RTP * 100 * DIVE_CAVES ** rung) / (DIVE_CAVES - 1) ** rung + 1e-9) / 100;

export function DiveLadder({ maxBet, maxWin }: { maxBet: number; maxWin: number }) {
  const rungs = Array.from({ length: DIVE_ZONES }, (_, i) => i + 1);
  const top = diveMultiplier(DIVE_ZONES);
  const short = maxWin < maxBet * top;
  return (
    <Card title="Deep Dive payout ladder">
      <p className="mb-4 text-sm text-ink-400">
        Eight depth zones of 25 m; each has three caves and a shark hides in one. Each cleared zone moves the player up a rung; they can
        surface (cash out) after any zone, and clearing all eight reaches the treasure at the abyss. The ladder is fixed at 97% RTP and
        isn't editable. Each dive has its own provably-fair seed.
      </p>
      {short && (
        <p className="mb-4 text-sm text-red-300">
          MaxWin {formatMoney(maxWin)} is below MaxBet × {top} = {formatMoney(maxBet * top)}. The API won't accept it: raise MaxWin or lower MaxBet.
        </p>
      )}
      <div className="overflow-hidden rounded-md border border-ink-800">
        <table className="w-full text-sm">
          <thead className="bg-ink-850 text-left text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-3 py-2 font-medium">Depth</th>
              <th className="px-3 py-2 font-medium">Chance</th>
              <th className="px-3 py-2 font-medium">Pays</th>
              <th className="px-3 py-2 font-medium">At max bet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {rungs.map((r) => (
              <tr key={r} className="bg-ink-950">
                <td className="px-3 py-1.5 font-mono">{r === DIVE_ZONES ? `${r * 25} m · abyss` : `${r * 25} m`}</td>
                <td className="px-3 py-1.5 font-mono">{(((DIVE_CAVES - 1) / DIVE_CAVES) ** r * 100).toFixed(2)}%</td>
                <td className="px-3 py-1.5 font-mono">×{diveMultiplier(r).toFixed(2)}</td>
                <td className="px-3 py-1.5 font-mono">{formatMoney(maxBet * diveMultiplier(r))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
