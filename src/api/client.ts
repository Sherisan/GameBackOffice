import type {
  ConfigChange,
  EvolutionTier,
  GameBody,
  GameDetail,
  GameSummary,
  Role,
  User,
} from './types';
import type {
  AwardStatus,
  LeaderboardView,
  PromoAward,
  PromoGame,
  Promotion,
  PromotionChange,
  PromotionSummary,
  PromoState,
} from './promoTypes';

const P = '/api/backoffice/promotions';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';
const TOKEN_KEY = 'gbo.token';

/** Error from the API, with every message it returned (validation returns several). */
export class ApiError extends Error {
  constructor(public status: number, public messages: string[]) {
    super(messages.join(' '));
  }
}

// The token lives in sessionStorage: it survives a reload but not closing the tab.
export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized: () => void = () => {};
/** Called when the API rejects the token (expired, account disabled, password changed elsewhere). */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && token && !path.endsWith('/auth/login')) {
    tokenStore.clear();
    onUnauthorized();
    throw new ApiError(401, ['Your session has ended. Please sign in again.']);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) throw new ApiError(res.status, errorMessages(res.status, data));
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessages(status: number, data: unknown): string[] {
  if (data && typeof data === 'object') {
    const d = data as { errors?: unknown; error?: unknown; title?: unknown };
    if (Array.isArray(d.errors)) return d.errors.map(String);
    // ASP.NET model-binding errors: { errors: { field: [messages] } }
    if (d.errors && typeof d.errors === 'object') return Object.values(d.errors as Record<string, string[]>).flat();
    if (typeof d.error === 'string') return [d.error];
    if (typeof d.title === 'string') return [d.title];
  }
  if (typeof data === 'string' && data) return [data];
  if (status === 403) return ["Your role doesn't allow this."];
  return [`Request failed (${status}).`];
}

export const api = {
  // ── Auth ─────────────────────────────────────────
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>('POST', '/api/backoffice/auth/login', { username, password }),
  me: () => request<User>('GET', '/api/backoffice/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ token: string; user: User }>('POST', '/api/backoffice/auth/change-password', { currentPassword, newPassword }),

  // ── Games ────────────────────────────────────────
  games: () => request<GameSummary[]>('GET', '/api/backoffice/games'),
  game: (gameId: string) => request<GameDetail>('GET', `/api/backoffice/games/${encodeURIComponent(gameId)}`),
  updateGame: (gameId: string, body: GameBody) =>
    request<{ game: GameDetail; restartRequired: boolean }>('PUT', `/api/backoffice/games/${encodeURIComponent(gameId)}`, body),
  createGame: (body: GameBody) =>
    request<{ game: GameDetail; restartRequired: boolean }>('POST', '/api/backoffice/games', body),

  evolution: (gameId: string) =>
    request<{ gameId: string; tiers: EvolutionTier[] }>('GET', `/api/backoffice/games/${encodeURIComponent(gameId)}/evolution`),
  updateEvolution: (gameId: string, tiers: EvolutionTier[]) =>
    request<{ gameId: string; tiers: EvolutionTier[] }>('PUT', `/api/backoffice/games/${encodeURIComponent(gameId)}/evolution`, { tiers }),

  history: (gameId: string, section?: 'Game' | 'Evolution') =>
    request<ConfigChange[]>('GET', `/api/backoffice/games/${encodeURIComponent(gameId)}/history?count=100${section ? `&section=${section}` : ''}`),

  // ── Users (Admin) ────────────────────────────────
  users: () => request<User[]>('GET', '/api/backoffice/users'),
  createUser: (body: { username: string; displayName: string; password: string; role: Role }) =>
    request<User>('POST', '/api/backoffice/users', body),
  updateUser: (userId: number, body: { displayName?: string; role?: Role; enabled?: boolean }) =>
    request<User>('PUT', `/api/backoffice/users/${userId}`, body),
  resetPassword: (userId: number, password: string) =>
    request<User>('POST', `/api/backoffice/users/${userId}/reset-password`, { password }),

  // ── Promotions ───────────────────────────────────
  promotions: () => request<PromotionSummary[]>('GET', P),
  promotion: (id: number) =>
    request<{ promotion: Promotion; state: PromoState; spent: number; awards: number }>('GET', `${P}/${id}`),
  promoGames: () => request<PromoGame[]>('GET', `${P}/games`),
  createPromotion: (body: Promotion) => request<{ promotion: Promotion }>('POST', P, body),
  updatePromotion: (id: number, body: Promotion) => request<{ promotion: Promotion }>('PUT', `${P}/${id}`, body),
  setPromotionEnabled: (id: number, enabled: boolean) => request<{ promotion: Promotion }>('POST', `${P}/${id}/enabled`, { enabled }),
  promoAwards: (id: number, filter: { status?: AwardStatus; playerId?: string } = {}) =>
    request<PromoAward[]>(
      'GET',
      `${P}/${id}/awards?count=500${filter.status ? `&status=${filter.status}` : ''}${filter.playerId ? `&playerId=${encodeURIComponent(filter.playerId)}` : ''}`,
    ),
  promoLeaderboard: (id: number, period?: string) =>
    request<LeaderboardView>('GET', `${P}/${id}/leaderboard${period ? `?period=${encodeURIComponent(period)}` : ''}`),
  promoHistory: (id: number) => request<PromotionChange[]>('GET', `${P}/${id}/history?count=100`),
  grantFreeBets: (id: number, playerIds: string[]) =>
    request<{ granted: number; outOfBudget: number }>('POST', `${P}/${id}/grant`, { playerIds }),
  rainNow: (id: number) => request<{ reached: number }>('POST', `${P}/${id}/rain-now`),
  cancelAward: (awardId: string) => request<{ award: PromoAward }>('POST', `${P}/awards/${awardId}/cancel`),
};
