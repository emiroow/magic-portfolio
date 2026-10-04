'use client';

import { CoffeeMark } from '@/components/support/coffee-mark';
import { SupportCard } from '@/components/support/support-card';
import { SupportDialog } from '@/components/support/support-dialog';
import { SupporterWall } from '@/components/support/supporter-wall';
import { destinationKey } from '@/components/support/support-meta';
import { Button } from '@/components/ui/button';
import type { DonationProgress, SupportStats } from '@/lib/data';
import { formatPrice, localizedCount } from '@/lib/utils';
import type { AppLocale, IDonation, ISupporter } from '@/types';
import { Check, Coffee, HandHeart, ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

/** Gateway return states, resolved by the page from its own query string. */
export type SupportReturnStatus = 'success' | 'cancelled' | 'failed' | 'error';

interface SupportBrowserProps {
  options: IDonation[];
  supporters: ISupporter[];
  stats: SupportStats;
  progress: Record<string, DonationProgress>;
  /** Opened straight away when the visitor arrived through `?option=`. */
  initialOption?: IDonation;
  /** Banner shown after a gateway sends the supporter back. */
  returnStatus?: SupportReturnStatus;
}

/**
 * The support page: every rail in one grid, the flexible amount called out on its
 * own, and the wall of everyone whose gift landed.
 *
 * The “choose your own amount” tile is not a fake option — it is a real one whose
 * price is `0`, so it charges through whatever rail its owner picked.
 */
export default function SupportBrowser({ options, supporters, stats, progress, initialOption, returnStatus }: SupportBrowserProps) {
  const t = useTranslations('support');
  const tp = useTranslations('pricing');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const flexible = options.find(option => option.amount === 0);
  const fixed = options.filter(option => option.amount !== 0);

  // A deep link (`?option=…`) arrives as `initialOption`, so the dialog simply
  // starts open; nothing to synchronize after mount.
  const [active, setActive] = useState<IDonation | null>(initialOption ?? null);
  const [open, setOpen] = useState(Boolean(initialOption));

  const labels = (option: IDonation) => {
    const key = destinationKey(option);
    const entry = option._id ? progress[option._id] : undefined;
    const percent = option.goal && option.goal > 0 ? Math.round(((entry?.raised ?? 0) / option.goal) * 100) : null;

    return {
      modeLabel: t(`modes.${option.mode}`),
      destinationLabel: key ? t(`providers.${key}`) : undefined,
      regionLabel: t(`regions.${option.region}`),
      cadenceLabel: option.recurring ? t('monthly') : t('oneTime'),
      anyPriceLabel: t('anyPrice'),
      progressPercent: percent ?? undefined,
      progressLabel:
        percent !== null && option.goal
          ? t('progress', {
              percent: `${new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(percent)}${t('percent')}`,
              amount: `${formatPrice(option.goal, lang)} ${tp(option.currency)}`,
            })
          : undefined,
      supportersLabel: entry && entry.count > 0 ? t('stats.supporters', { count: localizedCount(entry.count, lang) }) : undefined,
    };
  };

  return (
    <div className="flex flex-col gap-10">
      {returnStatus && (
        <div className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3.5" role="status">
          {returnStatus === 'success' ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden /> : <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />}
          <p className="min-w-0 text-sm leading-relaxed">{t(`status.${returnStatus}`)}</p>
        </div>
      )}

      {/* Headline numbers, only where they mean something. */}
      {(stats.supporters > 0 || stats.raised !== null) && (
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-y py-4 text-sm">
          {stats.supporters > 0 && (
            <p className="flex items-baseline gap-2">
              <span className="tabular-nums font-bold">{localizedCount(stats.supporters, lang)}</span>
              <span className="text-muted-foreground">{t('stats.supportersLabel')}</span>
            </p>
          )}
          {stats.raised !== null && stats.currency && (
            <p className="flex items-baseline gap-2">
              <bdi dir="ltr" className="tabular-nums font-bold">
                {formatPrice(stats.raised, lang)}
              </bdi>
              <span className="text-muted-foreground">{tp(stats.currency)}</span>
              <span className="text-muted-foreground">{t('stats.raisedLabel')}</span>
            </p>
          )}
          {supporters.length > 0 && <p className="text-muted-foreground">{t('stats.wall')}</p>}
        </div>
      )}

      {options.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <span aria-hidden className="flex size-12 items-center justify-center rounded-full border">
            <Coffee className="size-5 text-muted-foreground" />
          </span>
          <p className="max-w-md px-6 text-sm leading-relaxed text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fixed.map(option => (
            <SupportCard
              key={option._id ?? option.title}
              option={option}
              {...labels(option)}
              headingLevel="h2"
              action={
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setActive(option);
                    setOpen(true);
                  }}
                >
                  {t('pay')}
                </Button>
              }
            />
          ))}
        </div>
      )}

      {flexible && (
        <div className="rounded-xl border bg-card">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-start gap-4">
              <CoffeeMark className="size-12 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-tight ltr:tracking-tight sm:text-lg">{t('anyAmountTitle')}</h2>
                <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">{t('anyAmountDescription')}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t(`modes.${flexible.mode}`)}
                  <span aria-hidden className="mx-1.5">
                    ·
                  </span>
                  <span className="text-muted-foreground/80">{t('anyPrice')}</span>
                </p>
              </div>
            </div>
            <Button
              className="shrink-0 rounded-full"
              onClick={() => {
                setActive(flexible);
                setOpen(true);
              }}
            >
              <HandHeart className="me-2 size-4" aria-hidden />
              {t('anyAmountPay', { amount: t('anyPrice') })}
            </Button>
          </div>
        </div>
      )}

      {/* Trust line: what the page does not do with the supporter's data. */}
      {options.length > 0 && (
        <ul className="flex flex-wrap gap-x-6 gap-y-2 border-t pt-5 text-xs text-muted-foreground">
          {(['noAccount', 'private', 'monochrome'] as const).map(key => (
            <li key={key} className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
              {t(`trust.${key}`)}
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="supporters-heading" className="space-y-5">
        <div>
          <h2 id="supporters-heading" className="text-xl font-bold leading-tight ltr:tracking-tight sm:text-2xl">
            {t('wall.title')}
          </h2>
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">{t('wall.description')}</p>
        </div>
        <SupporterWall supporters={supporters} />
      </section>

      <SupportDialog option={active} open={open} onOpenChange={setOpen} />
    </div>
  );
}
