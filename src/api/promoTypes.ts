// Promotions — mirrors the API's Domain/Promotions (JSON camelCase).

import type { Engine } from './types';

export type PromoType =
  | 'FreeBet'
  | 'Rain'
  | 'RoundDrop'
  | 'MultiplierLeaderboard'
  | 'MultiplierRace'
  | 'CommunityJackpot'
  | 'MysteryPrize'
  | 'BuyXGetFree'
  | 'CollectionMission'
  | 'Cashback'
  | 'StreakMission'
  | 'LuckyNumber'
  | 'BoostedPayout'
  | 'HandBonus'
  | 'HandJackpot';
export type PromoState = 'Off' | 'Scheduled' | 'Live' | 'Ended' | 'BudgetSpent';
export type AwardStatus = 'Pending' | 'Paid' | 'Failed' | 'Available' | 'InPlay' | 'Used' | 'Expired' | 'Cancelled';
export type Prize = 'Cash' | 'FreeBet';
export type SpecialHand = 'Blackjack' | 'SuitedBlackjack' | 'SuitedSevens' | 'ThreeSevens' | 'PerfectPair' | 'FiveCardCharlie';
export type LeaderboardMetric = 'BestMultiple' | 'BestWin' | 'TotalWagered' | 'TotalWon' | 'RoundsPlayed' | 'Hits';

export type PromoFamily = 'Any game' | 'Crash games' | 'Card games' | 'Roulette' | 'Blackjack';

const CRASH: Engine[] = ['Custom', 'LiveCrash', 'MarginCall'];
const ALL: Engine[] = [...CRASH, 'Instant', 'Roulette', 'Blackjack'];

export const PROMO_TYPES: { type: PromoType; label: string; family: PromoFamily; engines: Engine[]; blurb: string }[] = [
  { type: 'FreeBet', label: 'Free bets / cards / chips', family: 'Any game', engines: ALL, blurb: 'Free bets given to players. Roulette chips can be limited to some bet types.' },
  { type: 'Cashback', label: 'Cashback', family: 'Any game', engines: ALL, blurb: 'A share of each player\'s net losses back, per day or week — optionally only on set days.' },
  { type: 'MultiplierLeaderboard', label: 'Leaderboard', family: 'Any game', engines: ALL, blurb: 'Players rank by best multiple, best win, wagering, wins, rounds or special hits.' },
  { type: 'MultiplierRace', label: 'Multiplier race', family: 'Any game', engines: ALL, blurb: 'The first players to win at or above a target multiple get a prize.' },
  { type: 'Rain', label: 'Rain', family: 'Any game', engines: ALL, blurb: 'At random times a pool is split among players who bet recently.' },
  { type: 'StreakMission', label: 'Streak mission', family: 'Any game', engines: ['Instant', 'Roulette', 'Blackjack'], blurb: 'A reward for N plays — or N wins — in a row.' },
  { type: 'RoundDrop', label: 'Round drops', family: 'Crash games', engines: CRASH, blurb: 'Each round has a chance that random players in it win cash or a free bet.' },
  { type: 'CommunityJackpot', label: 'Community jackpot', family: 'Crash games', engines: CRASH, blurb: 'A crash at or above the trigger shares a pool among everyone in that round.' },
  { type: 'MysteryPrize', label: 'Mystery prize', family: 'Card games', engines: ['Instant'], blurb: 'A qualifying card has a chance to reveal a hidden prize.' },
  { type: 'BuyXGetFree', label: 'Buy X, get one free', family: 'Card games', engines: ['Instant'], blurb: 'Every X paid cards earns a free card at that card\'s price.' },
  { type: 'CollectionMission', label: 'Collection mission', family: 'Card games', engines: ['Instant'], blurb: 'Cards carry symbols; collecting the whole set unlocks a reward.' },
  { type: 'LuckyNumber', label: 'Lucky number', family: 'Roulette', engines: ['Roulette'], blurb: 'A prize when the lucky number hits and the player has a straight-up bet on it.' },
  { type: 'BoostedPayout', label: 'Boosted payouts', family: 'Roulette', engines: ['Roulette'], blurb: 'Straight-up wins on chosen numbers pay more — the extra comes from the promotion.' },
  { type: 'HandBonus', label: 'Hand bonus', family: 'Blackjack', engines: ['Blackjack'], blurb: 'A fixed prize for a special hand — suited blackjack, suited 7s, …' },
  { type: 'HandJackpot', label: 'Hand jackpot', family: 'Blackjack', engines: ['Blackjack'], blurb: 'A special hand wins a share of the day\'s jackpot pool.' },
];

