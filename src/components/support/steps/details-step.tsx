'use client';

import { SummaryLine, TextField, Toggle } from '@/components/support/steps/step-parts';
import type { WizardDetails } from '@/components/support/use-support-wizard';
import { Textarea } from '@/components/ui/textarea';
import { SUPPORTER_MESSAGE_LIMIT } from '@/constants/global';
import { nameDir } from '@/components/support/support-meta';
import { localizedCount } from '@/lib/utils';
import type { AppLocale, ProductCurrency } from '@/types';
import { useLocale, useTranslations } from 'next-intl';

interface DetailsStepProps {
  /** Everything the supporter says about themselves, held as one travelling object. */
  details: WizardDetails;
  onChange: <Key extends keyof WizardDetails>(key: Key, value: WizardDetails[Key]) => void;
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
export function DetailsStep({ details, onChange, amount, currency, summary }: DetailsStepProps) {
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

      <TextField
        label={td('nameLabel')}
        value={details.name}
        onChange={value => onChange('name', value)}
        placeholder={td('namePlaceholder')}
        maxLength={60}
        disabled={details.anonymous}
      />

      <Toggle
        label={td('anonymous')}
        checked={details.anonymous}
        onChange={value => {
          onChange('anonymous', value);
          // Anonymity is a promise, not a filter: the name is dropped when it is asked for.
          if (value) onChange('name', '');
        }}
      />

      <TextField
        label={td('emailLabel')}
        value={details.email}
        onChange={value => onChange('email', value)}
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
            {td('messageCount', {
              count: localizedCount(details.message.length, lang),
              max: localizedCount(SUPPORTER_MESSAGE_LIMIT, lang),
            })}
          </span>
        </span>
        <Textarea
          rows={3}
          value={details.message}
          onChange={event => onChange('message', event.target.value.slice(0, SUPPORTER_MESSAGE_LIMIT))}
          placeholder={td('messagePlaceholder')}
          dir="auto"
        />
      </label>

      <div className="space-y-1.5">
        <Toggle label={td('wallLabel')} checked={details.showOnWall} onChange={value => onChange('showOnWall', value)} />
        <p className="text-xs leading-relaxed text-muted-foreground/80">{td('wallHint')}</p>
      </div>

      {/* Honeypot: hidden from people, tempting for scripts. Filled fields are
          dropped by the server without telling the caller. */}
      <input
        type="text"
        value={details.honeypot}
        onChange={event => onChange('honeypot', event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="sr-only size-px"
      />
    </div>
  );
}
