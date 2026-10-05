'use client';

import { PriceTag } from '@/components/products/price-tag';
import { storedVariantName, nameDir } from '@/components/support/support-meta';
import { Tag } from '@/components/support/support-tile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SUPPORTER_PAGE_SIZE } from '@/constants/global';
import { cn, formatYearMonthLocal, localizedCount } from '@/lib/utils';
import type { AppLocale, ISupporter } from '@/types';
import { HandHeart } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

/**
 * The supporters wall: confirmed gifts, most recent first.
 *
 * Anonymous gifts still take their place — the monogram and the label say so, and
 * the name never reaches the browser in the first place (the data layer drops it).
 * Messages are shown only where the supporter allowed it.
 *
 * A card here is drawn with the same parts as a payment method card — the framed
 * mark, the hairline footer, the trailing tags — so the two lists read as one system.
 */
export function SupporterWall({ supporters }: { supporters: ISupporter[] }) {
  const t = useTranslations('support.wall');
  const locale = useLocale();
  const [visible, setVisible] = useState(SUPPORTER_PAGE_SIZE);

  if (!supporters.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
        <span aria-hidden className="flex size-10 items-center justify-center rounded-lg border bg-muted/40">
          <HandHeart className="size-4 text-muted-foreground" />
        </span>
        <p className="max-w-sm px-6 text-sm text-muted-foreground">{t('empty')}</p>
      </div>
    );
  }

  const shown = supporters.slice(0, visible);
  const hidden = supporters.length - shown.length;

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((supporter, index) => (
          <SupporterCard key={supporter._id ?? `${supporter.name}-${index}`} supporter={supporter} locale={locale} />
        ))}
      </ul>

      {hidden > 0 && (
        <div className="flex justify-center pt-1">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setVisible(value => value + SUPPORTER_PAGE_SIZE)}>
            {t('more', { count: localizedCount(hidden, locale === 'fa' ? 'fa' : 'en') })}
          </Button>
        </div>
      )}
    </div>
  );
}

/** One card on the wall: who, how much, on which method, when, and what they said. */
export function SupporterCard({ supporter, locale, className }: { supporter: ISupporter; locale: string; className?: string }) {
  const t = useTranslations('support');
  const tw = useTranslations('support.wall');
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';
  const name = supporter.anonymous ? '' : supporter.name?.trim() || '';
  const display = name || tw('anonymous');
  const monogram = display.charAt(0).toUpperCase();

  return (
    <li className={cn('h-full', className)}>
      <Card className="flex h-full flex-col gap-3 rounded-xl p-4 transition-colors hover:border-foreground/30">
        <div className="flex items-start gap-3">
          {/* Initial instead of an avatar: no third-party image host is involved. */}
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-sm font-bold text-muted-foreground"
          >
            {monogram}
          </span>
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-semibold leading-snug" dir={nameDir(display)}>
              {display}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {t(`modes.${supporter.mode}`)}
              {supporter.variantLabel && (
                <>
                  <span aria-hidden className="mx-1.5">
                    ·
                  </span>
                  <span dir={nameDir(supporter.variantLabel)}>{storedVariantName(supporter.variantLabel, t)}</span>
                </>
              )}
            </p>
          </div>
          <Tag className="mt-0.5">{formatYearMonthLocal(supporter.createdAt, lang)}</Tag>
        </div>

        {supporter.message && (
          <blockquote className="line-clamp-3 text-pretty text-xs leading-relaxed text-muted-foreground" dir="auto">
            {supporter.message}
          </blockquote>
        )}

        {/* The amount keeps the bottom edge, exactly where a method card keeps its price. */}
        <div className="mt-auto border-t pt-3">
          <PriceTag amount={supporter.amount} currency={supporter.currency} className="text-sm font-semibold" />
        </div>
      </Card>
    </li>
  );
}
