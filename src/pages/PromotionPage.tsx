import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api, ApiError } from '../api/client';
import {
  LEADERBOARD_METRICS,
  newPromotion,
  PROMO_TYPES,
  promoLabel,
  type AwardStatus,
  type LeaderboardMetric,
  type LeaderboardView,
  type PromoAward,
  type PromoGame,
  type Promotion,
  type PromotionChange,
  type PromoState,
  type PromoType,
} from '../api/promoTypes';
import { useAuth } from '../auth/AuthContext';
import { PromotionForm } from '../components/PromotionForm';
import { Badge, Button, Card, ErrorList, Loading, PageHeader, Select, TextInput } from '../components/ui';
import { formatMoney } from '../lib/rtp';
import { formatWhen, STATE_LABEL, STATE_TONE } from './PromotionsPage';

type Tab = 'settings' | 'awards' | 'grant' | 'leaderboard' | 'history';

export function PromotionPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const isNew = id === 'new';
  const promotionId = isNew ? 0 : Number(id);

  const [games, setGames] = useState<PromoGame[]>([]);
  const [saved, setSaved] = useState<Promotion | null>(null);
  const [draft, setDraft] = useState<Promotion | null>(null);
  const [state, setState] = useState<PromoState | null>(null);
  const [spent, setSpent] = useState(0);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('settings');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.promoGames().then(setGames).catch(() => {});
    if (isNew) {
      const type = (search.get('type') as PromoType) ?? 'FreeBet';
      const fresh = newPromotion(PROMO_TYPES.some((t) => t.type === type) ? type : 'FreeBet');
      setSaved(fresh);
      setDraft(fresh);
      return;
    }
    api
      .promotion(promotionId)
      .then((r) => {
        setSaved(r.promotion);
        setDraft(r.promotion);
        setState(r.state);
        setSpent(r.spent);
      })
      .catch((e) => setLoadErrors(e instanceof ApiError ? e.messages : [String(e)]));
  }, [id, refreshKey]);

  const dirty = useMemo(() => isNew || JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved, isNew]);

  if (loadErrors.length) return <ErrorList messages={loadErrors} />;
  if (!draft || !saved) return <Loading />;

  const readOnly = !canEdit;

  async function save() {
    if (!draft) return;
    setBusy(true);
    setSaveErrors([]);
    try {
      if (isNew) {
        const { promotion } = await api.createPromotion(draft);
        toast.success(`${promotion.name} created`);
        navigate(`/promotions/${promotion.promotionId}`, { replace: true });
      } else {
        await api.updatePromotion(promotionId, draft);
        toast.success(`${draft.name} saved — live straight away.`);
        setRefreshKey((k) => k + 1);
      }
    } catch (e) {
      setSaveErrors(e instanceof ApiError ? e.messages : [String(e)]);
    } finally {
      setBusy(false);
    }
  }

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'settings', label: 'Settings', show: true },
    { id: 'awards', label: 'Awards', show: !isNew },
    { id: 'grant', label: 'Free bets', show: !isNew && saved.type === 'FreeBet' },
    { id: 'leaderboard', label: 'Leaderboard', show: !isNew && saved.type === 'MultiplierLeaderboard' },
    { id: 'history', label: 'History', show: !isNew },
  ];

  return (
    <div className="pb-24">
      <div className="mb-3 text-sm">
        <Link to="/promotions" className="text-ink-400 hover:text-ink-100">
          ← Promotions
        </Link>
      </div>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {isNew ? `New ${promoLabel(draft.type).toLowerCase()}` : saved.name}
            {state && <Badge tone={STATE_TONE[state]}>{STATE_LABEL[state]}</Badge>}
            {readOnly && <Badge>Read only</Badge>}
          </span>
        }
        subtitle={
          isNew
            ? PROMO_TYPES.find((t) => t.type === draft.type)?.blurb
            : `${promoLabel(saved.type)} · ${formatMoney(spent)} of ${formatMoney(saved.budget)} budget used`
        }
        actions={
          !isNew &&
          canEdit &&
          saved.type === 'Rain' &&
          state === 'Live' && (
            <Button
              onClick={async () => {
                try {
                  const { reached } = await api.rainNow(promotionId);
                  toast[reached > 0 ? 'success' : 'info'](reached > 0 ? `It rained on ${reached} player${reached === 1 ? '' : 's'}.` : 'Nobody is active right now — no rain.');
                  setRefreshKey((k) => k + 1);
                } catch (e) {
                  toast.error(e instanceof ApiError ? e.message : String(e));
                }
              }}
            >
              Rain now
            </Button>
          )
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

      {tab === 'settings' && <PromotionForm promo={draft} games={games} onChange={setDraft} readOnly={readOnly} />}
      {tab === 'awards' && <AwardsTab promotionId={promotionId} canEdit={canEdit} refreshKey={refreshKey} />}
      {tab === 'grant' && <GrantTab promo={saved} onGranted={() => setRefreshKey((k) => k + 1)} canEdit={canEdit} />}
      {tab === 'leaderboard' && <LeaderboardTab promotionId={promotionId} refreshKey={refreshKey} metric={saved.leaderboard?.metric ?? 'BestMultiple'} />}
      {tab === 'history' && <HistoryTab promotionId={promotionId} refreshKey={refreshKey} />}

      {!readOnly && tab === 'settings' && (dirty || saveErrors.length > 0) && (
        <div className="fixed bottom-0 left-60 right-0 border-t border-ink-700 bg-ink-900/95 px-8 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {saveErrors.length ? <ErrorList messages={saveErrors} /> : <span className="text-sm text-amber-200">{isNew ? 'Not saved yet.' : 'You have unsaved changes.'}</span>}
            </div>
            <div className="flex gap-2">
              {!isNew && (
                <Button variant="ghost" disabled={busy} onClick={() => { setDraft(saved); setSaveErrors([]); }}>
                  Discard
                </Button>
              )}
              <Button variant="primary" disabled={busy} onClick={save}>
                {busy ? 'Saving…' : isNew ? 'Create promotion' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const AWARD_TONE: Record<AwardStatus, 'green' | 'neutral' | 'blue' | 'amber' | 'red'> = {
  Paid: 'green',
  Pending: 'blue',
  Failed: 'red',
  Available: 'blue',
  InPlay: 'amber',
  Used: 'neutral',
  Expired: 'neutral',
  Cancelled: 'neutral',
};
const STATUSES: ('All' | AwardStatus)[] = ['All', 'Paid', 'Pending', 'Failed', 'Available', 'InPlay', 'Used', 'Expired', 'Cancelled'];

function AwardsTab({ promotionId, canEdit, refreshKey }: { promotionId: number; canEdit: boolean; refreshKey: number }) {
  const [awards, setAwards] = useState<PromoAward[] | null>(null);
  const [status, setStatus] = useState<'All' | AwardStatus>('All');
  const [player, setPlayer] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setAwards(null);
    api
      .promoAwards(promotionId, { status: status === 'All' ? undefined : status, playerId: player.trim() || undefined })
      .then(setAwards)
      .catch((e) => toast.error(e instanceof ApiError ? e.message : String(e)));
  }, [promotionId, status, refreshKey, reload]);

  const cash = (awards ?? []).filter((a) => a.kind === 'Cash' && a.status === 'Paid').reduce((s, a) => s + a.amount, 0);

  return (
    <Card
      title="Awards"
      actions={
        <>
          <TextInput placeholder="Player id…" value={player} onChange={(e) => setPlayer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setReload((r) => r + 1)} className="w-40" />
          <Select value={status} options={STATUSES} onChange={setStatus} className="w-36" />
        </>
      }
    >
      {!awards ? (
        <Loading />
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-400">
            {awards.length} award{awards.length === 1 ? '' : 's'} shown · {formatMoney(cash)} paid in cash.
          </p>
          <div className="overflow-x-auto rounded-md border border-ink-800">
            <table className="w-full text-sm">
              <thead className="bg-ink-850 text-left text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Player</th>
                  <th className="px-3 py-2 font-medium">Game</th>
                  <th className="px-3 py-2 font-medium">What</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {awards.map((a) => (
                  <tr key={a.awardId} className="bg-ink-950 align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-ink-300">{formatWhen(a.createdAt)}</td>
                    <td className="px-3 py-2">
                      <div className="font-mono text-xs">{a.playerId}</div>
                      {a.username !== a.playerId && <div className="text-xs text-ink-400">{a.username}</div>}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-ink-300">{a.gameId || '—'}</td>
                    <td className="px-3 py-2">
                      <div>{a.kind === 'FreeBet' ? 'Free bet' : 'Cash'}</div>
                      <div className="text-xs text-ink-400">{a.reason}</div>
                      {a.kind === 'FreeBet' && a.status === 'Used' && a.winAmount != null && (
                        <div className="text-xs text-ink-400">Returned {formatMoney(a.winAmount)}</div>
                      )}
                      {a.kind === 'FreeBet' && a.expiresAt && a.status === 'Available' && (
                        <div className="text-xs text-ink-400">Expires {formatWhen(a.expiresAt)}</div>
                      )}
                      {a.error && <div className="text-xs text-red-300">{a.error}</div>}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{formatMoney(a.amount)}</td>
                    <td className="px-3 py-2">
                      <Badge tone={AWARD_TONE[a.status]}>{a.status}</Badge>
                      {a.status === 'Failed' && <div className="mt-1 text-xs text-ink-400">{a.attempts} attempts — retrying</div>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {canEdit && a.kind === 'FreeBet' && a.status === 'Available' && (
                        <Button
                          variant="ghost"
                          className="!px-2 !py-1 text-xs"
                          onClick={async () => {
                            try {
                              await api.cancelAward(a.awardId);
                              toast.success('Free bet cancelled');
                              setReload((r) => r + 1);
                            } catch (e) {
                              toast.error(e instanceof ApiError ? e.message : String(e));
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {awards.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-ink-400">
                      Nothing awarded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

function GrantTab({ promo, onGranted, canEdit }: { promo: Promotion; onGranted: () => void; canEdit: boolean }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const ids = text.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
  const f = promo.freeBet!;

  return (
    <Card title="Give free bets">
      <p className="mb-4 text-sm text-ink-400">
        Each player gets {f.betsPerPlayer} free bet{f.betsPerPlayer === 1 ? '' : 's'} of {formatMoney(f.stake)}, valid for {f.validDays} days, usable in{' '}
        {promo.gameIds.join(', ')}. Grants stop when the budget is used up.
      </p>
      <textarea
        value={text}
        disabled={!canEdit}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="Platform player ids — one per line, or separated by commas"
        className="w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 font-mono text-sm text-ink-100 placeholder:text-ink-600 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-ink-400">
          {ids.length} player{ids.length === 1 ? '' : 's'} · {formatMoney(ids.length * f.betsPerPlayer * f.stake)} in free bets
        </span>
        <Button
          variant="primary"
          disabled={!canEdit || busy || ids.length === 0}
          onClick={async () => {
            setBusy(true);
            try {
              const { granted, outOfBudget } = await api.grantFreeBets(promo.promotionId, ids);
              toast.success(`${granted} free bet${granted === 1 ? '' : 's'} given.`);
              if (outOfBudget > 0) toast.warn(`${outOfBudget} not given — the budget ran out.`);
              setText('');
              onGranted();
            } catch (e) {
              toast.error(e instanceof ApiError ? e.message : String(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Giving…' : 'Give free bets'}
        </Button>
      </div>
    </Card>
  );
}

function LeaderboardTab({ promotionId, refreshKey, metric }: { promotionId: number; refreshKey: number; metric: LeaderboardMetric }) {
  const label = LEADERBOARD_METRICS.find((m) => m.metric === metric)?.label ?? 'Score';
  const show = (score: number) =>
    metric === 'BestMultiple' ? `${score}×` : metric === 'RoundsPlayed' || metric === 'Hits' ? String(score) : formatMoney(score);
  const [board, setBoard] = useState<LeaderboardView | null>(null);
  const [period, setPeriod] = useState('');

  useEffect(() => {
    api
      .promoLeaderboard(promotionId, period.trim() || undefined)
      .then(setBoard)
      .catch((e) => toast.error(e instanceof ApiError ? e.message : String(e)));
  }, [promotionId, refreshKey, period]);

  return (
    <Card
      title={board ? `Leaderboard · ${board.period}` : 'Leaderboard'}
      actions={<TextInput placeholder="Period, e.g. 2026-11-02" defaultValue="" onBlur={(e) => setPeriod(e.target.value)} className="w-48" />}
    >
      {!board ? (
        <Loading />
      ) : (
        <>
          {board.endsAt && <p className="mb-3 text-sm text-ink-400">This period ends {formatWhen(board.endsAt)} — prizes are paid then.</p>}
          <div className="overflow-hidden rounded-md border border-ink-800">
            <table className="w-full text-sm">
              <thead className="bg-ink-850 text-left text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Rank</th>
                  <th className="px-3 py-2 font-medium">Player</th>
                  <th className="px-3 py-2 font-medium">Game</th>
                  <th className="px-3 py-2 text-right font-medium">{label}</th>
                  <th className="px-3 py-2 text-right font-medium">Stake</th>
                  <th className="px-3 py-2 text-right font-medium">Prize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {board.rows.map((r) => (
                  <tr key={r.playerId} className="bg-ink-950">
                    <td className="px-3 py-2 font-mono">{r.rank}</td>
                    <td className="px-3 py-2">
                      <div className="font-mono text-xs">{r.playerId}</div>
                      <div className="text-xs text-ink-400">{r.username}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-ink-300">{r.gameId}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{show(r.score)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{formatMoney(r.stake)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{r.prize != null ? formatMoney(r.prize) : '—'}</td>
                  </tr>
                ))}
                {board.rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-ink-400">
                      No qualifying wins in this period yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

function HistoryTab({ promotionId, refreshKey }: { promotionId: number; refreshKey: number }) {
  const [rows, setRows] = useState<PromotionChange[] | null>(null);
  useEffect(() => {
    api.promoHistory(promotionId).then(setRows).catch((e) => toast.error(e instanceof ApiError ? e.message : String(e)));
  }, [promotionId, refreshKey]);
  if (!rows) return <Loading />;

  return (
    <Card title="History">
      <ol className="space-y-4">
        {rows.map((r) => (
          <li key={r.auditId} className="rounded-md border border-ink-800 bg-ink-950 p-3">
            <div className="text-sm">
              <span className="font-medium text-ink-100">{r.changedBy}</span>{' '}
              <span className="text-ink-400">{r.oldValue ? 'changed it' : 'created it'} · {formatWhen(r.changedAt)}</span>
            </div>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              {diff(r.oldValue, r.newValue).map((d) => (
                <li key={d.path}>
                  <span className="text-ink-400">{d.path}</span>: {d.before !== undefined && <span className="text-red-300 line-through">{d.before}</span>}{' '}
                  <span className="text-emerald-300">{d.after}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-ink-400">No changes recorded.</li>}
      </ol>
    </Card>
  );
}

/** Flattened field-by-field differences between two promotion JSON snapshots. */
function diff(oldJson: string | null, newJson: string) {
  const flat = (v: unknown, prefix = '', out: Record<string, string> = {}) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) for (const [k, x] of Object.entries(v)) flat(x, prefix ? `${prefix}.${k}` : k, out);
    else out[prefix] = JSON.stringify(v);
    return out;
  };
  const a = oldJson ? flat(JSON.parse(oldJson)) : {};
  const b = flat(JSON.parse(newJson));
  return Object.keys({ ...a, ...b })
    .filter((k) => a[k] !== b[k] && !(oldJson == null && b[k] === 'null'))
    .map((path) => ({ path, before: oldJson ? a[path] : undefined, after: b[path] }));
}
