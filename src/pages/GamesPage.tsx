import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api, ApiError } from '../api/client';
import type { GameSummary } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Badge, Button, ErrorList, Loading, PageHeader, TextInput, Toggle } from '../components/ui';
import { formatMoney, formatPercent } from '../lib/rtp';
import { toBody } from '../lib/gameBody';

export function GamesPage() {
  const { canEdit } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameSummary[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api.games().then(setGames).catch((e) => setErrors(e instanceof ApiError ? e.messages : [String(e)]));
  }, []);

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return (games ?? []).filter((g) => !q || g.name.toLowerCase().includes(q) || g.gameId.includes(q) || g.engine.toLowerCase().includes(q));
  }, [games, filter]);

  async function setEnabled(game: GameSummary, enabled: boolean) {
    setBusyId(game.gameId);
    try {
      const detail = await api.game(game.gameId);
      const { game: saved, restartRequired } = await api.updateGame(game.gameId, { ...toBody(detail), enabled });
      setGames((all) => all?.map((g) => (g.gameId === saved.gameId ? { ...g, enabled: saved.enabled } : g)) ?? null);
      toast.success(`${saved.name} ${enabled ? 'enabled' : 'disabled'}`);
      if (restartRequired) toast.warn('Live crash games start or stop on the next API restart.');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Games"
        subtitle="Every game on the platform. Changes go live within about 15 seconds."
        actions={
          <>
            <TextInput placeholder="Search games…" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-56" />
            {canEdit && (
              <Button variant="primary" onClick={() => navigate('/games/new')}>
                + New game
              </Button>
            )}
          </>
        }
      />
      <ErrorList messages={errors} />
      {!games && errors.length === 0 && <Loading />}

      {games && (
        <div className="overflow-hidden rounded-lg border border-ink-800">
          <table className="w-full text-sm">
            <thead className="bg-ink-900 text-left text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Game</th>
                <th className="px-4 py-3 font-medium">Engine</th>
                <th className="px-4 py-3 text-right font-medium">Min bet</th>
                <th className="px-4 py-3 text-right font-medium">Max bet</th>
                <th className="px-4 py-3 text-right font-medium">Max win</th>
                <th className="px-4 py-3 text-right font-medium">RTP</th>
                <th className="px-4 py-3 font-medium">Enabled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {shown.map((g) => (
                <tr key={g.gameId} className="bg-ink-950 hover:bg-ink-900">
                  <td className="px-4 py-3">
                    <Link to={`/games/${g.gameId}`} className="font-medium text-ink-100 hover:text-accent">
                      {g.name}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-ink-400">
                      {g.gameId}
                      {g.providerGameId != null && <span>· #{g.providerGameId}</span>}
                      {g.hasEvolution && <Badge tone="violet">evolution</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-ink-300">{g.engine}</div>
                    <div className="text-xs text-ink-400">
                      {g.type}
                      {g.model && ` · ${g.model}`}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatMoney(g.minBet)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatMoney(g.maxBet)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatMoney(g.maxWin)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatPercent(g.rtp)}</td>
                  <td className="px-4 py-3">
                    <Toggle
                      label={`${g.name} enabled`}
                      checked={g.enabled}
                      disabled={!canEdit || busyId === g.gameId}
                      onChange={(v) => setEnabled(g, v)}
                    />
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink-400">
                    No games match “{filter}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
