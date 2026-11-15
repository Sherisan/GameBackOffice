// Shapes returned by the Game API's back-office endpoints (api/backoffice/*).

export type Role = 'Viewer' | 'Editor' | 'Admin';
export const ROLES: Role[] = ['Viewer', 'Editor', 'Admin'];

export interface User {
  userId: number;
  username: string;
  displayName: string;
  role: Role;
  enabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export type Engine =
  | 'Instant' | 'LiveCrash' | 'MarginCall' | 'Roulette' | 'Custom' | 'Blackjack' | 'Defuse' | 'Vault' | 'Dive'
  // Engines whose games are set up in the API's config (not created here): JUICE RUSH, HIVE MIND, the ladder games, FORTUNE ISLE.
  | 'Fruit' | 'Hive' | 'Ladder' | 'Island';
/** Engines a game can be created with here (New game). */
export type CreatableEngine = Exclude<Engine, 'Fruit' | 'Hive' | 'Ladder' | 'Island'>;
export const ENGINES: CreatableEngine[] = ['Instant', 'LiveCrash', 'MarginCall', 'Roulette', 'Blackjack', 'Defuse', 'Vault', 'Dive', 'Custom'];

/** Blackjack table rules (Engine Blackjack). */
export interface BlackjackSettings {
  decks: number;
  dealerHitsSoft17: boolean;
  /** 1.5 = 3 to 2, 1.2 = 6 to 5. */
  blackjackPays: number;
  doubleAfterSplit: boolean;
  maxHands: number;
}

export type GameType = 'Crash' | 'Slot' | 'Prediction' | 'Scratch' | 'Table';
export const GAME_TYPES: GameType[] = ['Crash', 'Slot', 'Prediction', 'Scratch', 'Table'];

export type RngModel = 'Multiplier' | 'Pick' | 'Target' | 'Wheel';

export interface RngOutcome {
  multiplier: number;
  weight: number;
}

export interface RngOption {
  key: string;
  weight: number;
  /** Total return on a winning pick, stake included. */
  payout: number;
}

export interface RngSettings {
  model: RngModel;
  outcomes: RngOutcome[];
  options: RngOption[];
  houseEdgePercent: number;
  maxMultiplier: number;
  pockets: number;
  rotateSeedEvery: number;
  card: string | null;
  stakes: number[];
  /** Server-computed; ignored when sent back. */
  rtp?: number;
}

export interface LiveCrashSettings {
  bettingMs: number;
  crashedMs: number;
  tickMs: number;
  growthRate: number;
  maxBetsPerPlayer: number;
  minAutoCashOut: number;
  historySize: number;
}

export interface RouletteSettings {
  maxBetsPerSpin: number;
  limits: Record<string, number>;
}

export interface MarketConfig {
  symbol: string;
  basePrice: number;
  /** Per-tick standard deviation as a fraction of price (0.0045 = 0.45%). */
  volatility: number;
}

/** TradeX (Engine MarginCall): house edge, multipliers, round timing and markets. */
export interface TradingSettings {
  commissionPercent: number;
  spreadBps: number;
  multipliers: number[];
  maxPositionsPerRound: number;
  tickMs: number;
  growthRate: number;
  waitingMs: number;
  closedMs: number;
  minOpenMs: number;
  maxTradingMs: number;
  crashedMs: number;
  settlingMs: number;
  resultsMs: number;
  markets: MarketConfig[];
}

export interface GameSummary {
  gameId: string;
  providerGameId: number | null;
  name: string;
  type: GameType;
  engine: Engine;
  enabled: boolean;
  minBet: number;
  maxBet: number;
  maxWin: number;
  model: RngModel | null;
  rtp: number | null;
  hasEvolution: boolean;
}

export interface GameDetail {
  gameId: string;
  providerGameId: number | null;
  name: string;
  type: GameType;
  engine: Engine;
  launchUrl: string;
  hasServerKey: boolean;
  minBet: number;
  maxBet: number;
  maxWin: number;
  enabled: boolean;
  rng: RngSettings | null;
  live: LiveCrashSettings | null;
  roulette: RouletteSettings | null;
  trading: TradingSettings | null;
  blackjack: BlackjackSettings | null;
  hasEvolution: boolean;
}

/** What PUT / POST api/backoffice/games take. serverKey: undefined = keep, '' = remove, value = replace. */
export interface GameBody {
  gameId?: string;
  name: string;
  type: GameType;
  engine?: Engine;
  launchUrl: string;
  providerGameId: number | null;
  minBet: number;
  maxBet: number;
  maxWin: number;
  enabled: boolean;
  rng: RngSettings | null;
  live: LiveCrashSettings | null;
  roulette: RouletteSettings | null;
  trading: TradingSettings | null;
  blackjack: BlackjackSettings | null;
  serverKey?: string;
}

export interface EvolutionTier {
  level: number;
  code: string;
  name: string;
  multiplier: number;
}

export interface ConfigChange {
  auditId: number;
  gameId: string;
  section: 'Game' | 'Evolution';
  /** JSON, null for the first entry. */
  oldValue: string | null;
  newValue: string;
  changedBy: string;
  changedAt: string;
}
