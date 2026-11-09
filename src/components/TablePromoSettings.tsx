import { useState } from 'react';
import { SPECIAL_HANDS, WEEKDAYS, type Prize, type PromoGame, type Promotion, type SpecialHand, type Weekday } from '../api/promoTypes';
import { formatMoney } from '../lib/rtp';
import { Card, Field, NumberInput, Select, TextInput } from './ui';

// Settings for the card, roulette, blackjack and cross-game promotions (cashback, streaks). See PromotionForm for the rest.

const int = (v: number | null) => Math.round(v ?? 0);
const PRIZES = ['Cash', 'Free bet'] as const;
const prizeLabel = (p: Prize) => (p === 'Cash' ? 'Cash' : 'Free bet');
const prizeValue = (l: (typeof PRIZES)[number]): Prize => (l === 'Cash' ? 'Cash' : 'FreeBet');

/** Prize kind + amount + free-bet validity, shared by several types. */
function PrizeFields({
  prize,
  amount,
  days,
  amountLabel,
  readOnly,
  onChange,
}: {
  prize: Prize;
  amount: number;
  days: number;
  amountLabel: string;
  readOnly: boolean;
  onChange: (patch: { prize?: Prize; amount?: number; days?: number }) => void;
}) {
  return (
    <>
      <Field label="Prize">
        <Select value={prizeLabel(prize)} options={PRIZES} disabled={readOnly} onChange={(v) => onChange({ prize: prizeValue(v) })} />
      </Field>
      <Field label={prize === 'Cash' ? amountLabel : 'Free bet value'}>
        <NumberInput value={amount} disabled={readOnly} onChange={(v) => onChange({ amount: v ?? 0 })} />
      </Field>
      {prize === 'FreeBet' && (
        <Field label="Free bet valid for (days)">
          <NumberInput value={days} disabled={readOnly} onChange={(v) => onChange({ days: int(v) })} />
        </Field>
      )}
    </>
  );
}

/** Comma-separated list input that keeps the text while typing. */
function ListInput({ value, onChange, disabled, parse }: { value: string; onChange: (text: string) => void; disabled: boolean; parse?: boolean }) {
  const [text, setText] = useState(value);
  return (
    <TextInput
      value={text}
      disabled={disabled}
      className={parse ? 'font-mono' : ''}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value);
      }}
    />
  );
}

