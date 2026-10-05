'use client';

import FlexibleSupport from '@/components/support/flexible-support';
import { SupportCard } from '@/components/support/support-card';
import { SupportDialog } from '@/components/support/support-dialog';
import { SupporterWall } from '@/components/support/supporter-wall';
import { flexibleMethods, variantLabel } from '@/components/support/support-meta';
import { Button } from '@/components/ui/button';
import type { SupportStats } from '@/lib/data';
import { usableVariants } from '@/lib/support';
import { documentKey, formatPrice, localizedCount } from '@/lib/utils';
import type { AppLocale, IDonation, ISupporter } from '@/types';
import { Check, HandHeart, ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

/** Gateway return states, resolved by the page from its own query string. */
export type SupportReturnStatus = 'success' | 'cancelled' | 'failed' | 'error';

interface SupportBrowserProps {
  methods: IDonation[];
  supporters: ISupporter[];
  stats: SupportStats;
  /** Confirmed supporters per method, keyed by method id. */
  counts: Record<string, number>;
  /** Opened straight away when the visitor arrived through `?option=`. */
  initialMethod?: IDonation;
  /** Destination a shared link points at. */
  initialVariantKey?: string;
  /** Amount already chosen, carried by `?amount=`. */
  initialAmount?: number;
  /** Banner shown after a gateway sends the supporter back. */
  returnStatus?: SupportReturnStatus;
}

/**
 * The support page: one card per payment method, the door to an amount of the
 * visitor's own choosing, and the wall of everyone whose support landed.
 *
 * Nothing is decided on the page itself. The method, the destination it pays into
 * and the number are one decision, made in the wizard — the same screen that shows
 * the currency, the limits and the payment details.
 */
export default function SupportBrowser({ methods, supporters, stats, counts, initialMethod, initialVariantKey, initialAmount, returnStatus }: SupportBrowserProps) {
  const t = useTranslations('support');
  const tp = useTranslations('pricing');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const flexible = flexibleMethods(methods);

  // A deep link (`?option=…`) arrives as `initialMethod`, so the wizard simply
  // starts open; nothing to synchronize after mount.
  const [active, setActive] = useState<IDonation | null>(initialMethod ?? null);
  const [dialogOpen, setDialogOpen] = useState(Boolean(initialMethod));
  const [picked, setPicked] = useState<number | undefined>(initialAmount);
  const [variantKey, setVariantKey] = useState<string | undefined>(initialVariantKey);

  /** A card opens its own method, with nothing decided about the amount yet. */
  const openMethod = (option: IDonation) => {
    setActive(option);
    setPicked(undefined);
    setVariantKey(undefined);
    setDialogOpen(true);
  };

  /** The flexible door opens on the first method that takes an open amount. */
  const openFlexible = () => {
    setActive(flexible[0] ?? null);
    setPicked(undefined);
    setVariantKey(undefined);
    setDialogOpen(true);
  };

  /** Switching inside the wizard is the same decision, so the page keeps up with it. */
  const syncChoice = (option: IDonation, key: string, amount: number) => {
    setActive(option);
    setVariantKey(key);
    setPicked(amount);
  };

  return (
    <div className="flex flex-col gap-10">
      {returnStatus && (
        <div className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3.5" role="status">
          {returnStatus === 'success' ? (
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
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
        </div>
      )}

      {methods.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <span aria-hidden className="flex size-10 items-center justify-center rounded-lg border bg-muted/40">
            <HandHeart className="size-4 text-muted-foreground" />
          </span>
          <p className="max-w-md px-6 text-sm leading-relaxed text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* One door for “an amount of my own”: everything is chosen inside it. */}
          {flexible.length > 0 && <FlexibleSupport methods={flexible} onOpen={openFlexible} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {methods.map(method => {
              const first = usableVariants(method)[0];
              const named = variantLabel(first, t);

              return (
                <SupportCard
                  key={documentKey(method) || method.title}
                  option={method}
                  supporters={method._id ? counts[method._id] : undefined}
                  action={
                    <Button size="sm" className="rounded-full" onClick={() => openMethod(method)}>
                      {t(`cta.${method.mode}`, { provider: named || t(`modes.${method.mode}`) })}
                    </Button>
                  }
                />
              );
            })}
          </div>

          {/* Trust line: what the page does not do with the supporter's data. */}
          <ul className="flex flex-wrap gap-x-6 gap-y-2 border-t pt-5 text-xs text-muted-foreground">
            {(['noAccount', 'private', 'monochrome'] as const).map(key => (
              <li key={key} className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
                {t(`trust.${key}`)}
              </li>
            ))}
          </ul>
        </div>
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

      <SupportDialog
        methods={methods}
        option={active}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialAmount={picked}
        initialVariantKey={variantKey}
        onSelect={syncChoice}
      />
    </div>
  );
}
