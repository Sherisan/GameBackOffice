import { useEffect, useState } from 'react';
import type { MarketConfig, TradingSettings } from '../api/types';
import { Button, Card, Field, NumberInput, TextInput } from './ui';

/**
 * TradeX (Engine MarginCall). House edge, multipliers, position cap and round timing apply from the next trade /
 * round; open trades keep the commission and spread they opened with. Markets and tick speed need an API restart.
 */
export function TradingForm({ trading, onChange, readOnly }: { trading: TradingSettings; onChange: (t: TradingSettings) => void; readOnly: boolean }) {
  const set = (patch: Partial<TradingSettings>) => onChange({ ...trading, ...patch });
  const setMarket = (index: number, patch: Partial<MarketConfig>) =>
    set({ markets: trading.markets.map((m, i) => (i === index ? { ...m, ...patch } : m)) });
  const multipliers = trading.multipliers.length > 0 ? [...new Set(trading.multipliers)].sort((a, b) => a - b) : [1, 2, 5, 10];
  // Seconds of trading to reach a round multiplier: ln(m) / rate.
  const secondsTo = (m: number) => (trading.growthRate > 0 ? Math.log(m) / trading.growthRate : NaN);

  return (
    <div className="space-y-6">
      <Card title="House edge">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Commission (%)" hint="Kept from every stake at settlement.">
            <NumberInput value={trading.commissionPercent} disabled={readOnly} onChange={(v) => set({ commissionPercent: v ?? 0 })} />
          </Field>
          <Field label="Spread (bps)" hint="BUY opens at ask, closes at bid. 10 bps = 0.1%.">
            <NumberInput value={trading.spreadBps} disabled={readOnly} onChange={(v) => set({ spreadBps: v ?? 0 })} />
          </Field>
          <Field label="Max positions per round" hint="Per player, 1-100.">
            <NumberInput value={trading.maxPositionsPerRound} disabled={readOnly} onChange={(v) => set({ maxPositionsPerRound: Math.round(v ?? 0) })} />
          </Field>
          <Field label="Risk multipliers" hint="Comma separated, 1-100. Empty = 1, 2, 5, 10." className="sm:col-span-3">
            <MultipliersInput value={trading.multipliers} disabled={readOnly} onChange={(multipliers) => set({ multipliers })} />
          </Field>
        </div>

        {/* Prices are a zero-drift walk, so the edge is the commission plus the spread paid in and out, scaled by the multiplier. */}
        <div className="mt-5 text-xs font-medium uppercase tracking-wide text-ink-400">Approximate RTP</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {multipliers.map((m) => {
            const rtp = 100 - trading.commissionPercent - (m * trading.spreadBps) / 100;
            return (
              <span key={m} className="rounded-md border border-ink-700 bg-ink-950 px-3 py-1.5 text-sm">
                <span className="text-ink-400">×{m}</span>{' '}
                <span className={`font-mono ${rtp >= 100 ? 'text-red-300' : 'text-ink-100'}`}>{rtp.toFixed(2)}%</span>
              </span>
            );
          })}
        </div>
        {trading.commissionPercent === 0 && trading.spreadBps === 0 && (
          <p className="mt-3 text-sm text-red-300">No commission and no spread: the house has no edge (RTP 100%).</p>
        )}
        <p className="mt-3 text-xs text-ink-400">
          Applies to the next trade — open trades keep the commission and spread they opened with. Players who already have TradeX open see the
          new commission, spread and multipliers after they reload.
        </p>
      </Card>

      <Card title="Round timing">
        <p className="mb-4 text-sm text-ink-400">Applies from the next round.</p>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Growth rate (per second)" hint={`2× at ${secondsTo(2).toFixed(1)}s · 5× at ${secondsTo(5).toFixed(1)}s`} className="sm:col-span-2">
            <NumberInput value={trading.growthRate} disabled={readOnly} onChange={(v) => set({ growthRate: v ?? 0 })} />
          </Field>
          <Field label="Waiting (ms)" hint="Countdown before trading.">
            <NumberInput value={trading.waitingMs} disabled={readOnly} onChange={(v) => set({ waitingMs: Math.round(v ?? 0) })} />
          </Field>
          <Field label="Min open (ms)" hint="Shortest trading window.">
            <NumberInput value={trading.minOpenMs} disabled={readOnly} onChange={(v) => set({ minOpenMs: Math.round(v ?? 0) })} />
          </Field>
          <Field label="Closed (ms)" hint="No new trades before the crash.">
            <NumberInput value={trading.closedMs} disabled={readOnly} onChange={(v) => set({ closedMs: Math.round(v ?? 0) })} />
          </Field>
          <Field label="Max trading (ms)" hint="Longest round.">
            <NumberInput value={trading.maxTradingMs} disabled={readOnly} onChange={(v) => set({ maxTradingMs: Math.round(v ?? 0) })} />
          </Field>
          <Field label="Crashed (ms)">
            <NumberInput value={trading.crashedMs} disabled={readOnly} onChange={(v) => set({ crashedMs: Math.round(v ?? 0) })} />
          </Field>
          <Field label="Settling (ms)">
            <NumberInput value={trading.settlingMs} disabled={readOnly} onChange={(v) => set({ settlingMs: Math.round(v ?? 0) })} />
          </Field>
          <Field label="Results (ms)" hint="Results screen.">
            <NumberInput value={trading.resultsMs} disabled={readOnly} onChange={(v) => set({ resultsMs: Math.round(v ?? 0) })} />
          </Field>
        </div>
      </Card>

      <Card
        title="Markets"
        actions={
          !readOnly && (
            <Button onClick={() => set({ markets: [...trading.markets, { symbol: '', basePrice: 1, volatility: 0.005 }] })}>Add market</Button>
          )
        }
      >
        <p className="mb-4 text-sm text-amber-200/80">Markets and tick speed are read when the API starts — changes here apply after the next API restart.</p>
        <div className="mb-5 max-w-xs">
          <Field label="Tick (ms)" hint="Price update interval, 20-1000.">
            <NumberInput value={trading.tickMs} disabled={readOnly} onChange={(v) => set({ tickMs: Math.round(v ?? 0) })} />
          </Field>
        </div>
        <div className="overflow-hidden rounded-md border border-ink-800">
          <table className="w-full text-sm">
            <thead className="bg-ink-850 text-left text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-3 py-2 font-medium">Symbol</th>
                <th className="px-3 py-2 font-medium">Base price</th>
                <th className="px-3 py-2 font-medium">Volatility per tick</th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {trading.markets.map((m, i) => (
                <tr key={i} className="bg-ink-950">
                  <td className="px-3 py-1.5">
                    <TextInput
                      value={m.symbol}
                      disabled={readOnly}
                      onChange={(e) => setMarket(i, { symbol: e.target.value.toUpperCase() })}
                      className="max-w-[9rem] font-mono"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <NumberInput value={m.basePrice} disabled={readOnly} onChange={(v) => setMarket(i, { basePrice: v ?? 0 })} className="max-w-[10rem]" />
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <NumberInput value={m.volatility} disabled={readOnly} onChange={(v) => setMarket(i, { volatility: v ?? 0 })} className="max-w-[8rem]" />
                      <span className="whitespace-nowrap text-xs text-ink-400">{(m.volatility * 100).toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {!readOnly && (
                      <button
                        type="button"
                        aria-label={`Remove ${m.symbol || 'market'}`}
                        className="text-ink-400 hover:text-red-300"
                        onClick={() => set({ markets: trading.markets.filter((_, j) => j !== i) })}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

const parseList = (s: string) =>
  s
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map(Number);

/** "1, 2, 5, 10" ⇄ [1, 2, 5, 10]. Keeps the user's text while it doesn't parse yet. */
function MultipliersInput({ value, onChange, disabled }: { value: number[]; onChange: (v: number[]) => void; disabled?: boolean }) {
  const [text, setText] = useState(value.join(', '));
  // Follow outside changes (reset, reload) without fighting the user's typing.
  useEffect(() => {
    if (JSON.stringify(parseList(text)) !== JSON.stringify(value)) setText(value.join(', '));
  }, [value]);

  return (
    <TextInput
      value={text}
      disabled={disabled}
      inputMode="numeric"
      className="max-w-sm font-mono"
      onChange={(e) => {
        setText(e.target.value);
        const parts = parseList(e.target.value);
        if (parts.every((n) => Number.isInteger(n))) onChange(parts);
      }}
    />
  );
}
