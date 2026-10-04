import { CupRow } from '@/components/support/coffee-mark';
import { MODE_ICONS } from '@/components/support/support-meta';
import { PriceTag } from '@/components/products/price-tag';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { IDonation } from '@/types';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface SupportCardProps {
  option: IDonation;
  /** Name of the rail, e.g. `Card to card`. */
  modeLabel: string;
  /** Name of the destination platform, when the rail has one. */
  destinationLabel?: string;
  /** `Iran` or `International`. */
  regionLabel: string;
  /** `One time` or `Every month`. */
  cadenceLabel: string;
  /** Shown in the price slot when the option lets the supporter name their own amount. */
  anyPriceLabel: string;
  /** Ready-made `% of goal` sentence, or `undefined` when no goal is set. */
  progressLabel?: string;
  /** `0…100`, drawn as the hairline bar under the pitch. */
  progressPercent?: number;
  /** Confirmed supporters for this option; the line is hidden at zero. */
  supportersLabel?: string;
  /** Archive-style deep link for the title; the home section links on to `/support`. */
  detailHref?: string;
  /** The call to action: a link or a button, supplied by the caller. */
  action: ReactNode;
  className?: string;
  headingLevel?: 'h2' | 'h3';
}

/**
 * A support option as one card: what it buys, what it costs, which rail the
 * money travels on, and how far it has come.
 *
 * The header is the only place the section gets any illustration, and it is a
 * hairline grid with a drawn cup — colour would break the monochrome palette, so
 * emphasis comes from the inverted border on hover instead.
 */
export function SupportCard({
  option,
  modeLabel,
  destinationLabel,
  regionLabel,
  cadenceLabel,
  anyPriceLabel,
  progressLabel,
  progressPercent,
  supportersLabel,
  detailHref,
  action,
  className,
  headingLevel: Heading = 'h3',
}: SupportCardProps) {
  const Icon = MODE_ICONS[option.mode];
  const percent = typeof progressPercent === 'number' ? Math.min(Math.max(progressPercent, 0), 100) : null;

  return (
    <Card
      className={cn(
        'group relative flex h-full flex-col overflow-hidden p-0 transition-colors hover:border-foreground/30',
        className
      )}
    >
      {/* Header: the drawn cup, the cup count, and the rail it is paid through. */}
      <div className="surface-grid relative flex items-start justify-between gap-3 border-b px-4 py-4">
        <div className="min-w-0">
          <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
          <CupRow count={option.cups} className="mt-2.5" />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge variant="outline" className="text-[10px] font-normal">
            {modeLabel}
          </Badge>
          {destinationLabel && (
            <span className="text-[11px] text-muted-foreground" dir="auto">
              {destinationLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex grow flex-col p-4">
        <Heading className="min-w-0 text-sm font-semibold leading-snug">
          {detailHref ? (
            <Link
              href={detailHref}
              className="decoration-muted-foreground/50 underline-offset-2 transition-colors after:absolute after:inset-0 after:content-[''] hover:underline"
            >
              {option.title}
            </Link>
          ) : (
            option.title
          )}
        </Heading>

        {option.description && (
          <p className="mt-2 line-clamp-3 text-pretty text-xs leading-relaxed text-muted-foreground">{option.description}</p>
        )}

        {progressLabel && percent !== null && (
          <div className="mt-3 space-y-1.5">
            <div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <span aria-hidden className="block h-full rounded-full bg-foreground/85 transition-[width] duration-500" style={{ width: `${percent}%` }} />
            </div>
            <p className="text-[11px] tabular-nums text-muted-foreground">{progressLabel}</p>
          </div>
        )}

        <p className="mt-2 text-[11px] text-muted-foreground">
          {regionLabel}
          <span aria-hidden className="mx-1.5">
            ·
          </span>
          {cadenceLabel}
          {supportersLabel && (
            <>
              <span aria-hidden className="mx-1.5">
                ·
              </span>
              <span className="tabular-nums">{supportersLabel}</span>
            </>
          )}
        </p>

        {/* Price and action share the bottom edge, so cards of any text length align. */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          {option.amount > 0 ? (
            <PriceTag amount={option.amount} currency={option.currency} className="text-sm font-semibold" />
          ) : (
            <span className="text-sm font-semibold">{anyPriceLabel}</span>
          )}
          {/* Above the card-wide stretched link, so the button stays pressable. */}
          <span className="relative z-[1]">{action}</span>
        </div>
      </div>
    </Card>
  );
}
