import type { RngSettings } from '../api/types';

// Mirrors RngSettings.Rtp on the server so edits show their effect before saving.

export function totalWeight(weights: number[]): number {
  return weights.reduce((sum, w) => sum + (Number.isFinite(w) ? w : 0), 0);
}

/** Theoretical return to player (0-1). For Pick it's the best option's. */
export function rtpOf(rng: RngSettings): number {
  switch (rng.model) {
    case 'Multiplier': {
      const total = totalWeight(rng.outcomes.map((o) => o.weight));
      return total === 0 ? 0 : rng.outcomes.reduce((s, o) => s + o.weight * o.multiplier, 0) / total;
    }
    case 'Pick': {
      const total = totalWeight(rng.options.map((o) => o.weight));
      return total === 0 || rng.options.length === 0 ? 0 : Math.max(...rng.options.map((o) => o.weight * o.payout)) / total;
    }
    case 'Wheel':
      return 36 / Math.max(1, rng.pockets);
    default:
      return 1 - rng.houseEdgePercent / 100;
  }
}

export function formatPercent(value: number | null | undefined, digits = 2): string {
  return value == null || !Number.isFinite(value) ? '—' : `${(value * 100).toFixed(digits)}%`;
}

export function formatMoney(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "1 in 1,234" for small chances, otherwise a percentage. */
export function formatChance(p: number): string {
  if (!Number.isFinite(p) || p <= 0) return '—';
  if (p < 0.001) return `1 in ${Math.round(1 / p).toLocaleString()}`;
  return `${(p * 100).toFixed(p < 0.01 ? 3 : 2)}%`;
}
