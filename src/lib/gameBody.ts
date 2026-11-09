import type { GameBody, GameDetail, LiveCrashSettings, RngModel, RngSettings, RouletteSettings } from '../api/types';

/** The PUT body for a game as GET returned it (ServerKey left as-is). */
export function toBody(game: GameDetail): GameBody {
  return {
    name: game.name,
    type: game.type,
    engine: game.engine,
    launchUrl: game.launchUrl,
    providerGameId: game.providerGameId,
    minBet: game.minBet,
    maxBet: game.maxBet,
    maxWin: game.maxWin,
    enabled: game.enabled,
    rng: game.rng,
    live: game.live,
    roulette: game.roulette,
    trading: game.trading,
    blackjack: game.blackjack,
  };
}

/** Starting RNG block for a new game — same defaults as the API's RngSettings. */
export function defaultRng(model: RngModel): RngSettings {
  const base: RngSettings = {
    model,
    outcomes: [],
    options: [],
    houseEdgePercent: 4,
    maxMultiplier: 10000,
    pockets: 37,
    rotateSeedEvery: 1000,
    card: null,
    stakes: [],
  };
  if (model === 'Multiplier')
    base.outcomes = [
      { multiplier: 0, weight: 60 },
      { multiplier: 1, weight: 25 },
      { multiplier: 2, weight: 10 },
      { multiplier: 5, weight: 5 },
    ];
  if (model === 'Pick')
    base.options = [
      { key: 'heads', weight: 1, payout: 1.92 },
      { key: 'tails', weight: 1, payout: 1.92 },
    ];
  return base;
}

export const DEFAULT_LIVE: LiveCrashSettings = {
  bettingMs: 6000,
  crashedMs: 3000,
  tickMs: 100,
  growthRate: 0.06,
  maxBetsPerPlayer: 2,
  minAutoCashOut: 1.01,
  historySize: 30,
};

/** Roulette bet types the API knows (Domain/Roulette/RouletteTable). */
export const ROULETTE_BET_TYPES = ['straight', 'split', 'street', 'trio', 'corner', 'four', 'line', 'column', 'dozen', 'evenMoney'] as const;

export const DEFAULT_ROULETTE: RouletteSettings = { maxBetsPerSpin: 150, limits: {} };
