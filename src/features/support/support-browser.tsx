'use client';

import FlexibleSupport from '@/features/support/flexible-support';
import { SupportCard } from '@/features/support/support-card';
import { SupportDialog } from '@/features/support/support-dialog';
import SupportRail from '@/features/support/support-rail';
import { ChapterHeading, IconTile } from '@/features/support/support-tile';
import { SupporterWall } from '@/features/support/supporter-wall';
import { flexibleMethods, variantLabel } from '@/features/support/support-meta';
import { Button } from '@/components/ui/button';
import type { SupportStats } from '@/features/support/queries';
import { handlesMoney, usableVariants } from '@/features/support/variants';
import { cn, documentKey } from '@/lib/utils';
import type { IDonation, ISupporter } from '@/features/support/types';
import { AlertTriangle, Check, HandHeart, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

/** Gateway return states, resolved by the page from its own query string. */
export type SupportReturnStatus = 'success' | 'cancelled' | 'failed' | 'error';

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
 * The support page: one row per method, the door to an amount of the visitor's own
 * choosing, and the wall of everyone whose support landed.
 *
 * The page is two columns wide from `lg` up — the rails in the main column, the door
 * and the page's own claims in a rail beside them — and one honest stack below that.
 * No list here is cut into fixed tracks, so a site with two open methods shows a full
 * column rather than a row with a hole where the third card would have been.
 *
 * Nothing is decided on the page itself, and no window is shared between rows: a row
 * opens a wizard holding that method's own destinations, currency, limits and steps,
 * while the “your own amount” door opens one that first asks between the methods
 * accepting an open amount. Methods that cost nothing are kept in their own chapter,
 * so a visitor can tell a payment from a gesture before opening either.
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

  /** The one door on a row: it opens that method, and only its own destinations. */
  const cardAction = (method: IDonation) => {
    const first = usableVariants(method)[0];
    const named = variantLabel(first, t, tp);
    // A gesture is offered in the name of the service it happens on; a payment is
    // offered in the name of the account, wallet or page it lands in.
    const provider = (method.mode === 'action' && first?.provider ? t(`providers.${first.provider}`) : named) || t(`modes.${method.mode}`);

    // The door above is the page's one solid button; a row's own action stays one
    // step quieter, so the page has a single loudest ask.
    return (
      <Button variant="outline" className="rounded-full px-4" onClick={() => openMethod(method)}>
        {t(`cta.${method.mode}`, { provider })}
      </Button>
    );
  };

  const ReturnIcon = returnStatus ? RETURN_ICONS[returnStatus] : null;
  const returnFailed = returnStatus === 'failed' || returnStatus === 'error';
  /** The door exists only while some rail here takes an amount the supporter names. */
  const hasDoor = flexible.length > 0;

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

      {methods.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <IconTile icon={HandHeart} />
          <p className="max-w-md px-6 text-sm leading-relaxed text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        /*
         * Two columns from `lg` up: the rails in the main column, the door and the
         * page's claims in a rail of their own that keeps its place while the list
         * scrolls. Nothing here is forced into fixed tracks, so one method or six
         * leave the same tidy column instead of a row with a hole in it.
         *
         * The placements are written out rather than left to source order so the
         * mobile stack stays honest — door, rails, claims — with no part of the rail
         * rendered twice.
         */
        <div className="grid max-w-2xl grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-[minmax(0,1fr)_17rem] lg:grid-rows-[auto_1fr] lg:gap-x-8">
          {hasDoor && (
            <div className="lg:col-start-2 lg:row-start-1">
              <FlexibleSupport methods={flexible} onOpen={openFlexible} />
            </div>
          )}

          <div className={cn('space-y-7 lg:col-start-1 lg:row-start-1', hasDoor && 'lg:row-span-2')}>
            {paid.length > 0 && (
              <ul className="space-y-3">
                {paid.map(method => (
                  <li key={documentKey(method) || method.title}>
                    <SupportCard option={method} supporters={method._id ? counts[method._id] : undefined} action={cardAction(method)} />
                  </li>
                ))}
              </ul>
            )}

            {/* The asks that cost nothing, kept apart so they are never read as prices. */}
            {free.length > 0 && (
              <section aria-labelledby="free-support-heading" className="space-y-4">
                <ChapterHeading id="free-support-heading" title={t('freeTitle')} description={t('freeDescription')} />
                <ul className="space-y-3">
                  {free.map(method => (
                    <li key={documentKey(method) || method.title}>
                      <SupportCard option={method} supporters={method._id ? counts[method._id] : undefined} action={cardAction(method)} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className={cn('lg:col-start-2 lg:sticky lg:self-start lg:top-10', hasDoor ? 'lg:row-start-2' : 'lg:row-start-1')}>
            <SupportRail stats={stats} />
          </div>
        </div>
      )}

      <section aria-labelledby="supporters-heading" className="space-y-5">
        <ChapterHeading id="supporters-heading" title={t('wall.title')} description={t('wall.description')} />
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
