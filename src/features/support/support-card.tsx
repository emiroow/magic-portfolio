'use client';

import { PriceTag } from '@/features/products/price-tag';
import { IconTile, Tag } from '@/features/support/support-tile';
import { MODE_ICONS, nameDir, variantDetail, variantLabel } from '@/features/support/support-meta';
import { Card } from '@/components/ui/card';
import { cn, localizedCount } from '@/lib/utils';
import { handlesMoney, usableVariants } from '@/features/support/variants';
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
 * One support method as one card: what it is, where the money actually lands, and
 * what it costs — or that it costs nothing. There is exactly one of these per method,
 * so the page never asks a supporter to compare three prices for the same gesture.
 *
 * The destinations listed here are the ones the method itself carries: nothing from
 * another method can appear on this card, or in the wizard it opens.
 *
 * The card shares its parts — the framed icon, the hairline footer, the trailing
 * tags — with the tiles inside the wizard and the supporters wall, so the whole
 * section reads as one system.
 */
export function SupportCard({ option, supporters, action, className }: SupportCardProps) {
  const t = useTranslations('support');
  const tp = useTranslations('pricing');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const Icon = MODE_ICONS[option.mode];
  const destinations = usableVariants(option);
  const named = destinations.slice(0, SHOWN_DESTINATIONS).map(variant => variantLabel(variant, t) || variantDetail(variant));
  const hidden = destinations.length - named.length;
  const meta = [
    destinations.length > 1 ? t('destinations', { count: localizedCount(destinations.length, lang) }) : '',
    supporters && supporters > 0 ? t('stats.supporters', { count: localizedCount(supporters, lang) }) : '',
  ].filter(Boolean);

  return (
    <Card
      className={cn(
        'group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl p-4 transition-colors hover:border-foreground/30',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <IconTile icon={Icon} className="transition-colors group-hover:text-foreground" />
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-sm font-semibold leading-snug" dir={nameDir(option.title)}>
            {option.title}
          </h3>
          <p className="mt-0.5 break-words text-xs leading-snug text-muted-foreground" dir="auto">
            {t(`modes.${option.mode}`)}
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

        {meta.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
            {meta.map((line, index) => (
              <span key={line} className="flex items-center gap-2">
                {index > 0 && (
                  <span aria-hidden className="opacity-50">
                    ·
                  </span>
                )}
                <span className="tabular-nums">{line}</span>
              </span>
            ))}
          </p>
        )}

        {/* Price and action share the bottom edge, so cards of any text length align. */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          {!handlesMoney(option.mode) ? (
            // A gesture asks for attention, not money: no number and no unit here.
            <span className="text-sm font-semibold">{t('freePrice')}</span>
          ) : option.amount > 0 ? (
            <PriceTag amount={option.amount} currency={option.currency} className="text-sm font-semibold" />
          ) : (
            // An open amount still needs its unit: a number means nothing on its own.
            <span className="flex items-baseline gap-1.5 text-sm font-semibold">
              {t('anyPrice')}
              <span className="text-[11px] font-normal text-muted-foreground">{tp(option.currency)}</span>
            </span>
          )}
          <span className="relative z-[1]">{action}</span>
        </div>
      </div>
    </Card>
  );
}
