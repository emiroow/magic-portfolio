'use client';

import { ChoiceGroup } from '@/components/support/steps/step-parts';
import { MODE_ICONS, choiceRegion, nameDir, variantDetail, variantInstruction, variantLabel } from '@/components/support/support-meta';
import { ChoiceTile } from '@/components/support/support-tile';
import { PriceTag } from '@/components/products/price-tag';
import { Input } from '@/components/ui/input';
import { cn, documentKey, formatPrice, localizedCount } from '@/lib/utils';
import { handlesMoney, variantCurrency } from '@/lib/support';
import type { AppLocale, IDonation, ProductCurrency, SupportVariant } from '@/types';
import { Info } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface ChooseStepProps {
  /** The methods this window offers to choose between; empty when it belongs to one. */
  choices: IDonation[];
  option: IDonation;
  /** Only the destinations of `option`; nothing else can ever be listed here. */
  destinations: SupportVariant[];
  variant?: SupportVariant;
  /** `false` for a free gesture: there is no amount to pick and no price to show. */
  money: boolean;
  /** The destinations of this method span both markets, so each has to say which is whose. */
  mixedMarkets: boolean;
  quickAmounts: number[];
  amount: number;
  custom: string;
  showCustomField: boolean;
  currency: ProductCurrency;
  amountError: string | null;
  onPickMethod: (method: IDonation) => void;
  onPickVariant: (variant: SupportVariant) => void;
  onPickAmount: (value: number) => void;
  onCustom: (value: string) => void;
}

/**
 * The first stop: the way the support travels, the place it lands and the number.
 *
 * The groups are stacked in the order they are decided, and the destination list is
 * drawn inside its method instead of beside it, so a supporter cannot pick an account
 * that belongs to another item. The method list appears only in the box that asks for
 * a choice: a card's own window shows that card's destinations and nothing else.
 */
export function ChooseStep({
  choices,
  option,
  destinations,
  variant,
  money,
  mixedMarkets,
  quickAmounts,
  amount,
  custom,
  showCustomField,
  currency,
  amountError,
  onPickMethod,
  onPickVariant,
  onPickAmount,
  onCustom,
}: ChooseStepProps) {
  const t = useTranslations('support');
  const td = useTranslations('support.dialog');
  const tp = useTranslations('pricing');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  /** The words that follow a name: what it holds, in which unit, in which market. */
  const join = (parts: (string | undefined)[]) => parts.filter(Boolean).join(' · ');
  const destinationName = variantLabel(variant, t) || variantDetail(variant) || option.title;
  const instruction = variantInstruction(variant);
  /** The bounds the method sets, said once, in the unit the amount is written in. */
  const bounds = join([
    option.minAmount > 0 ? td('min', { amount: `${formatPrice(option.minAmount, lang)} ${tp(currency)}` }) : '',
    option.maxAmount > 0 ? td('max', { amount: `${formatPrice(option.maxAmount, lang)} ${tp(currency)}` }) : '',
  ]);

  return (
    <div className="space-y-5">
      {/* 1 — the way the support travels. Only the chooser box has several to pick from. */}
      {choices.length > 1 && (
        <ChoiceGroup legend={td('chooseMethod')}>
          {choices.map(method => {
            const Icon = MODE_ICONS[method.mode];
            const modeLabel = t(`modes.${method.mode}`);
            // Each tile speaks for its own method: a price in its own unit, or the
            // fact that a gesture has none.
            const detail = join([
              method.title.trim() === modeLabel ? '' : modeLabel,
              handlesMoney(method.mode) ? tp(method.currency) : t('freePrice'),
            ]);

            return (
              <ChoiceTile
                key={documentKey(method) || method.title}
                group="support-method"
                value={documentKey(method)}
                label={method.title}
                detail={detail}
                icon={Icon}
                checked={method._id === option._id}
                onChange={() => onPickMethod(method)}
              />
            );
          })}
        </ChoiceGroup>
      )}

      {/* 2 — where it lands, nested under the method it belongs to. */}
      {destinations.length > 1 ? (
        <ChoiceGroup
          legend={td('destinationsFor', { method: option.title })}
          count={t('destinations', { count: localizedCount(destinations.length, lang) })}
          nested
        >
          {destinations.map(item => {
            const detail = variantDetail(item);
            // The digits or the host become the name when the owner gave none.
            const label = variantLabel(item, t) || detail || item.key;
            const region = mixedMarkets ? t(`regions.${choiceRegion({ option, variant: item })}`) : '';

            return (
              <ChoiceTile
                key={item.key}
                group="support-destination"
                value={item.key}
                label={label}
                detail={join([label === detail ? '' : detail, money ? tp(variantCurrency(option, item)) : '', region])}
                checked={item.key === variant?.key}
                onChange={() => onPickVariant(item)}
              />
            );
          })}
        </ChoiceGroup>
      ) : (
        <p className="flex flex-wrap items-baseline gap-x-2 border-s-2 border-border ps-3 text-xs text-muted-foreground">
          <span className="font-medium">{money ? td('destination') : td('actionWhere')}</span>
          <span className="min-w-0 text-foreground" dir={nameDir(destinationName)}>
            {destinationName}
          </span>
          {money && <span className="opacity-80">{tp(variantCurrency(option, variant))}</span>}
        </p>
      )}

      {/* The one step the destination asks for, said in the owner's own words. */}
      {instruction && (
        <p className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span dir="auto">{instruction}</span>
        </p>
      )}

      {/* 3 — how much, or the reason there is no number at all. */}
      {money ? (
        <div className="space-y-4 border-t pt-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground">{td('total')}</p>
            {/* Nothing picked yet is not zero: a dash says “not decided” more honestly. */}
            {amount > 0 ? (
              <PriceTag amount={amount} currency={currency} className="text-lg font-bold" />
            ) : (
              <span aria-hidden className="text-lg font-bold text-muted-foreground/40">
                —
              </span>
            )}
          </div>

          {quickAmounts.length > 0 && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={td('quickPick')}>
              {quickAmounts.map(value => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={amount === value}
                  onClick={() => onPickAmount(value)}
                  className={cn(
                    'inline-flex shrink-0 items-baseline gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    amount === value
                      ? 'border-foreground bg-foreground text-background'
                      : 'text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                  )}
                >
                  <bdi dir="ltr">{formatPrice(value, lang)}</bdi>
                  <span className="text-[0.75em] opacity-70">{tp(currency)}</span>
                </button>
              ))}
            </div>
          )}

          {showCustomField && (
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">{td('customAmount')}</span>
              <span className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  dir="ltr"
                  className="tabular-nums"
                  placeholder={t('flexible.customPlaceholder')}
                  value={custom}
                  onChange={event => onCustom(event.target.value)}
                  aria-invalid={Boolean(amountError)}
                  aria-describedby={bounds ? 'support-amount-bounds' : undefined}
                />
                <span className="shrink-0 text-xs text-muted-foreground">{tp(currency)}</span>
              </span>
            </label>
          )}

          {bounds && (
            <p id="support-amount-bounds" className="text-xs text-muted-foreground/80">
              {bounds}
            </p>
          )}

          {amountError && (
            <p role="alert" className="text-xs text-destructive">
              {amountError}
            </p>
          )}
        </div>
      ) : (
        <p className="flex items-start gap-2 border-t pt-5 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {td('freeNote')}
        </p>
      )}
    </div>
  );
}
