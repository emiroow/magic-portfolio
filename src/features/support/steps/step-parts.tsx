'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PriceTag } from '@/features/products/price-tag';
import { cn } from '@/lib/utils';
import type { CryptoNetwork } from '@/features/support/types';
import type { PriceUnit } from '@/types';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

/* ------------------------------ group frames ------------------------------ */

/**
 * One labelled group of choices inside the wizard.
 *
 * Destinations are rendered `nested` under their method, with a rule on the reading
 * start edge: a supporter has to see at a glance that these pages belong to the
 * method picked above them and to no other. Everything is a logical utility, so the
 * rule moves to the right side of the line in Persian on its own.
 */
export function ChoiceGroup({
  legend,
  count,
  nested = false,
  children,
}: {
  legend: string;
  /** Quiet trailing note, usually how many choices the group holds. */
  count?: string;
  nested?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className="m-0 min-w-0 space-y-2 border-0 p-0">
      <legend className="mb-2 flex max-w-full items-baseline gap-2 text-xs font-medium text-muted-foreground">
        <span className="min-w-0 truncate" dir="auto">
          {legend}
        </span>
        {count && (
          <span className="shrink-0 text-[11px] opacity-70" dir="auto">
            {count}
          </span>
        )}
      </legend>
      <div className={cn(nested ? 'space-y-2 border-s-2 border-border ps-3' : 'grid gap-2 sm:grid-cols-2')}>{children}</div>
    </fieldset>
  );
}

/* -------------------------------- feedback -------------------------------- */

/** A refused request, with the one action that clears it. */
export function ErrorNote({ message, onRetry }: { message: string; onRetry: () => void }) {
  const td = useTranslations('support.dialog');

  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/40 px-3 py-2.5">
      <span className="flex min-w-0 items-center gap-2 text-xs text-destructive">
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0">{message}</span>
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="rounded px-1.5 py-1 text-xs font-medium underline underline-offset-4 transition-opacity hover:opacity-70"
      >
        {td('errorRetry')}
      </button>
    </div>
  );
}

/** The end of the flow: nothing left to do but close. */
export function Thanks({ note, onClose }: { note: string; onClose: () => void }) {
  const t = useTranslations('support');
  const td = useTranslations('support.dialog');

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <span aria-hidden className="flex size-11 items-center justify-center rounded-full border">
        <Check className="size-5" />
      </span>
      <p className="text-base font-semibold">{td('doneTitle')}</p>
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{note}</p>
      <p className="text-xs text-muted-foreground/80">{t('trust.private')}</p>
      <Button type="button" variant="outline" className="mt-1 rounded-full" onClick={onClose}>
        {td('close')}
      </Button>
    </div>
  );
}

/* --------------------------------- money ---------------------------------- */

/** The amount, spelled out in the unit it is actually held in. */
export function SummaryLine({ label, amount, currency }: { label: string; amount: number; currency: PriceUnit }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <PriceTag amount={amount} currency={currency} className="text-sm font-semibold" />
    </div>
  );
}

/**
 * A value the supporter has to get right: card digits, an IBAN, an address.
 *
 * The text is pinned to its own direction and grouped for reading, because a
 * mirrored number is a payment to a stranger. Copying answers with a check for two
 * seconds, so the click is confirmed without a toast covering the screen.
 */
export function CopyRow({
  copyKey,
  label,
  value,
  raw,
  onCopy,
  copied,
}: {
  /** Which row is copied, so only its own mark flips to a check. */
  copyKey: string;
  label: string;
  value: string;
  raw: string;
  onCopy: (key: string, value: string) => void;
  copied: boolean;
}) {
  const td = useTranslations('support.dialog');

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <bdi dir="ltr" className="min-w-0 flex-1 truncate rounded-lg border bg-muted/30 px-3 py-2 text-sm tabular-nums ltr:font-mono">
          {value}
        </bdi>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          onClick={() => onCopy(copyKey, raw)}
          aria-label={`${td(copied ? 'copied' : 'copy')}: ${value}`}
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        </Button>
      </div>
    </div>
  );
}

/** A labelled checkbox that stays a real control, at a touchable size. */
export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-input px-3 py-2 shadow-sm transition-colors hover:border-foreground/40 focus-within:ring-2 focus-within:ring-ring/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        className="size-4 shrink-0 rounded border-input accent-primary"
      />
      <span className="text-sm leading-none">{label}</span>
    </label>
  );
}

/** A single-line field with its label above it and its hint below. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  dir = 'auto',
  hint,
  maxLength,
  autoComplete,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  dir?: 'auto' | 'ltr';
  hint?: string;
  maxLength?: number;
  autoComplete?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        disabled={disabled}
        dir={dir}
      />
      {hint && <span className="text-xs leading-relaxed text-muted-foreground/80">{hint}</span>}
    </label>
  );
}

/* -------------------------------- networks -------------------------------- */

/**
 * A network written in both scripts, e.g. `ترون · TRON (TRC-20)`.
 *
 * The Latin half is pinned to its own direction: parentheses inside a Persian line
 * otherwise mirror, and a mirrored network name is exactly the kind of ambiguity
 * that sends money to the wrong chain.
 */
export function NetworkName({ network }: { network: CryptoNetwork }) {
  const t = useTranslations('support');
  const [native, ...latin] = t(`networks.${network}`).split(' · ');

  return (
    <span className="flex flex-wrap items-baseline gap-x-1.5 font-medium">
      <span>{native}</span>
      {latin.map(part => (
        <span key={part} dir="ltr" className="inline-flex items-baseline gap-1.5">
          <span aria-hidden className="opacity-50">
            ·
          </span>
          {part}
        </span>
      ))}
    </span>
  );
}

/** A labelled fact on a payment screen: asset, network, holder, deadline. */
export function DetailLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 font-medium">{children}</span>
    </p>
  );
}
