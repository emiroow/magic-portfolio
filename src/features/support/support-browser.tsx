'use client';

import FlexibleSupport from '@/features/support/flexible-support';
import { SupportCard } from '@/features/support/support-card';
import { SupportDialog } from '@/features/support/support-dialog';
import { SupporterWall } from '@/features/support/supporter-wall';
import { flexibleMethods, variantLabel } from '@/features/support/support-meta';
import { Button } from '@/components/ui/button';
import type { SupportStats } from '@/features/support/queries';
import { handlesMoney, usableVariants } from '@/features/support/variants';
import { cn, documentKey, formatPrice, localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IDonation, ISupporter } from '@/features/support/types';
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
 * The support page: one card per method, the door to an amount of the visitor's own
 * choosing, and the wall of everyone whose support landed.
 *
 * Nothing is decided on the page itself, and no window is shared between cards: a
 * card opens a wizard holding that card's own destinations, currency, limits and
 * steps, while the “your own amount” box opens one that first asks between the
 * methods accepting an open amount. Methods that cost nothing are kept in their own
 * block, so a visitor can tell a payment from a gesture before opening either.
 */
export default function SupportBrowser({
  methods,
  supporters,
  stats,
  counts,
  initialMethod,
  initialVariantKey,
  initialAmount,
  returnStatus,
}: SupportBrowserProps) {
  const t = useTranslations('support');
  const tp = useTranslations('pricing');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const flexible = flexibleMethods(methods);
  /** Money rails and free gestures are two kinds of ask; the page says which is which. */
  const paid = methods.filter(method => handlesMoney(method.mode));
  const free = methods.filter(method => !handlesMoney(method.mode));

  // A deep link (`?option=…`) arrives as `initialMethod`, so the wizard simply
  // starts open; nothing to synchronize after mount.
  const [active, setActive] = useState<IDonation | null>(initialMethod ?? null);
  const [dialogOpen, setDialogOpen] = useState(Boolean(initialMethod));
  const [picked, setPicked] = useState<number | undefined>(initialAmount);
  const [variantKey, setVariantKey] = useState<string | undefined>(initialVariantKey);
  /** Which door the window was opened from: a card of its own, or the chooser box. */
  const [scope, setScope] = useState<'card' | 'box'>('card');

  /** A card opens its own method, with nothing decided about the amount yet. */
  const openMethod = (option: IDonation) => {
    setScope('card');
    setActive(option);
    setPicked(undefined);
    setVariantKey(undefined);
    setDialogOpen(true);
  };

  /** The flexible door opens on the first method that takes an open amount. */
  const openFlexible = () => {
    setScope('box');
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

  /** The one door on a card: it opens that method, and only its own destinations. */
  const cardAction = (method: IDonation) => {
    const first = usableVariants(method)[0];
    const named = variantLabel(first, t, tp);
    // A gesture is offered in the name of the service it happens on; a payment is
    // offered in the name of the account, wallet or page it lands in.
    const provider = (method.mode === 'action' && first?.provider ? t(`providers.${first.provider}`) : named) || t(`modes.${method.mode}`);

    return (
      <Button size="sm" className="rounded-full" onClick={() => openMethod(method)}>
        {t(`cta.${method.mode}`, { provider })}
      </Button>
    );
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

          {paid.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paid.map(method => (
                <SupportCard
                  key={documentKey(method) || method.title}
                  option={method}
                  supporters={method._id ? counts[method._id] : undefined}
                  action={cardAction(method)}
                />
              ))}
            </div>
          )}

          {/* The asks that cost nothing, kept apart so they are never read as prices. */}
          {free.length > 0 && (
            <section aria-labelledby="free-support-heading" className={cn('space-y-4', paid.length > 0 && 'border-t pt-6')}>
              <div>
                <h2 id="free-support-heading" className="text-base font-bold leading-tight ltr:tracking-tight">
                  {t('freeTitle')}
                </h2>
                <p className="mt-1.5 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">{t('freeDescription')}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {free.map(method => (
                  <SupportCard
                    key={documentKey(method) || method.title}
                    option={method}
                    supporters={method._id ? counts[method._id] : undefined}
                    action={cardAction(method)}
                  />
                ))}
              </div>
            </section>
          )}

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
        choices={scope === 'box' ? flexible : []}
        heading={scope === 'box' ? { title: t('anyAmountTitle'), description: t('flexible.dialogHint') } : undefined}
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
