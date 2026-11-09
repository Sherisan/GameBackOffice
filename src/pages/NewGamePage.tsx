import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api, ApiError } from '../api/client';
import type { Engine, GameBody, RngModel } from '../api/types';
import { ENGINES } from '../api/types';
import { BlackjackForm, LiveCrashForm, RouletteForm } from '../components/EngineSettings';
import { GeneralForm } from '../components/GeneralForm';
import { RngEditor } from '../components/RngEditor';
import { Button, Card, ErrorList, Field, PageHeader, Select, TextInput } from '../components/ui';
import { DEFAULT_LIVE, DEFAULT_ROULETTE, defaultRng } from '../lib/gameBody';

/** RNG models each engine accepts (GameDefinition.Validate). 'None' = no RNG block. */
const MODELS: Record<Engine, (RngModel | 'None')[]> = {
  Instant: ['Multiplier', 'Pick', 'Target'],
  LiveCrash: ['Target'],
  MarginCall: ['None', 'Target'],
  Roulette: ['Wheel'],
  Blackjack: ['None'],
  Defuse: ['None'],
  Vault: ['None'],
  Dive: ['None'],
  Custom: ['None'],
};

const ENGINE_HELP: Record<Engine, string> = {
  Instant: 'One request per play through api/play — slots, scratch cards, predictions, instant crash.',
  LiveCrash: 'Shared live rounds on /livecrashhub. Starts after the next API restart.',
  MarginCall:
    'The trading crash game (TradeX). The API runs one Margin Call engine, for the game set in its MarginCall:GameId setting — a new one only plays once the API points at it.',
  Roulette: 'European roulette through api/roulette.',
  Blackjack: 'One player against the dealer through api/blackjack. Shuffles its own provably-fair shoe each round.',
  Defuse:
    'DEFUSE through api/defuse: cut wires, cash out before the detonator. Fixed 97% payout ladder (×1.16 – ×5.82); MaxWin must cover MaxBet × 5.82.',
  Vault:
    'VAULT CRACKER through api/vault: crack a 5-digit combination, 1-in-4 alarm per digit. Fixed 97% payout ladder (×1.29 – ×4.08); MaxWin must cover MaxBet × 4.08.',
  Dive:
    'DEEP DIVE through api/dive: eight depth zones, a shark in one cave of three. Fixed 97% payout ladder (×1.45 – ×24.86); MaxWin must cover MaxBet × 24.86.',
  Custom: 'Has its own engine (e.g. Feeding Frenzy) or its own backend that uses the wallet endpoints.',
};

function emptyGame(engine: Engine, model: RngModel | 'None'): GameBody {
  return {
    gameId: '',
    name: '',
    type: engine === 'Roulette' || engine === 'Blackjack' ? 'Table' : engine === 'Defuse' || engine === 'Vault' || engine === 'Dive' ? 'Scratch' : engine === 'Instant' && model === 'Pick' ? 'Prediction' : engine === 'Instant' && model === 'Multiplier' ? 'Slot' : 'Crash',
    engine,
    launchUrl: '',
    providerGameId: null,
    minBet: 1,
    maxBet: 1000,
    maxWin: 100000,
    enabled: false,
    rng: model === 'None' ? null : defaultRng(model),
    live: engine === 'LiveCrash' ? DEFAULT_LIVE : null,
    roulette: engine === 'Roulette' ? DEFAULT_ROULETTE : null,
    trading: null,
    blackjack: engine === 'Blackjack' ? { decks: 6, dealerHitsSoft17: false, blackjackPays: 1.5, doubleAfterSplit: true, maxHands: 4 } : null,
  };
}

export function NewGamePage() {
  const navigate = useNavigate();
  const [engine, setEngine] = useState<Engine>('Instant');
  const [model, setModel] = useState<RngModel | 'None'>('Multiplier');
  const [draft, setDraft] = useState<GameBody>(() => emptyGame('Instant', 'Multiplier'));
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const patch = (p: Partial<GameBody>) => setDraft((d) => ({ ...d, ...p }));

  function choose(nextEngine: Engine, nextModel?: RngModel | 'None') {
    const m = nextModel && MODELS[nextEngine].includes(nextModel) ? nextModel : MODELS[nextEngine][0];
    setEngine(nextEngine);
    setModel(m);
    // Keep what was typed in the shared fields; swap the engine-specific blocks.
    setDraft((d) => ({ ...emptyGame(nextEngine, m), gameId: d.gameId, name: d.name, launchUrl: d.launchUrl, providerGameId: d.providerGameId }));
  }

  async function create() {
    setBusy(true);
    setErrors([]);
    try {
      const { game, restartRequired } = await api.createGame(draft);
      toast.success(`${game.name} created${game.enabled ? '' : ' (disabled — enable it when ready)'}.`);
      if (restartRequired) toast.warn('Live crash games start after the next API restart.', { autoClose: 8000 });
      navigate(`/games/${game.gameId}`);
    } catch (e) {
      setErrors(e instanceof ApiError ? e.messages : [String(e)]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="text-sm">
        <Link to="/games" className="text-ink-400 hover:text-ink-100">
          ← Games
        </Link>
      </div>
      <PageHeader
        title="New game"
        subtitle="New games start disabled so you can check them before players see them."
        actions={
          <Button variant="primary" disabled={busy || !draft.gameId || !draft.name} onClick={create}>
            {busy ? 'Creating…' : 'Create game'}
          </Button>
        }
      />
      <ErrorList messages={errors} />

      <Card title="Engine">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Game ID" hint="Lower-case letters, digits and hyphens. Can't be changed later.">
            <TextInput
              className="font-mono"
              placeholder="lucky-wheel"
              value={draft.gameId}
              onChange={(e) => patch({ gameId: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            />
          </Field>
          <Field label="Engine" hint="Can't be changed later.">
            <Select value={engine} options={ENGINES} onChange={(e) => choose(e, model)} />
          </Field>
          <Field label="RNG model">
            <Select value={model} options={MODELS[engine]} disabled={MODELS[engine].length < 2} onChange={(m) => choose(engine, m)} />
          </Field>
        </div>
        <p className="mt-3 text-sm text-ink-400">{ENGINE_HELP[engine]}</p>
      </Card>

      <GeneralForm draft={draft} onChange={patch} readOnly={false} hasServerKey={false} />
      {draft.rng && <RngEditor rng={draft.rng} readOnly={false} onChange={(rng) => patch({ rng })} />}
      {draft.live && <LiveCrashForm live={draft.live} readOnly={false} onChange={(live) => patch({ live })} />}
      {draft.roulette && <RouletteForm roulette={draft.roulette} maxBet={draft.maxBet} readOnly={false} onChange={(roulette) => patch({ roulette })} />}
      {draft.blackjack && <BlackjackForm rules={draft.blackjack} readOnly={false} onChange={(blackjack) => patch({ blackjack })} />}
    </div>
  );
}
