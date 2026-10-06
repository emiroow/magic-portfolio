'use client';

import { cn, formatPrice } from '@/lib/utils';
import type { AppLocale, PriceUnit } from '@/types';
import { useLocale, useTranslations } from 'next-intl';

interface PriceTagProps {
  /** Amount in whole units of `currency`; `0` renders as the localized "Free". */
  amount: number;
  /** A money of a country or the coin a wallet receives; both are labelled under `pricing`. */
  currency: PriceUnit;
  className?: string;
}

/**
 * A product price in the active locale.
 *
 * The digits are their own LTR run: Persian numbers are written left to right
 * inside right-to-left text, and an isolated run keeps the thousands separators
 * from reversing the groups (`۱۲۰٬۰۰۰`, never `۰۰۰٬۱۲۰`).
 */
export function PriceTag({ amount, currency, className }: PriceTagProps) {
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';
  const t = useTranslations('pricing');

  if (!Number.isFinite(amount) || amount <= 0) {
    return <span className={cn('inline-flex items-baseline', className)}>{t('free')}</span>;
  }

  return (
    <span className={cn('inline-flex items-baseline gap-1 tabular-nums', className)}>
      <bdi dir="ltr">{formatPrice(amount, lang)}</bdi>
      <span className="text-[0.75em] font-medium opacity-70">{t(currency)}</span>
    </span>
  );
}
