'use client';

import FlexibleSupport from '@/features/support/flexible-support';
import { SupportCard } from '@/features/support/support-card';
import { SupportDialog } from '@/features/support/support-dialog';
import { IconTile } from '@/features/support/support-tile';
import { SupporterWall } from '@/features/support/supporter-wall';
import { flexibleMethods, variantLabel } from '@/features/support/support-meta';
import { Button } from '@/components/ui/button';
import type { SupportStats } from '@/features/support/queries';
import { handlesMoney, usableVariants } from '@/features/support/variants';
import { cn, documentKey, formatPrice, localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IDonation, ISupporter } from '@/features/support/types';
import { AlertTriangle, Check, ExternalLink, EyeOff, HandHeart, Unlock, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

/** Gateway return states, resolved by the page from its own query string. */
export type SupportReturnStatus = 'success' | 'cancelled' | 'failed' | 'error';

/** One honest icon per reassurance, so the trust row reads at a glance instead of as three clones. */
const TRUST_ICONS = { noAccount: Unlock, private: EyeOff, monochrome: ExternalLink } as const;

/** The mark a gateway return wears: a tick, a cross, or a warning. */
const RETURN_ICONS = { success: Check, cancelled: X, failed: AlertTriangle, error: AlertTriangle } as const;

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
      <Button className="rounded-full px-5" onClick={() => openMethod(method)}>
        {t(`cta.${method.mode}`, { provider })}
      </Button>
    );
  };

  const ReturnIcon = returnStatus ? RETURN_ICONS[returnStatus] : null;
  const returnFailed = returnStatus === 'failed' || returnStatus === 'error';

  return (
    <div className="flex flex-col gap-10">
      {returnStatus && ReturnIcon && (
        <div
          role={returnFailed ? 'alert' : 'status'}
          className={cn('flex items-start gap-3 rounded-xl border bg-card px-4 py-3.5', returnFailed && 'border-foreground/30')}
        >
          <ReturnIcon
            className={cn('mt-0.5 size-4 shrink-0', returnStatus === 'cancelled' ? 'text-muted-foreground' : 'text-foreground')}
            aria-hidden
          />
          <p className="min-w-0 text-sm leading-relaxed">{t(`status.${returnStatus}`)}</p>
        </div>
      )}

      {/* Headline numbers, only where they mean something: each is a figure over its name. */}
      {/* {(stats.supporters > 0 || stats.raised !== null) && (
        <div className="flex flex-wrap items-start gap-x-12 gap-y-6 border-y py-5">
          {stats.supporters > 0 && (
            <div>
              <p className="text-2xl font-bold leading-none tabular-nums sm:text-3xl">{localizedCount(stats.supporters, lang)}</p>
              <p className="mt-2 text-xs text-muted-foreground">{t('stats.supportersLabel')}</p>
            </div>
          )}
          {stats.raised !== null && stats.currency && (
            <div>
              <p className="flex items-baseline gap-1.5 text-2xl font-bold leading-none tabular-nums sm:text-3xl">
                <bdi dir="ltr">{formatPrice(stats.raised, lang)}</bdi>
                <span className="text-sm font-medium text-muted-foreground">{tp(stats.currency)}</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{t('stats.raisedLabel')}</p>
            </div>
          )}
        </div>
      )} */}

      {methods.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <IconTile icon={HandHeart} />
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
                <h2 id="free-support-heading" className="text-base font-bold leading-tight ltr:tracking-tight sm:text-lg">
                  {t('freeTitle')}
                </h2>
                <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">{t('freeDescription')}</p>
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

          {/* Trust line: what the page does not do with the supporter's data. Each promise
              keeps its own icon, so the row is read at a glance rather than as three clones. */}
          <ul className="flex flex-wrap gap-x-7 gap-y-3 border-t pt-6 text-xs text-muted-foreground">
            {(['noAccount', 'private', 'monochrome'] as const).map(key => {
              const Icon = TRUST_ICONS[key];
              return (
                <li key={key} className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-foreground/70" aria-hidden />
                  <span>{t(`trust.${key}`)}</span>
                </li>
              );
            })}
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