export const PROMO_FAMILIES: PromoFamily[] = ['Any game', 'Crash games', 'Card games', 'Roulette', 'Blackjack'];

export const promoLabel = (t: PromoType) => PROMO_TYPES.find((p) => p.type === t)?.label ?? t;
export const enginesFor = (t: PromoType) => PROMO_TYPES.find((p) => p.type === t)?.engines ?? ALL;

export const SPECIAL_HANDS: { hand: SpecialHand; label: string }[] = [
  { hand: 'Blackjack', label: 'Any blackjack' },
  { hand: 'SuitedBlackjack', label: 'Suited blackjack' },
  { hand: 'SuitedSevens', label: 'Suited 7s (first two cards)' },
  { hand: 'ThreeSevens', label: 'Three 7s (first three cards)' },
  { hand: 'PerfectPair', label: 'Perfect pair (same rank and suit)' },
  { hand: 'FiveCardCharlie', label: 'Five-card Charlie' },
];

export const LEADERBOARD_METRICS: { metric: LeaderboardMetric; label: string }[] = [
  { metric: 'BestMultiple', label: 'Best win multiple' },
  { metric: 'BestWin', label: 'Biggest single win' },
  { metric: 'TotalWagered', label: 'Total wagered' },
  { metric: 'TotalWon', label: 'Total won' },
  { metric: 'RoundsPlayed', label: 'Rounds / cards / hands played' },
  { metric: 'Hits', label: 'Special hits (straight-ups, blackjacks, top prizes)' },
];

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface FreeBetSettings {
  stake: number;
  betsPerPlayer: number;
  validDays: number;
  stakeReturned: boolean;
  grant: 'Manual' | 'OnFirstVisit';
  /** Roulette: bet types a free chip may go on. Empty = any. */
  betTypes: string[];
}
export interface RainSettings {
  pool: number;
  recipients: number;
  minIntervalMinutes: number;
  maxIntervalMinutes: number;
  activeWithinMinutes: number;
}
export interface RoundDropSettings {
  chance: number;
  winners: number;
  amount: number;
  prize: Prize;
  freeBetValidDays: number;
}
export interface LeaderboardSettings {
  prizes: number[];
  period: 'Once' | 'Daily' | 'Weekly';
  metric: LeaderboardMetric;
}
export interface RaceSettings {
  targetMultiplier: number;
  winners: number;
  prize: number;
}
export interface JackpotSettings {
  triggerMultiplier: number;
  pool: number;
  splitByStake: boolean;
  maxHitsPerDay: number;
}
export interface MysteryPrizeSettings {
  chance: number;
  amount: number;
  prize: Prize;
  freeBetValidDays: number;
}
export interface BuyXGetFreeSettings {
  buy: number;
  maxFreePerDay: number;
  freeBetValidDays: number;
}
export interface CollectionSettings {
  symbols: string[];
  chancePerCard: number;
  reward: number;
  prize: Prize;
  freeBetValidDays: number;
  maxCompletions: number;
}
export interface CashbackSettings {
  percent: number;
  period: 'Daily' | 'Weekly';
  days: Weekday[];
  maxPerPlayer: number;
  minLoss: number;
  gameWeights: Record<string, number>;
}
export interface StreakSettings {
  counts: 'Plays' | 'Wins';
  target: number;
  maxGapMinutes: number;
  reward: number;
  prize: Prize;
  freeBetValidDays: number;
  maxRewardsPerDay: number;
}
export interface LuckyNumberSettings {
  number: number | null;
  prize: number;
  maxPrizesPerPlayerPerDay: number;
}
export interface BoostedPayoutSettings {
  numbers: number[];
  payout: number;
  maxBoostedStake: number;
}
export interface HandBonusSettings {
  hand: SpecialHand;
  prize: number;
  maxPerPlayerPerDay: number;
}
export interface HandJackpotSettings {
  hand: SpecialHand;
  pool: number;
  sharePercent: number;
}

export interface Promotion {
  promotionId: number;
  name: string;
  type: PromoType;
  enabled: boolean;
  gameIds: string[];
  /** ISO, UTC. */
  startsAt: string | null;
  endsAt: string | null;
  budget: number;
  minStake: number;
  terms: string;
  freeBet: FreeBetSettings | null;
  rain: RainSettings | null;
  drop: RoundDropSettings | null;
  leaderboard: LeaderboardSettings | null;
  race: RaceSettings | null;
  jackpot: JackpotSettings | null;
  mystery: MysteryPrizeSettings | null;
  buyX: BuyXGetFreeSettings | null;
  collection: CollectionSettings | null;
  cashback: CashbackSettings | null;
  streak: StreakSettings | null;
  lucky: LuckyNumberSettings | null;
  boost: BoostedPayoutSettings | null;
  handBonus: HandBonusSettings | null;
  handJackpot: HandJackpotSettings | null;
}

