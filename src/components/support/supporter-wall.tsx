'use client';

import { PriceTag } from '@/components/products/price-tag';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SUPPORTER_PAGE_SIZE } from '@/constants/global';
import { cn, formatYearMonthLocal, localizedCount } from '@/lib/utils';
import type { AppLocale, ISupporter } from '@/types';
import { Coffee } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

/**
 * The supporters wall: confirmed gifts, most recent first.
 *
 * Anonymous gifts still take their place — the monogram and the label say so,
 * and the name never reaches the browser in the first place (the data layer
 * drops it). Messages are shown only where the supporter allowed it.
 */
export function SupporterWall({ supporters }: { supporters: ISupporter[] }) {
  const t = useTranslations('support.wall');
  const locale = useLocale();
  const [visible, setVisible] = useState(SUPPORTER_PAGE_SIZE);

  if (!supporters.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
        <span aria-hidden className="flex size-11 items-center justify-center rounded-full border">
          <Coffee className="size-4 text-muted-foreground" />
        </span>
        <p className="max-w-sm px-6 text-sm text-muted-foreground">{t('empty')}</p>
      </div>
    );
  }

  const shown = supporters.slice(0, visible);
  const hidden = supporters.length - shown.length;

  return (
    <div className="space-y-4">
      <ul className="grid gap-3 sm:grid-cols-2">
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

/** One cup on the wall: who, how much, when, and what they said. */
export function SupporterCard({ supporter, locale, className }: { supporter: ISupporter; locale: string; className?: string }) {
  const t = useTranslations('support.wall');
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';
  const name = supporter.anonymous ? '' : supporter.name?.trim() || '';
  const display = name || t('anonymous');
  const monogram = display.charAt(0).toUpperCase();

  return (
    <li className={cn('h-full', className)}>
      <Card className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          {/* Initial instead of an avatar: no third-party image host is involved. */}
          <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-bold text-muted-foreground">
            {monogram}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-snug" dir="auto">
              {display}
            </p>
            <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-[11px] text-muted-foreground">
              <PriceTag amount={supporter.amount} currency={supporter.currency} className="font-medium" />
              <span aria-hidden>·</span>
              <span>{formatYearMonthLocal(supporter.createdAt, lang)}</span>
              {supporter.donationTitle && (
                <>
                  <span aria-hidden>·</span>
                  <span className="truncate" dir="auto">
                    {t('for', { title: supporter.donationTitle })}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {supporter.message && (
          <blockquote className="border-s-2 ps-3 text-xs leading-relaxed text-muted-foreground" dir="auto">
            {supporter.message}
          </blockquote>
        )}
      </Card>
    </li>
  );
}
