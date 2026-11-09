import type { GameBody } from '../api/types';
import { GAME_TYPES } from '../api/types';
import { Badge, Button, Card, Field, NumberInput, Select, TextInput, Toggle } from './ui';

interface Props {
  draft: GameBody;
  onChange: (patch: Partial<GameBody>) => void;
  readOnly: boolean;
  /** Whether the saved game has a ServerKey (the key itself is never sent to the browser). */
  hasServerKey: boolean;
}

export function GeneralForm({ draft, onChange, readOnly, hasServerKey }: Props) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="Game">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2">
            <TextInput value={draft.name} disabled={readOnly} onChange={(e) => onChange({ name: e.target.value })} />
          </Field>
          <Field label="Type">
            <Select value={draft.type} options={GAME_TYPES} disabled={readOnly} onChange={(type) => onChange({ type })} />
          </Field>
          <Field label="Provider game ID" hint="Game.ProviderGameID in the platform catalogue. Empty = none.">
            <NumberInput nullable value={draft.providerGameId} disabled={readOnly} onChange={(v) => onChange({ providerGameId: v })} />
          </Field>
          <Field label="Launch URL" className="sm:col-span-2" hint="Where players are sent; the session token is added as ?token=. Its origin is allowed by CORS.">
            <TextInput
              value={draft.launchUrl}
              placeholder="https://mygame.example.com/"
              disabled={readOnly}
              onChange={(e) => onChange({ launchUrl: e.target.value })}
            />
          </Field>
          <div className="flex items-center justify-between rounded-md border border-ink-800 bg-ink-950 px-4 py-3 sm:col-span-2">
            <div>
              <div className="text-sm font-medium">Enabled</div>
              <div className="text-xs text-ink-400">Disabled games can't be launched and are hidden from the lobby.</div>
            </div>
            <Toggle label="Enabled" checked={draft.enabled} disabled={readOnly} onChange={(enabled) => onChange({ enabled })} />
          </div>
        </div>
      </Card>

      <Card title="Limits">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Min bet">
            <NumberInput value={draft.minBet} disabled={readOnly} onChange={(v) => onChange({ minBet: v ?? 0 })} />
          </Field>
          <Field label="Max bet">
            <NumberInput value={draft.maxBet} disabled={readOnly} onChange={(v) => onChange({ maxBet: v ?? 0 })} />
          </Field>
          <Field label="Max win" hint="Per player, per round.">
            <NumberInput value={draft.maxWin} disabled={readOnly} onChange={(v) => onChange({ maxWin: v ?? 0 })} />
          </Field>
        </div>
      </Card>

      <Card title="Server key" className="xl:col-span-2">
        <ServerKey draft={draft} onChange={onChange} readOnly={readOnly} hasServerKey={hasServerKey} />
      </Card>
    </div>
  );
}

function ServerKey({ draft, onChange, readOnly, hasServerKey }: Props) {
  const pending = draft.serverKey;
  const status =
    pending === undefined ? (hasServerKey ? 'set' : 'none') : pending === '' ? 'removing' : 'replacing';

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-400">
        Shared secret a game's own backend sends as <code className="font-mono text-ink-300">X-Game-Key</code> to debit and credit wallets.
        Games that settle inside this API don't need one. The key is never shown again after saving.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {status === 'set' && <Badge tone="green">Key set</Badge>}
        {status === 'none' && <Badge>No key</Badge>}
        {status === 'removing' && <Badge tone="amber">Will be removed on save</Badge>}
        {status === 'replacing' && <Badge tone="amber">New key on save</Badge>}

        {!readOnly && (
          <>
            <Button onClick={() => onChange({ serverKey: crypto.randomUUID().replace(/-/g, '') })}>Generate new key</Button>
            {(hasServerKey || status === 'replacing') && status !== 'removing' && (
              <Button variant="ghost" onClick={() => onChange({ serverKey: '' })}>
                Remove key
              </Button>
            )}
            {status !== 'set' && status !== 'none' && (
              <Button variant="ghost" onClick={() => onChange({ serverKey: undefined })}>
                Undo
              </Button>
            )}
          </>
        )}
      </div>
      {status === 'replacing' && (
        <Field label="New key — copy it now and give it to the game's backend">
          <TextInput className="font-mono" value={pending} disabled={readOnly} onChange={(e) => onChange({ serverKey: e.target.value })} />
        </Field>
      )}
    </div>
  );
}
