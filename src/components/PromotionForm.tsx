import { enginesFor, ISLAND_ZONES, LEADERBOARD_METRICS, type LeaderboardMetric, type PromoGame, type Promotion } from '../api/promoTypes';
import { ROULETTE_BET_TYPES } from '../lib/gameBody';
import { formatMoney } from '../lib/rtp';
import { TableSettings } from './TablePromoSettings';

const metricLabel = (m: LeaderboardMetric | undefined) => LEADERBOARD_METRICS.find((x) => x.metric === (m ?? 'BestMultiple'))!.label;

/** Roulette bet types as toggles. */
export function ChipTypes({ value, onChange, disabled }: { value: string[]; onChange: (v: string[]) => void; disabled: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ROULETTE_BET_TYPES.map((t) => {
        const on = value.includes(t);
        return (
          <label
            key={t}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm ${on ? 'border-accent bg-accent/10 text-ink-100' : 'border-ink-700 bg-ink-950 text-ink-300'}`}
          >
            <input
              type="checkbox"
              className="accent-[#4f8cff]"
              checked={on}
              disabled={disabled}
              onChange={(e) => onChange(e.target.checked ? [...value, t] : value.filter((x) => x !== t))}
            />
            {t}
          </label>
        );
      })}
    </div>
  );
}
import { Card, Field, NumberInput, Select, TextInput, Toggle } from './ui';

/** "2026-11-03T14:30" in the browser's time zone ⇄ ISO UTC. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

/** Everything about a promotion except its awards. */
export function PromotionForm({
  promo,
  games,
  onChange,
  readOnly,
}: {
  promo: Promotion;
  games: PromoGame[];
  onChange: (p: Promotion) => void;
  readOnly: boolean;
}) {
  const set = (patch: Partial<Promotion>) => onChange({ ...promo, ...patch });
  const toggleGame = (gameId: string, on: boolean) => {
    const gameIds = on ? [...promo.gameIds, gameId] : promo.gameIds.filter((g) => g !== gameId);
    // Attractions only mean something with Fortune Isle picked; the API refuses them otherwise.
    const isle = games.some((g) => g.engine === 'Island' && gameIds.includes(g.gameId));
    set({ gameIds, subGames: isle ? promo.subGames ?? [] : [] });
  };

  return (
    <div className="space-y-6">
      <Card title="Promotion">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" hint="Shown to players.">
            <TextInput value={promo.name} disabled={readOnly} maxLength={100} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="On">
            <div className="flex h-[38px] items-center gap-3">
              <Toggle label="Promotion on" checked={promo.enabled} disabled={readOnly} onChange={(enabled) => set({ enabled })} />
              <span className="text-sm text-ink-400">{promo.enabled ? 'Runs during its dates' : 'Switched off'}</span>
            </div>
          </Field>
          <Field label="Starts" hint="Your local time. Empty = as soon as it's switched on.">
            <TextInput type="datetime-local" value={toLocalInput(promo.startsAt)} disabled={readOnly} onChange={(e) => set({ startsAt: fromLocalInput(e.target.value) })} />
          </Field>
          <Field label="Ends" hint="Empty = until it's switched off.">
            <TextInput type="datetime-local" value={toLocalInput(promo.endsAt)} disabled={readOnly} onChange={(e) => set({ endsAt: fromLocalInput(e.target.value) })} />
          </Field>
          <Field label="Budget" hint="The most it can pay out in total. Free-bet winnings are still paid once it's spent.">
            <NumberInput value={promo.budget} disabled={readOnly} onChange={(v) => set({ budget: v ?? 0 })} />
          </Field>
          <Field label="Min qualifying stake" hint="Smaller real-money bets don't count. 0 = any.">
            <NumberInput value={promo.minStake} disabled={readOnly} onChange={(v) => set({ minStake: v ?? 0 })} />
          </Field>
          <Field label="Terms" hint="Short terms players see (max 500 characters)." className="sm:col-span-2">
            <textarea
              value={promo.terms}
              disabled={readOnly}
              maxLength={500}
              rows={2}
              onChange={(e) => set({ terms: e.target.value })}
              className="w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft disabled:bg-ink-900 disabled:text-ink-400"
            />
          </Field>
        </div>

        <div className="mt-5 text-xs font-medium uppercase tracking-wide text-ink-400">Games</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {games.filter((g) => enginesFor(promo.type).includes(g.engine) || promo.gameIds.includes(g.gameId)).map((g) => {
            const on = promo.gameIds.includes(g.gameId);
            return (
              <label
                key={g.gameId}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                  on ? 'border-accent bg-accent/10 text-ink-100' : 'border-ink-700 bg-ink-950 text-ink-300'
                } ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                <input type="checkbox" className="accent-[#4f8cff]" checked={on} disabled={readOnly} onChange={(e) => toggleGame(g.gameId, e.target.checked)} />
                {g.name}
                {g.engine === 'Island' && <span className="text-xs text-ink-400">(9 attractions)</span>}
                {!g.enabled && <span className="text-xs text-ink-400">(disabled)</span>}
              </label>
            );
          })}
        </div>
        <IslandAttractions promo={promo} games={games} set={set} readOnly={readOnly} />
      </Card>

      <TypeSettings promo={promo} set={set} readOnly={readOnly} games={games} />
      <TableSettings promo={promo} set={set} readOnly={readOnly} games={games} />
    </div>
  );
}

/**
 * Fortune Isle: which of its attractions the promotion counts in (and where its free plays can be used). None picked
 * = every attraction, which is how it's stored (subGames: []).
 */
function IslandAttractions({ promo, games, set, readOnly }: { promo: Promotion; games: PromoGame[]; set: (p: Partial<Promotion>) => void; readOnly: boolean }) {
  const isle = games.find((g) => g.engine === 'Island' && promo.gameIds.includes(g.gameId) && g.subGames?.length);
  if (!isle) return null;
  const list = isle.subGames!;
  const picked = promo.subGames ?? [];
  const every = picked.length === 0;
  const on = (key: string) => every || picked.includes(key);
  const toggle = (key: string, value: boolean) => {
    const current = every ? list.map((a) => a.key) : picked;
    const next = value ? [...current, key] : current.filter((k) => k !== key);
    if (next.length === 0) return; // at least one; "every attraction" is the button below
    set({ subGames: next.length === list.length ? [] : list.map((a) => a.key).filter((k) => next.includes(k)) });
  };
  const zones = [...new Set(list.map((a) => a.zone))];
  const hits = promo.leaderboard?.metric === 'Hits';
  const rouletteOnly = promo.type === 'LuckyNumber' || promo.type === 'BoostedPayout';
  const rouletteMissing = rouletteOnly && !on('roulette');
  const freeBets = promo.type === 'FreeBet' || ['drop', 'mystery', 'collection', 'streak'].some((k) => (promo as unknown as Record<string, { prize?: string } | null>)[k]?.prize === 'FreeBet') || promo.type === 'BuyXGetFree';

  return (
    <div className="mt-5 rounded-md border border-ink-700 bg-ink-950/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-ink-400">{isle.name} attractions</div>
          <p className="mt-1 text-sm text-ink-400">
            {every ? 'Counts on every attraction.' : `Counts on ${picked.length} of ${list.length} attractions — plays elsewhere on the island don't count.`}
            {freeBets && ' Its free plays can only be used on these.'}
          </p>
        </div>
        {!every && !readOnly && (
          <button type="button" className="text-sm text-accent hover:underline" onClick={() => set({ subGames: [] })}>
            Every attraction
          </button>
        )}
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map((z) => (
          <div key={z}>
            <div className="mb-1.5 text-xs text-ink-400">{ISLAND_ZONES[z] ?? z}</div>
            <div className="space-y-1.5">
              {list.filter((a) => a.zone === z).map((a) => {
                const checked = on(a.key);
                const dim = rouletteOnly && a.key !== 'roulette';
                return (
                  <label
                    key={a.key}
                    className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                      checked ? 'border-accent bg-accent/10 text-ink-100' : 'border-ink-700 bg-ink-950 text-ink-300'
                    } ${readOnly ? 'cursor-not-allowed opacity-70' : ''} ${dim ? 'opacity-60' : ''}`}
                  >
                    <input type="checkbox" className="mt-0.5 accent-[#4f8cff]" checked={checked} disabled={readOnly} onChange={(e) => toggle(a.key, e.target.checked)} />
                    <span>
                      {a.name}
                      {a.kind !== 'instant' && <span className="ml-1 text-xs text-ink-400">({a.kind === 'crash' ? 'crash' : 'steps'})</span>}
                      {hits && <span className="block text-xs text-ink-400">Hit: {a.hit}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {rouletteOnly && (
        <p className={`mt-3 text-sm ${rouletteMissing ? 'text-red-300' : 'text-ink-400'}`}>
          {rouletteMissing
            ? 'This promotion only plays on Roulette — tick Roulette, or it will be refused.'
            : 'Only Roulette counts on the island for this type; the other attractions are ignored.'}
        </p>
      )}
    </div>
  );
}

function TypeSettings({ promo, set, readOnly, games }: { promo: Promotion; set: (p: Partial<Promotion>) => void; readOnly: boolean; games: PromoGame[] }) {
  const int = (v: number | null) => Math.round(v ?? 0);
  const isle = games.some((g) => g.engine === 'Island' && promo.gameIds.includes(g.gameId));
  const isleRoulette = isle && ((promo.subGames ?? []).length === 0 || promo.subGames.includes('roulette'));
  const roulette = isleRoulette || games.some((g) => g.engine === 'Roulette' && promo.gameIds.includes(g.gameId));

  if (promo.freeBet) {
    const f = promo.freeBet;
    const up = (patch: Partial<typeof f>) => set({ freeBet: { ...f, ...patch } });
    return (
      <Card title="Free bets">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Value of each free bet">
            <NumberInput value={f.stake} disabled={readOnly} onChange={(v) => up({ stake: v ?? 0 })} />
          </Field>
          <Field label="Free bets per player">
            <NumberInput value={f.betsPerPlayer} disabled={readOnly} onChange={(v) => up({ betsPerPlayer: int(v) })} />
          </Field>
          <Field label="Valid for (days)">
            <NumberInput value={f.validDays} disabled={readOnly} onChange={(v) => up({ validDays: int(v) })} />
          </Field>
          <Field label="Who gets them">
            <Select
              value={f.grant === 'Manual' ? 'Players I pick' : 'Every player, on first visit'}
              options={['Players I pick', 'Every player, on first visit'] as const}
              disabled={readOnly}
              onChange={(v) => up({ grant: v === 'Players I pick' ? 'Manual' : 'OnFirstVisit' })}
            />
          </Field>
          <Field label="A winning free bet pays" className="sm:col-span-2">
            <Select
              value={f.stakeReturned ? 'Whole return (stake included)' : 'Winnings above the stake'}
              options={['Winnings above the stake', 'Whole return (stake included)'] as const}
              disabled={readOnly}
              onChange={(v) => up({ stakeReturned: v.startsWith('Whole') })}
            />
          </Field>
          {roulette && (
            <Field label="Roulette: free chips go on" hint="Pick none for any bet." className="sm:col-span-3">
              <ChipTypes value={f.betTypes ?? []} disabled={readOnly} onChange={(betTypes) => up({ betTypes })} />
            </Field>
          )}
        </div>
        <p className="mt-4 text-sm text-ink-400">
          {f.grant === 'Manual'
            ? 'Give them to players from the Free bets tab once the promotion is saved.'
            : 'Every player gets them the first time they open one of the games while the promotion is live.'}{' '}
          {isle && 'On Fortune Isle a free bet is a free play at its value, on any attraction it counts on (roulette: the bets must add up to it). '}
          Example: a {formatMoney(f.stake)} free bet cashed out at 3× pays{' '}
          {formatMoney(f.stakeReturned ? f.stake * 3 : f.stake * 2)}.
        </p>
      </Card>
    );
  }

  if (promo.rain) {
    const r = promo.rain;
    const up = (patch: Partial<typeof r>) => set({ rain: { ...r, ...patch } });
    return (
      <Card title="Rain">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Pool per rain">
            <NumberInput value={r.pool} disabled={readOnly} onChange={(v) => up({ pool: v ?? 0 })} />
          </Field>
          <Field label="Players it lands on" hint="Up to this many, picked at random.">
            <NumberInput value={r.recipients} disabled={readOnly} onChange={(v) => up({ recipients: int(v) })} />
          </Field>
          <Field label="Active = bet within (minutes)">
            <NumberInput value={r.activeWithinMinutes} disabled={readOnly} onChange={(v) => up({ activeWithinMinutes: int(v) })} />
          </Field>
          <Field label="Every (min minutes)">
            <NumberInput value={r.minIntervalMinutes} disabled={readOnly} onChange={(v) => up({ minIntervalMinutes: int(v) })} />
          </Field>
          <Field label="to (max minutes)">
            <NumberInput value={r.maxIntervalMinutes} disabled={readOnly} onChange={(v) => up({ maxIntervalMinutes: int(v) })} />
          </Field>
        </div>
        <p className="mt-4 text-sm text-ink-400">
          The pool is split equally among the players it lands on ({formatMoney(r.pool / Math.max(1, r.recipients))} each when it reaches{' '}
          {r.recipients}; more each when fewer are active). Rain times are random within the interval.
        </p>
      </Card>
    );
  }

  if (promo.drop) {
    const d = promo.drop;
    const up = (patch: Partial<typeof d>) => set({ drop: { ...d, ...patch } });
    return (
      <Card title="Round drops">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Chance per round (%)" hint={d.chance > 0 ? `About one round in ${Math.round(1 / d.chance)}.` : undefined}>
            <NumberInput value={Math.round(d.chance * 10000) / 100} disabled={readOnly} onChange={(v) => up({ chance: (v ?? 0) / 100 })} />
          </Field>
          <Field label="Winners per drop">
            <NumberInput value={d.winners} disabled={readOnly} onChange={(v) => up({ winners: int(v) })} />
          </Field>
          <Field label="Prize">
            <Select value={d.prize} options={['Cash', 'FreeBet'] as const} disabled={readOnly} onChange={(prize) => up({ prize })} />
          </Field>
          <Field label={d.prize === 'Cash' ? 'Amount' : 'Free bet value'}>
            <NumberInput value={d.amount} disabled={readOnly} onChange={(v) => up({ amount: v ?? 0 })} />
          </Field>
          {d.prize === 'FreeBet' && (
            <Field label="Free bet valid for (days)">
              <NumberInput value={d.freeBetValidDays} disabled={readOnly} onChange={(v) => up({ freeBetValidDays: int(v) })} />
            </Field>
          )}
        </div>
      </Card>
    );
  }

  if (promo.leaderboard) {
    const l = promo.leaderboard;
    const up = (patch: Partial<typeof l>) => set({ leaderboard: { ...l, ...patch } });
    return (
      <Card title="Leaderboard">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Rank players by" className="sm:col-span-3">
            <Select
              value={metricLabel(l.metric)}
              options={LEADERBOARD_METRICS.map((m) => m.label)}
              disabled={readOnly}
              onChange={(label) => up({ metric: LEADERBOARD_METRICS.find((m) => m.label === label)!.metric })}
            />
          </Field>
          <Field label="Period" hint="UTC. Daily / weekly boards pay out and restart each period.">
            <Select value={l.period} options={['Once', 'Daily', 'Weekly'] as const} disabled={readOnly} onChange={(period) => up({ period })} />
          </Field>
          <Field label="Prizes by rank" hint="Comma separated: 1st, 2nd, 3rd …" className="sm:col-span-2">
            <PrizeList value={l.prizes} disabled={readOnly} onChange={(prizes) => up({ prizes })} />
          </Field>
        </div>
        <p className="mt-4 text-sm text-ink-400">
          Players rank by {metricLabel(l.metric).toLowerCase()}, counting real-money play of at least the min qualifying stake. Free bets
          don't count.
          {isle && l.metric === 'Hits' && ' On Fortune Isle a hit is each attraction\'s top result — shown under each attraction above.'}
          {l.period === 'Once' && ' Prizes are paid when the promotion ends.'} {l.prizes.length} prize{l.prizes.length === 1 ? '' : 's'} totalling{' '}
          {formatMoney(l.prizes.reduce((a, b) => a + b, 0))} per period.
        </p>
      </Card>
    );
  }

  if (promo.race) {
    const r = promo.race;
    const up = (patch: Partial<typeof r>) => set({ race: { ...r, ...patch } });
    return (
      <Card title="Multiplier race">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Target multiple">
            <NumberInput value={r.targetMultiplier} disabled={readOnly} onChange={(v) => up({ targetMultiplier: v ?? 0 })} />
          </Field>
          <Field label="Winners">
            <NumberInput value={r.winners} disabled={readOnly} onChange={(v) => up({ winners: int(v) })} />
          </Field>
          <Field label="Prize each">
            <NumberInput value={r.prize} disabled={readOnly} onChange={(v) => up({ prize: v ?? 0 })} />
          </Field>
        </div>
        <p className="mt-4 text-sm text-ink-400">
          The first {r.winners} players to win at {r.targetMultiplier}× or more (one prize per player) get {formatMoney(r.prize)}. Up to{' '}
          {formatMoney(r.prize * r.winners)} in total.
        </p>
      </Card>
    );
  }

  if (promo.jackpot) {
    const j = promo.jackpot;
    const up = (patch: Partial<typeof j>) => set({ jackpot: { ...j, ...patch } });
    return (
      <Card title="Community jackpot">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Triggers at a crash of (×)">
            <NumberInput value={j.triggerMultiplier} disabled={readOnly} onChange={(v) => up({ triggerMultiplier: v ?? 0 })} />
          </Field>
          <Field label="Pool">
            <NumberInput value={j.pool} disabled={readOnly} onChange={(v) => up({ pool: v ?? 0 })} />
          </Field>
          <Field label="Most hits per day">
            <NumberInput value={j.maxHitsPerDay} disabled={readOnly} onChange={(v) => up({ maxHitsPerDay: int(v) })} />
          </Field>
          <Field label="Shared" className="sm:col-span-2">
            <Select
              value={j.splitByStake ? 'In proportion to stake' : 'Equally'}
              options={['Equally', 'In proportion to stake'] as const}
              disabled={readOnly}
              onChange={(v) => up({ splitByStake: v !== 'Equally' })}
            />
          </Field>
        </div>
        <p className="mt-4 text-sm text-ink-400">Everyone with a qualifying real-money bet in the round shares the pool, whether they cashed out or not.</p>
      </Card>
    );
  }

  return null;
}

function PrizeList({ value, onChange, disabled }: { value: number[]; onChange: (v: number[]) => void; disabled: boolean }) {
  return (
    <TextInput
      defaultValue={value.join(', ')}
      disabled={disabled}
      className="font-mono"
      onChange={(e) => {
        const parts = e.target.value.split(',').map((s) => s.trim()).filter(Boolean).map(Number);
        if (parts.every((n) => Number.isFinite(n))) onChange(parts);
      }}
    />
  );
}
