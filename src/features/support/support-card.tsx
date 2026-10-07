'use client';

import { IconTile, Tag, itemFoot, itemFrame } from '@/features/support/support-tile';
import { SupportPrice } from '@/features/support/support-price';
import { MODE_ICONS, nameDir, variantDetail, variantLabel } from '@/features/support/support-meta';
import { Card } from '@/components/ui/card';
import { cn, localizedCount } from '@/lib/utils';
import { usableVariants } from '@/features/support/variants';
import type { AppLocale } from '@/types';
import type { IDonation } from '@/features/support/types';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

/** Destinations listed on the card before the count takes over. */
const SHOWN_DESTINATIONS = 3;

interface SupportCardProps {
  option: IDonation;
  /** Confirmed supporters for this method; the line is hidden at zero. */
  supporters?: number;
  /** The call to action: a button, supplied by the page. */
  action: ReactNode;
  className?: string;
}

/**
 * One support method as one row: what it is, where the money actually lands, and
 * what it costs — or that it costs nothing. There is exactly one of these per method,
 * so the page never asks a supporter to compare three prices for the same gesture.
 *
 * A row runs the full width of the page's main column rather than sitting in a track
 * of its own: the number of open methods is whatever the owner left open, and a grid
 * would leave the rest of a row empty as often as not.
 *
 * The destinations listed here are the ones the method itself carries: nothing from
 * another method can appear on this row, or in the wizard it opens.
 *
 * The row shares its parts — the framed icon, the hairline footer, the trailing tags
 * — with the tiles inside the wizard and the supporters wall, so the whole section
 * reads as one system.
 */
export function SupportCard({ option, supporters, action, className }: SupportCardProps) {
  const t = useTranslations('support');
  const tp = useTranslations('pricing');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const Icon = MODE_ICONS[option.mode];
  const destinations = usableVariants(option);
  const named = destinations.slice(0, SHOWN_DESTINATIONS).map(variant => variantLabel(variant, t, tp) || variantDetail(variant));
  const hidden = destinations.length - named.length;
  /** Who has already used this rail. The destinations above already say how many there are. */
  const backed = supporters && supporters > 0 ? t('stats.supporters', { count: localizedCount(supporters, lang) }) : '';

  return (
    <Card className={cn(itemFrame, className)}>
      <div className="flex items-start gap-3.5">
        {/* The tile inverts under the row's pointer: the one place this section lets a
            surface go solid, so a method you can act on feels alive before you commit. */}
        <IconTile icon={Icon} className="group-hover:border-foreground group-hover:bg-foreground group-hover:text-background" />
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-sm font-semibold leading-snug" dir={nameDir(option.title)}>
            {option.title}
          </h3>
          {/* What kind of rail this is, and who has already taken it — one line, because
              the destinations below already say how many of them there are. */}
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs leading-snug text-muted-foreground">
            <span dir="auto">{t(`modes.${option.mode}`)}</span>
            {backed && (
              <>
                <span aria-hidden className="opacity-50">
                  ·
                </span>
                <span className="tabular-nums">{backed}</span>
              </>
            )}
          </p>
        </div>
        <Tag className="mt-0.5">{t(`regions.${option.region}`)}</Tag>
      </div>

      {option.description && (
        <p className="line-clamp-2 text-pretty text-xs leading-relaxed text-muted-foreground" dir="auto">
          {option.description}
        </p>
      )}

      {/* Where the money lands: the names the supporter will meet inside the wizard. */}
      <div className="mt-auto space-y-2">
        {named.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {named.map((label, index) => (
              <li key={`${label}-${index}`}>
                <Tag dir={nameDir(label)}>{label || destinations[index].key}</Tag>
              </li>
            ))}
            {hidden > 0 && (
              <li>
                <Tag>{`+${localizedCount(hidden, lang)}`}</Tag>
              </li>
            )}
          </ul>
        )}

        {/* Price and action share the bottom edge, so rows of any text length align. The
            price keeps its own line whole: a long amount or a list of units never gets
            clipped, it takes the row and leaves the button the next one. */}
        <div className={itemFoot}>
          <SupportPrice option={option} className="min-w-0" />
          <span className="relative z-[1] shrink-0">{action}</span>
        </div>
      </div>
    </Card>
  );
}
