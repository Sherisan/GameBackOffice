import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api, ApiError } from '../api/client';
import type { GameBody, GameDetail } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { BlackjackForm, DefuseLadder, LiveCrashForm, RouletteForm, VaultLadder, DiveLadder } from '../components/EngineSettings';
import { EvolutionEditor } from '../components/EvolutionEditor';
import { GeneralForm } from '../components/GeneralForm';
import { HistoryList } from '../components/HistoryList';
import { RngEditor } from '../components/RngEditor';
import { TradingForm } from '../components/TradingForm';
import { Badge, Button, Card, ErrorList, Loading, PageHeader } from '../components/ui';
import { DEFAULT_LIVE, DEFAULT_ROULETTE, toBody } from '../lib/gameBody';

type Tab = 'general' | 'rng' | 'live' | 'roulette' | 'trading' | 'blackjack' | 'defuse' | 'vault' | 'dive' | 'evolution' | 'history';

export function GamePage() {
  const { gameId = '' } = useParams();
  const { canEdit } = useAuth();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [draft, setDraft] = useState<GameBody | null>(null);
  const [tab, setTab] = useState<Tab>('general');
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    setGame(null);
    setTab('general');
    api
      .game(gameId)
      .then((g) => {
        setGame(g);
        setDraft(toBody(g));
      })
      .catch((e) => setLoadErrors(e instanceof ApiError ? e.messages : [String(e)]));
  }, [gameId]);

  const saved = useMemo(() => (game ? toBody(game) : null), [game]);
  const dirty = draft != null && saved != null && JSON.stringify(draft) !== JSON.stringify(saved);

  // Warn before closing / reloading the tab with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (loadErrors.length) return <ErrorList messages={loadErrors} />;
  if (!game || !draft) return <Loading />;

  const readOnly = !canEdit;
  const patch = (p: Partial<GameBody>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'general', label: 'General', show: true },
    { id: 'rng', label: 'RNG & payouts', show: draft.rng != null },
    { id: 'live', label: 'Live rounds', show: game.engine === 'LiveCrash' },
    { id: 'roulette', label: 'Table limits', show: game.engine === 'Roulette' },
    { id: 'trading', label: 'Trading', show: game.engine === 'MarginCall' },
    { id: 'blackjack', label: 'Table rules', show: game.engine === 'Blackjack' },
    { id: 'defuse', label: 'Payout ladder', show: game.engine === 'Defuse' },
    { id: 'vault', label: 'Payout ladder', show: game.engine === 'Vault' },
    { id: 'dive', label: 'Payout ladder', show: game.engine === 'Dive' },
    { id: 'evolution', label: 'Evolution', show: game.hasEvolution },
    { id: 'history', label: 'History', show: true },
  ];

  async function save() {
    if (!draft) return;
    setBusy(true);
    setSaveErrors([]);
    try {
      const { game: next, restartRequired } = await api.updateGame(gameId, draft);
      setGame(next);
      setDraft(toBody(next));
      setHistoryKey((k) => k + 1);
      toast.success(`${next.name} saved — live within about 15 seconds.`);
      if (restartRequired)
        toast.warn(
          next.engine === 'MarginCall'
            ? 'Market and tick changes apply after the next API restart.'
            : 'Live crash timing / enabled changes apply after the next API restart.',
          { autoClose: 8000 },
        );
    } catch (e) {
      setSaveErrors(e instanceof ApiError ? e.messages : [String(e)]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pb-24">
      <div className="mb-3 text-sm">
        <Link to="/games" className="text-ink-400 hover:text-ink-100">
          ← Games
        </Link>
      </div>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {game.name}
            {game.enabled ? <Badge tone="green">Enabled</Badge> : <Badge tone="red">Disabled</Badge>}
            {readOnly && <Badge>Read only</Badge>}
          </span>
        }
        subtitle={
          <span className="font-mono">
            {game.gameId} · {game.engine} engine{game.providerGameId != null && ` · provider #${game.providerGameId}`}
          </span>
        }
      />

      <div className="mb-6 flex gap-1 border-b border-ink-800">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors ${
                tab === t.id ? 'border-accent text-ink-100' : 'border-transparent text-ink-400 hover:text-ink-100'
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === 'general' && <GeneralForm draft={draft} onChange={patch} readOnly={readOnly} hasServerKey={game.hasServerKey} />}
      {tab === 'rng' && draft.rng && (
        <RngEditor rng={draft.rng} savedRtp={game.rng?.rtp} readOnly={readOnly} onChange={(rng) => patch({ rng })} />
      )}
      {tab === 'live' && <LiveCrashForm live={draft.live ?? DEFAULT_LIVE} readOnly={readOnly} onChange={(live) => patch({ live })} />}
      {tab === 'roulette' && (
        <RouletteForm roulette={draft.roulette ?? DEFAULT_ROULETTE} maxBet={draft.maxBet} readOnly={readOnly} onChange={(roulette) => patch({ roulette })} />
      )}
      {tab === 'trading' &&
        (draft.trading ? (
          <TradingForm trading={draft.trading} readOnly={readOnly} onChange={(trading) => patch({ trading })} />
        ) : (
          <Card title="Trading">
            <p className="text-sm text-ink-400">
              This game has no trading settings in the database yet, so the API is using the <span className="font-mono">MarginCall</span> section
              of appsettings. Re-run <span className="font-mono">GameCatalogue.sql</span> and restart the API — it copies them in on startup.
            </p>
          </Card>
        ))}
      {tab === 'blackjack' && (
        <BlackjackForm
          rules={draft.blackjack ?? { decks: 6, dealerHitsSoft17: false, blackjackPays: 1.5, doubleAfterSplit: true, maxHands: 4 }}
          readOnly={readOnly}
          onChange={(blackjack) => patch({ blackjack })}
        />
      )}
      {tab === 'defuse' && <DefuseLadder maxBet={draft.maxBet} maxWin={draft.maxWin} />}
      {tab === 'vault' && <VaultLadder maxBet={draft.maxBet} maxWin={draft.maxWin} />}
      {tab === 'dive' && <DiveLadder maxBet={draft.maxBet} maxWin={draft.maxWin} />}
      {tab === 'evolution' && <EvolutionEditor gameId={gameId} readOnly={readOnly} onSaved={() => setHistoryKey((k) => k + 1)} />}
      {tab === 'history' && <HistoryList gameId={gameId} refreshKey={historyKey} />}

      {/* Save bar for the game sections (the evolution ladder saves on its own). */}
      {!readOnly && (dirty || saveErrors.length > 0) && tab !== 'evolution' && tab !== 'history' && (
        <div className="fixed bottom-0 left-60 right-0 border-t border-ink-700 bg-ink-900/95 px-8 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {saveErrors.length ? <ErrorList messages={saveErrors} /> : <span className="text-sm text-amber-200">You have unsaved changes.</span>}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setDraft(saved);
                  setSaveErrors([]);
                }}
              >
                Discard
              </Button>
              <Button variant="primary" disabled={busy || !dirty} onClick={save}>
                {busy ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
