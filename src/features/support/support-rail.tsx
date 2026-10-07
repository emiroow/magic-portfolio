'use client';

import type { SupportStats } from '@/features/support/queries';
import { formatPrice, localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import { ExternalLink, EyeOff, Unlock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

/** One honest icon per reassurance, so the list is read at a glance instead of as three clones. */
const TRUST_ICONS = { noAccount: Unlock, private: EyeOff, monochrome: ExternalLink } as const;

/**
 * The page's side rail: the two things a supporter weighs after the methods
 * themselves — how much support actually landed here, and what this site does not
 * do with their data.
 *
 * Neither is a control, and nothing here is invented: the figures come from the
 * confirmed gifts in the database, and a total is shown only while those gifts sit
 * on one scale. A mixed toman/dollar wall reports its supporter count and stays
 * quiet about the sum rather than adding numbers that mean different things.
 */
export default function SupportRail({ stats }: { stats: SupportStats }) {
  const t = useTranslations('support');
  const tp = useTranslations('pricing');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const raised = stats.raised !== null && stats.raised > 0 && stats.currency ? stats.raised : null;
  const hasFigures = stats.supporters > 0 || raised !== null;

  return (
    <div className="rounded-xl border bg-card p-5">
      {hasFigures && (
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {stats.supporters > 0 && (
            <div>
              <p className="text-xl font-bold leading-tight tabular-nums">{localizedCount(stats.supporters, lang)}</p>
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{t('stats.supportersLabel')}</p>
            </div>
          )}
          {raised !== null && stats.currency && (
            <div>
              <p className="flex items-baseline gap-1.5 text-xl font-bold leading-tight">
                <bdi dir="ltr" className="tabular-nums">
                  {formatPrice(raised, lang)}
                </bdi>
                <span className="text-[11px] font-medium text-muted-foreground">{tp(stats.currency)}</span>
              </p>
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{t('stats.raisedLabel')}</p>
            </div>
          )}
        </div>
      )}

      {hasFigures && <div aria-hidden className="my-4 h-px bg-border" />}

      <ul className="space-y-2.5">
        {(Object.keys(TRUST_ICONS) as (keyof typeof TRUST_ICONS)[]).map(key => {
          const Icon = TRUST_ICONS[key];

          return (
            <li key={key} className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
              <Icon className="mt-0.5 size-3.5 shrink-0 text-foreground/70" aria-hidden />
              <span>{t(`trust.${key}`)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
