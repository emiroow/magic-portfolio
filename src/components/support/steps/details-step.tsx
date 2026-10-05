'use client';

import { SummaryLine, TextField, Toggle } from '@/components/support/steps/step-parts';
import { Textarea } from '@/components/ui/textarea';
import { SUPPORTER_MESSAGE_LIMIT } from '@/constants/global';
import { nameDir } from '@/components/support/support-meta';
import { localizedCount } from '@/lib/utils';
import type { AppLocale, ProductCurrency } from '@/types';
import { useLocale, useTranslations } from 'next-intl';

interface DetailsStepProps {
  name: string;
  onName: (value: string) => void;
  anonymous: boolean;
  onAnonymous: (value: boolean) => void;
  email: string;
  onEmail: (value: string) => void;
  message: string;
  onMessage: (value: string) => void;
  showOnWall: boolean;
  onShowOnWall: (value: boolean) => void;
  honeypot: string;
  onHoneypot: (value: string) => void;
  amount: number;
  currency: ProductCurrency;
  /** What is about to happen, in the order it was chosen: method, then destination. */
  summary: { method: string; destination: string };
}

/**
 * Who the gift is from, and what may be shown of it.
 *
 * Every field here is optional: the wall is a choice the supporter makes, not a
 * condition of supporting. The summary at the top keeps the amount and the
 * destination in view, because this is the last screen before the money moves.
 */
export function DetailsStep({
  name,
  onName,
  anonymous,
  onAnonymous,
  email,
  onEmail,
  message,
  onMessage,
  showOnWall,
  onShowOnWall,
  honeypot,
  onHoneypot,
  amount,
  currency,
  summary,
}: DetailsStepProps) {
  const td = useTranslations('support.dialog');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border bg-muted/30 px-3 py-2.5">
        <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
          <span className="font-medium">{td('summaryLabel')}</span>
          <span className="min-w-0 text-foreground" dir={nameDir(`${summary.method} · ${summary.destination}`)}>
            {summary.method}
            <span aria-hidden className="mx-1.5 opacity-50">
              ·
            </span>
            {summary.destination}
          </span>
        </p>
        <SummaryLine label={td('total')} amount={amount} currency={currency} />
      </div>

      <TextField label={td('nameLabel')} value={name} onChange={onName} placeholder={td('namePlaceholder')} maxLength={60} disabled={anonymous} />

      <Toggle
        label={td('anonymous')}
        checked={anonymous}
        onChange={value => {
          onAnonymous(value);
          if (value) onName('');
        }}
      />

      <TextField
        label={td('emailLabel')}
        value={email}
        onChange={onEmail}
        placeholder={td('emailPlaceholder')}
        type="email"
        dir="ltr"
        autoComplete="email"
        hint={td('emailHint')}
      />

      <label className="flex flex-col gap-2">
        <span className="flex items-baseline justify-between gap-2 text-xs font-medium text-muted-foreground">
          {td('messageLabel')}
          <span className="tabular-nums opacity-70">
            {td('messageCount', { count: localizedCount(message.length, lang), max: localizedCount(SUPPORTER_MESSAGE_LIMIT, lang) })}
          </span>
        </span>
        <Textarea
          rows={3}
          value={message}
          onChange={event => onMessage(event.target.value.slice(0, SUPPORTER_MESSAGE_LIMIT))}
          placeholder={td('messagePlaceholder')}
          dir="auto"
        />
      </label>

      <div className="space-y-1.5">
        <Toggle label={td('wallLabel')} checked={showOnWall} onChange={onShowOnWall} />
        <p className="text-xs leading-relaxed text-muted-foreground/80">{td('wallHint')}</p>
      </div>

      {/* Honeypot: hidden from people, tempting for scripts. Filled fields are
          dropped by the server without telling the caller. */}
      <input
        type="text"
        value={honeypot}
        onChange={event => onHoneypot(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="sr-only size-px"
      />
    </div>
  );
}
