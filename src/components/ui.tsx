import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

// Small building blocks shared by every page. Tailwind only — no component library.

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BUTTON: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-[#3d7af0] disabled:bg-ink-700 disabled:text-ink-400',
  secondary: 'bg-ink-800 text-ink-100 border border-ink-700 hover:bg-ink-700 disabled:text-ink-400',
  ghost: 'text-ink-300 hover:bg-ink-800 hover:text-ink-100 disabled:text-ink-600',
  danger: 'bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20',
};

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${BUTTON[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({ title, actions, children, className = '' }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-ink-800 bg-ink-900 ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-4 border-b border-ink-800 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink-100">{title}</h2>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Field({ label, hint, children, className = '' }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

const INPUT =
  'w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 ' +
  'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft disabled:cursor-not-allowed disabled:bg-ink-900 disabled:text-ink-400';

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${INPUT} ${className}`} {...props} />;
}

/**
 * Number field that lets the user type freely ("1.", "") and reports a number only when the text is one.
 * nullable: empty text reports null.
 */
export function NumberInput({
  value,
  onChange,
  nullable = false,
  className = '',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number | null;
  onChange: (value: number | null) => void;
  nullable?: boolean;
}) {
  const [text, setText] = useState(value == null ? '' : String(value));
  // Follow outside changes (reset, reload) without fighting the user's typing.
  useEffect(() => {
    if (value == null ? text !== '' : Number(text) !== value) setText(value == null ? '' : String(value));
  }, [value]);

  return (
    <input
      inputMode="decimal"
      className={`${INPUT} font-mono tabular-nums ${className}`}
      value={text}
      onChange={(e) => {
        const next = e.target.value.replace(',', '.');
        setText(next);
        if (next.trim() === '') {
          if (nullable) onChange(null);
          return;
        }
        const n = Number(next);
        if (Number.isFinite(n)) onChange(n);
      }}
      {...props}
    />
  );
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  disabled,
  className = '',
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select className={`${INPUT} ${className}`} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-emerald-500' : 'bg-ink-700'
      }`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

type Tone = 'neutral' | 'green' | 'red' | 'amber' | 'blue' | 'violet';
const TONES: Record<Tone, string> = {
  neutral: 'bg-ink-800 text-ink-300 border-ink-700',
  green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  red: 'bg-red-500/10 text-red-300 border-red-500/30',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  blue: 'bg-accent/10 text-[#8db4ff] border-accent/30',
  violet: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium ${TONES[tone]}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-100">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ErrorList({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {messages.length === 1 ? (
        messages[0]
      ) : (
        <ul className="list-disc space-y-1 pl-4">
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <div className="py-16 text-center text-sm text-ink-400">{label}</div>;
}