export interface PromotionSummary {
  promotionId: number;
  name: string;
  type: PromoType;
  enabled: boolean;
  gameIds: string[];
  startsAt: string | null;
  endsAt: string | null;
  budget: number;
  spent: number;
  state: PromoState;
}

export interface PromoAward {
  awardId: string;
  promotionId: number;
  gameId: string;
  playerId: string;
  username: string;
  currency: string;
  kind: 'Cash' | 'FreeBet';
  amount: number;
  reason: string;
  status: AwardStatus;
  createdAt: string;
  settledAt: string | null;
  expiresAt: string | null;
  roundId: string | null;
  winAmount: number | null;
  parentAwardId: string | null;
  error: string | null;
  attempts: number;
}

export interface LeaderboardView {
  period: string;
  endsAt: string | null;
  prizes: number[];
  rows: { rank: number; playerId: string; username: string; gameId: string; score: number; stake: number; achievedAt: string; prize: number | null }[];
}

export interface PromoGame {
  gameId: string;
  name: string;
  engine: Engine;
  enabled: boolean;
}

export interface PromotionChange {
  auditId: number;
  promotionId: number;
  oldValue: string | null;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

/** Settings block a new promotion of each type starts with. */
export function defaultsFor(type: PromoType): Partial<Promotion> {
  switch (type) {
    case 'FreeBet':
      return { freeBet: { stake: 10, betsPerPlayer: 1, validDays: 7, stakeReturned: false, grant: 'Manual', betTypes: [] } };
    case 'Rain':
      return { rain: { pool: 100, recipients: 10, minIntervalMinutes: 30, maxIntervalMinutes: 60, activeWithinMinutes: 10 } };
    case 'RoundDrop':
      return { drop: { chance: 0.05, winners: 1, amount: 10, prize: 'Cash', freeBetValidDays: 7 } };
    case 'MultiplierLeaderboard':
      return { leaderboard: { prizes: [100, 50, 25], period: 'Daily', metric: 'BestMultiple' } };
    case 'MultiplierRace':
      return { race: { targetMultiplier: 10, winners: 10, prize: 50 } };
    case 'CommunityJackpot':
      return { jackpot: { triggerMultiplier: 50, pool: 500, splitByStake: false, maxHitsPerDay: 1 } };
    case 'MysteryPrize':
      return { mystery: { chance: 0.02, amount: 20, prize: 'Cash', freeBetValidDays: 7 } };
    case 'BuyXGetFree':
      return { buyX: { buy: 5, maxFreePerDay: 5, freeBetValidDays: 7 } };
    case 'CollectionMission':
      return { collection: { symbols: ['Star', 'Moon', 'Sun', 'Comet'], chancePerCard: 0.5, reward: 25, prize: 'Cash', freeBetValidDays: 7, maxCompletions: 0 } };
    case 'Cashback':
      return { cashback: { percent: 10, period: 'Daily', days: [], maxPerPlayer: 100, minLoss: 10, gameWeights: {} } };
    case 'StreakMission':
      return { streak: { counts: 'Plays', target: 10, maxGapMinutes: 10, reward: 10, prize: 'Cash', freeBetValidDays: 7, maxRewardsPerDay: 3 } };
    case 'LuckyNumber':
      return { lucky: { number: null, prize: 50, maxPrizesPerPlayerPerDay: 1 } };
    case 'BoostedPayout':
      return { boost: { numbers: [7, 17, 27], payout: 50, maxBoostedStake: 10 } };
    case 'HandBonus':
      return { handBonus: { hand: 'SuitedBlackjack', prize: 25, maxPerPlayerPerDay: 5 } };
    case 'HandJackpot':
      return { handJackpot: { hand: 'SuitedSevens', pool: 1000, sharePercent: 25 } };
  }
}

export function newPromotion(type: PromoType): Promotion {
  return {
    promotionId: 0,
    name: '',
    type,
    enabled: false,
    gameIds: [],
    startsAt: null,
    endsAt: null,
    budget: 1000,
    minStake: 1,
    terms: '',
    freeBet: null,
    rain: null,
    drop: null,
    leaderboard: null,
    race: null,
    jackpot: null,
    mystery: null,
    buyX: null,
    collection: null,
    cashback: null,
    streak: null,
    lucky: null,
    boost: null,
    handBonus: null,
    handJackpot: null,
    ...defaultsFor(type),
  };
}
