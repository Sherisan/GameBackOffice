import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api, ApiError } from '../api/client';
import { PROMO_FAMILIES, PROMO_TYPES, promoLabel, type PromoState, type PromotionSummary, type PromoType } from '../api/promoTypes';
import { useAuth } from '../auth/AuthContext';
import { Badge, Button, Card, ErrorList, Loading, PageHeader, Toggle } from '../components/ui';
import { formatMoney } from '../lib/rtp';

export const STATE_TONE: Record<PromoState, 'green' | 'neutral' | 'blue' | 'amber' | 'red'> = {
  Live: 'green',
  Scheduled: 'blue',
  Off: 'neutral',
  Ended: 'neutral',
  BudgetSpent: 'amber',
};
export const STATE_LABEL: Record<PromoState, string> = {
  Live: 'Live',
  Scheduled: 'Scheduled',
  Off: 'Off',
  Ended: 'Ended',
  BudgetSpent: 'Budget spent',
};

export const formatWhen = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export function PromotionsPage() {
  const { canEdit } = useAuth();
  const navigate = useNavigate();
  const [promos, setPromos] = useState<PromotionSummary[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);

  const load = () => api.promotions().then(setPromos).catch((e) => setErrors(e instanceof ApiError ? e.messages : [String(e)]));
  useEffect(() => {
    load();
  }, []);

  async function setEnabled(p: PromotionSummary, enabled: boolean) {
    setBusyId(p.promotionId);
    try {
      await api.setPromotionEnabled(p.promotionId, enabled);
      toast.success(`${p.name} switched ${enabled ? 'on' : 'off'}`);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Promotions"
        subtitle="Promo tools for every game. Every payout comes out of the promotion's budget, never the game's RTP."
        actions={
          canEdit && (
            <Button variant="primary" onClick={() => setPicking((v) => !v)}>
              + New promotion
            </Button>
          )
        }
      />

      {picking && (
        <Card title="What kind of promotion?" className="mb-6">
          <div className="space-y-5">
            {PROMO_FAMILIES.map((family) => (
              <div key={family}>
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">{family}</div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {PROMO_TYPES.filter((t) => t.family === family).map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => navigate(`/promotions/new?type=${t.type}`)}
                      className="rounded-md border border-ink-700 bg-ink-950 p-4 text-left transition-colors hover:border-accent hover:bg-ink-850"
                    >
                      <div className="font-medium text-ink-100">{t.label}</div>
                      <div className="mt-1 text-sm text-ink-400">{t.blurb}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <ErrorList messages={errors} />
      {!promos && errors.length === 0 && <Loading />}

      {promos && (
        <div className="overflow-hidden rounded-lg border border-ink-800">
          <table className="w-full text-sm">
            <thead className="bg-ink-900 text-left text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Promotion</th>
                <th className="px-4 py-3 font-medium">Games</th>
                <th className="px-4 py-3 font-medium">Runs</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {promos.map((p) => {
                const used = p.budget > 0 ? Math.min(1, p.spent / p.budget) : 0;
                return (
                  <tr key={p.promotionId} className="bg-ink-950 hover:bg-ink-900">
                    <td className="px-4 py-3">
                      <Link to={`/promotions/${p.promotionId}`} className="font-medium text-ink-100 hover:text-accent">
                        {p.name}
                      </Link>
                      <div className="mt-0.5 text-xs text-ink-400">{promoLabel(p.type as PromoType)}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-300">
                      {p.gameIds.join(', ')}
                      {(p.subGames?.length ?? 0) > 0 && (
                        <div className="mt-0.5 font-sans text-ink-400" title={p.subGames!.join(', ')}>
                          {p.subGames!.length} attraction{p.subGames!.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-300">
                      <div>{p.startsAt ? `From ${formatWhen(p.startsAt)}` : 'From when switched on'}</div>
                      <div className="text-ink-400">{p.endsAt ? `Until ${formatWhen(p.endsAt)}` : 'No end date'}</div>
                    </td>
                    <td className="w-48 px-4 py-3">
                      <div className="flex justify-between font-mono text-xs tabular-nums">
                        <span>{formatMoney(p.spent)}</span>
                        <span className="text-ink-400">of {formatMoney(p.budget)}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-800">
                        <div className={`h-full ${used >= 1 ? 'bg-amber-400' : 'bg-accent'}`} style={{ width: `${used * 100}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATE_TONE[p.state]}>{STATE_LABEL[p.state]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Toggle
                        label={`${p.name} on`}
                        checked={p.enabled}
                        disabled={!canEdit || busyId === p.promotionId}
                        onChange={(v) => setEnabled(p, v)}
                      />
                    </td>
                  </tr>
                );
              })}
              {promos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-400">
                    No promotions yet.
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