export function TableSettings({
  promo,
  set,
  readOnly,
  games,
}: {
  promo: Promotion;
  set: (p: Partial<Promotion>) => void;
  readOnly: boolean;
  games: PromoGame[];
}) {
  if (promo.mystery) {
    const m = promo.mystery;
    const up = (patch: Partial<typeof m>) => set({ mystery: { ...m, ...patch } });
    return (
      <Card title="Mystery prize">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Chance per card (%)" hint={m.chance > 0 ? `About one card in ${Math.round(1 / m.chance)}.` : undefined}>
            <NumberInput value={Math.round(m.chance * 10000) / 100} disabled={readOnly} onChange={(v) => up({ chance: (v ?? 0) / 100 })} />
          </Field>
          <PrizeFields
            prize={m.prize}
            amount={m.amount}
            days={m.freeBetValidDays}
            amountLabel="Prize amount"
            readOnly={readOnly}
            onChange={(p) => up({ prize: p.prize ?? m.prize, amount: p.amount ?? m.amount, freeBetValidDays: p.days ?? m.freeBetValidDays })}
          />
        </div>
        <p className="mt-4 text-sm text-ink-400">
          Each paid card of at least the min qualifying stake has this chance to reveal the hidden prize on top of what the card pays.
        </p>
      </Card>
    );
  }

  if (promo.buyX) {
    const b = promo.buyX;
    const up = (patch: Partial<typeof b>) => set({ buyX: { ...b, ...patch } });
    return (
      <Card title="Buy X, get one free">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Paid cards per free card">
            <NumberInput value={b.buy} disabled={readOnly} onChange={(v) => up({ buy: int(v) })} />
          </Field>
          <Field label="Most free cards per player per day">
            <NumberInput value={b.maxFreePerDay} disabled={readOnly} onChange={(v) => up({ maxFreePerDay: int(v) })} />
          </Field>
          <Field label="Free card valid for (days)">
            <NumberInput value={b.freeBetValidDays} disabled={readOnly} onChange={(v) => up({ freeBetValidDays: int(v) })} />
          </Field>
        </div>
        <p className="mt-4 text-sm text-ink-400">
          Every {b.buy} paid cards earn a free card at the price of the card that completed the set. Free cards pay their full prize.
        </p>
      </Card>
    );
  }

  if (promo.collection) {
    const c = promo.collection;
    const up = (patch: Partial<typeof c>) => set({ collection: { ...c, ...patch } });
    return (
      <Card title="Collection mission">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Symbols to collect" hint="2-12 names, comma separated." className="sm:col-span-3">
            <ListInput
              value={c.symbols.join(', ')}
              disabled={readOnly}
              onChange={(t) => up({ symbols: t.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
          </Field>
          <Field label="Chance a card carries a symbol (%)">
            <NumberInput value={Math.round(c.chancePerCard * 10000) / 100} disabled={readOnly} onChange={(v) => up({ chancePerCard: (v ?? 0) / 100 })} />
          </Field>
          <Field label="Sets per player" hint="0 = no limit.">
            <NumberInput value={c.maxCompletions} disabled={readOnly} onChange={(v) => up({ maxCompletions: int(v) })} />
          </Field>
          <div />
          <PrizeFields
            prize={c.prize}
            amount={c.reward}
            days={c.freeBetValidDays}
            amountLabel="Reward for a full set"
            readOnly={readOnly}
            onChange={(p) => up({ prize: p.prize ?? c.prize, reward: p.amount ?? c.reward, freeBetValidDays: p.days ?? c.freeBetValidDays })}
          />
        </div>
        <p className="mt-4 text-sm text-ink-400">
          A qualifying paid card has a {Math.round(c.chancePerCard * 100)}% chance to carry one of the {c.symbols.length} symbols at random. Collecting all of
          them pays the reward and starts a new set.
        </p>
      </Card>
    );
  }

  if (promo.cashback) {
    const c = promo.cashback;
    const up = (patch: Partial<typeof c>) => set({ cashback: { ...c, ...patch } });
    const picked = games.filter((g) => promo.gameIds.includes(g.gameId));
    return (
      <Card title="Cashback">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Cashback (%)" hint="Of the net loss: stakes − wins.">
            <NumberInput value={c.percent} disabled={readOnly} onChange={(v) => up({ percent: v ?? 0 })} />
          </Field>
          <Field label="Paid">
            <Select value={c.period} options={['Daily', 'Weekly'] as const} disabled={readOnly} onChange={(period) => up({ period })} />
          </Field>
          <Field label="Most per player per period">
            <NumberInput value={c.maxPerPlayer} disabled={readOnly} onChange={(v) => up({ maxPerPlayer: v ?? 0 })} />
          </Field>
          <Field label="Smallest net loss that earns cashback">
            <NumberInput value={c.minLoss} disabled={readOnly} onChange={(v) => up({ minLoss: v ?? 0 })} />
          </Field>
          <Field label="Only losses on these days count (UTC)" hint="None = every day — e.g. pick Tuesday for a roulette day." className="sm:col-span-2">
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => {
                const on = c.days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={readOnly}
                    onClick={() => up({ days: on ? c.days.filter((x) => x !== d) : ([...c.days, d] as Weekday[]) })}
                    className={`rounded-md border px-2.5 py-1.5 text-xs ${on ? 'border-accent bg-accent/10 text-ink-100' : 'border-ink-700 bg-ink-950 text-ink-300'}`}
                  >
                    {d.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
        {picked.length > 0 && (
          <>
            <div className="mt-5 text-xs font-medium uppercase tracking-wide text-ink-400">How much of each game's net loss counts (%)</div>
            <div className="mt-2 grid gap-3 sm:grid-cols-4">
              {picked.map((g) => (
                <Field key={g.gameId} label={g.name}>
                  <NumberInput
                    value={c.gameWeights[g.gameId] ?? 100}
                    disabled={readOnly}
                    onChange={(v) => up({ gameWeights: { ...c.gameWeights, [g.gameId]: v ?? 100 } })}
                  />
                </Field>
              ))}
            </div>
          </>
        )}
        <p className="mt-4 text-sm text-ink-400">
          Paid automatically after each {c.period === 'Daily' ? 'day' : 'week'} (UTC): {c.percent}% of a player's weighted net loss, if it's at least{' '}
          {formatMoney(c.minLoss)}, up to {formatMoney(c.maxPerPlayer)}. Low-edge games like blackjack are usually weighted lower.
        </p>
      </Card>
    );
  }

  if (promo.streak) {
    const s = promo.streak;
    const up = (patch: Partial<typeof s>) => set({ streak: { ...s, ...patch } });
    return (
      <Card title="Streak mission">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Count">
            <Select
              value={s.counts === 'Plays' ? 'Plays in a row' : 'Wins in a row'}
              options={['Plays in a row', 'Wins in a row'] as const}
              disabled={readOnly}
              onChange={(v) => up({ counts: v === 'Plays in a row' ? 'Plays' : 'Wins' })}
            />
          </Field>
          <Field label="Target">
            <NumberInput value={s.target} disabled={readOnly} onChange={(v) => up({ target: int(v) })} />
          </Field>
          <Field label="Streak breaks after (minutes idle)">
            <NumberInput value={s.maxGapMinutes} disabled={readOnly} onChange={(v) => up({ maxGapMinutes: int(v) })} />
          </Field>
          <PrizeFields
            prize={s.prize}
            amount={s.reward}
            days={s.freeBetValidDays}
            amountLabel="Reward"
            readOnly={readOnly}
            onChange={(p) => up({ prize: p.prize ?? s.prize, reward: p.amount ?? s.reward, freeBetValidDays: p.days ?? s.freeBetValidDays })}
          />
          <Field label="Most rewards per player per day">
            <NumberInput value={s.maxRewardsPerDay} disabled={readOnly} onChange={(v) => up({ maxRewardsPerDay: int(v) })} />
          </Field>
        </div>
        <p className="mt-4 text-sm text-ink-400">
          {s.counts === 'Plays'
            ? `${s.target} qualifying plays in a row (no break longer than ${s.maxGapMinutes} minutes) earn the reward.`
            : `${s.target} winning rounds in a row earn the reward; a losing round starts again, a push doesn't count either way.`}
        </p>
      </Card>
    );
  }

  if (promo.lucky) {
    const l = promo.lucky;
    const up = (patch: Partial<typeof l>) => set({ lucky: { ...l, ...patch } });
    return (
      <Card title="Lucky number">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Lucky number" hint="Empty = a new random number every day (UTC).">
            <NumberInput nullable value={l.number} disabled={readOnly} onChange={(v) => up({ number: v == null ? null : int(v) })} />
          </Field>
          <Field label="Prize">
            <NumberInput value={l.prize} disabled={readOnly} onChange={(v) => up({ prize: v ?? 0 })} />
          </Field>
          <Field label="Most prizes per player per day">
            <NumberInput value={l.maxPrizesPerPlayerPerDay} disabled={readOnly} onChange={(v) => up({ maxPrizesPerPlayerPerDay: int(v) })} />
          </Field>
        </div>
        <p className="mt-4 text-sm text-ink-400">
          When the ball lands on the lucky number, players with a straight-up bet on it of at least the min qualifying stake win{' '}
          {formatMoney(l.prize)} on top of the table payout.
        </p>
      </Card>
    );
  }

  if (promo.boost) {
    const b = promo.boost;
    const up = (patch: Partial<typeof b>) => set({ boost: { ...b, ...patch } });
    return (
      <Card title="Boosted payouts">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Boosted numbers" hint="1-10 numbers, comma separated." className="sm:col-span-3">
            <ListInput
              parse
              value={b.numbers.join(', ')}
              disabled={readOnly}
              onChange={(t) => up({ numbers: t.split(',').map((s) => s.trim()).filter(Boolean).map(Number).filter((n) => Number.isInteger(n)) })}
            />
          </Field>
          <Field label="Straight-up pays (to 1)" hint="The table pays 35 to 1.">
            <NumberInput value={b.payout} disabled={readOnly} onChange={(v) => up({ payout: int(v) })} />
          </Field>
          <Field label="Largest stake boosted" hint="Per number per spin.">
            <NumberInput value={b.maxBoostedStake} disabled={readOnly} onChange={(v) => up({ maxBoostedStake: v ?? 0 })} />
          </Field>
        </div>
        <p className="mt-4 text-sm text-ink-400">
          A straight-up win on {b.numbers.join(', ') || '…'} pays {b.payout} to 1 instead of 35 to 1. The extra ({b.payout - 35} × the stake, up to{' '}
          {formatMoney((b.payout - 35) * b.maxBoostedStake)} a spin) comes from the promotion's budget, not the game.
        </p>
      </Card>
    );
  }

  if (promo.handBonus) {
    const h = promo.handBonus;
    const up = (patch: Partial<typeof h>) => set({ handBonus: { ...h, ...patch } });
    return (
      <Card title="Hand bonus">
        <div className="grid gap-4 sm:grid-cols-3">
          <HandPicker value={h.hand} readOnly={readOnly} onChange={(hand) => up({ hand })} />
          <Field label="Bonus">
            <NumberInput value={h.prize} disabled={readOnly} onChange={(v) => up({ prize: v ?? 0 })} />
          </Field>
          <Field label="Most bonuses per player per day">
            <NumberInput value={h.maxPerPlayerPerDay} disabled={readOnly} onChange={(v) => up({ maxPerPlayerPerDay: int(v) })} />
          </Field>
        </div>
      </Card>
    );
  }

  if (promo.handJackpot) {
    const j = promo.handJackpot;
    const up = (patch: Partial<typeof j>) => set({ handJackpot: { ...j, ...patch } });
    return (
      <Card title="Hand jackpot">
        <div className="grid gap-4 sm:grid-cols-3">
          <HandPicker value={j.hand} readOnly={readOnly} onChange={(hand) => up({ hand })} />
          <Field label="Pool per day">
            <NumberInput value={j.pool} disabled={readOnly} onChange={(v) => up({ pool: v ?? 0 })} />
          </Field>
          <Field label="Each hit wins (% of what's left)">
            <NumberInput value={j.sharePercent} disabled={readOnly} onChange={(v) => up({ sharePercent: v ?? 0 })} />
          </Field>
        </div>
        <p className="mt-4 text-sm text-ink-400">
          The first hit of the day wins {formatMoney((j.pool * j.sharePercent) / 100)}; each later hit wins {j.sharePercent}% of what's left. The pool
          refills every day (UTC). Players don't place a side bet — the jackpot is funded by the promotion.
        </p>
      </Card>
    );
  }

  return null;
}

function HandPicker({ value, onChange, readOnly }: { value: SpecialHand; onChange: (h: SpecialHand) => void; readOnly: boolean }) {
  return (
    <Field label="Special hand">
      <Select
        value={SPECIAL_HANDS.find((h) => h.hand === value)!.label}
        options={SPECIAL_HANDS.map((h) => h.label)}
        disabled={readOnly}
        onChange={(label) => onChange(SPECIAL_HANDS.find((h) => h.label === label)!.hand)}
      />
    </Field>
  );
}
