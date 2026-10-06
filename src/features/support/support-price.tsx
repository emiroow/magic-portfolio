'use client';

import { PriceTag } from '@/features/products/price-tag';
import { optionCurrencies } from '@/features/support/support-meta';
import { handlesMoney, takesOpenAmount, usableVariants, variantCurrency, variantQuickAmounts } from '@/features/support/variants';
import { cn, localizedList } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IDonation } from '@/features/support/types';
import { useLocale, useTranslations } from 'next-intl';

interface SupportPriceProps {
  option: IDonation;
  className?: string;
}

/**
 * What a method asks for: a number, the fact that the number is the supporter's to
 * name, or nothing at all.
 *
 * Price and unit belong to a destination, never to the method, so the line is read
 * through the destination a supporter is offered first — the only one a card or a
 * list row can speak for before anything is picked. An open amount lists every unit
 * the method takes an open amount in, since one title can hold a dollar page and a
 * toman card and must not promise one of them alone. The card on `/support` and the
 * dashboard's list of methods both draw from here, so the same document can never
 * read differently on the two.
 */
export function SupportPrice({ option, className }: SupportPriceProps) {

console.log({ option, className });
  const t = useTranslations('support');
  const tp = useTranslations('pricing');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  if (!handlesMoney(option.mode)) {
    // A gesture asks for attention, not money: no number and no unit here.
    return <span className={cn('text-sm font-semibold', className)}>{t('freePrice')}</span>;
  }

  const target = usableVariants(option)[0];
  const unit = variantCurrency(option, target);
  const fixed = target?.amount ?? 0;

  if (fixed > 0) return <PriceTag amount={fixed} currency={unit} className={cn('text-sm font-semibold', className)} />;

  // An open amount still needs its unit: a number means nothing on its own, and the
  // units of the destinations that take one are the only ones it can be named in.
  const open = optionCurrencies(option, takesOpenAmount).map(code => tp(code));
  const presets = variantQuickAmounts(target);

  if (takesOpenAmount(target) || !presets.length) {
    return (
      <span className={cn('flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-sm font-semibold', className)}>
        {t('anyPrice')}
        <span className="text-[0.75em] font-normal text-muted-foreground">{localizedList(open, lang)}</span>
      </span>
    );
  }

  // An open amount off and no fixed price leaves the destination taking only the
  // owner's own amounts, so the line names the smallest of them instead of any.
  return (
    <span className={cn('flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-sm font-semibold', className)}>
      <span className="text-[0.75em] font-normal text-muted-foreground">{t('fromPrice')}</span>
      <PriceTag amount={presets[0]} currency={unit} />
    </span>
  );
}
