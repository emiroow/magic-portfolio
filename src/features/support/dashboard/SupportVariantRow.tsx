'use client';

import { Field } from '@/features/dashboard/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ACTION_PROVIDERS,
  CRYPTO_NETWORKS,
  DONATION_REGIONS,
  GATEWAY_IDS,
  MAX_VARIANT_INSTRUCTION,
  PLATFORM_PROVIDERS,
  assetsForNetwork,
  networksForAsset,
} from '@/features/support/constants';
import { CRYPTO_ASSETS, PRODUCT_CURRENCIES } from '@/constants/global';
import {
  numberField,
  type DonationRegister,
  type DonationVariant,
  type VariantErrors,
  type VariantField,
} from '@/features/support/hooks/useDonations';
import { handlesMoney } from '@/features/support/variants';
import { formatPrice, localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { DonationMode, DonationRegion, GatewayId } from '@/features/support/types';
import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

interface SupportVariantRowProps {
  index: number;
  mode: DonationMode;
  /** The method's own market, which a destination may override below. */
  region: DonationRegion;
  /** The row's own values, for the header and the amount chips to say what they hold. */
  variant?: DonationVariant;
  /** Whether this row holds a mistake, so its frame can say so. */
  broken: boolean;
  onRemove: () => void;
  /** Add a quick-pick to this destination's list. */
  onAddSuggested: (index: number, value: number) => void;
  /** Drop a quick-pick from this destination's list. */
  onRemoveSuggested: (index: number, pos: number) => void;
  /** Coin and ledger are picked together: each one narrows the other's list. */
  onAssetChange: (index: number, asset: string) => void;
  onNetworkChange: (index: number, network: string) => void;
  register: DonationRegister;
  errors?: VariantErrors;
  settings?: { gateways: GatewayId[] };
}

/**
 * One destination of a method in the dashboard form.
 *
 * The method decides which fields a destination has: a wallet asks for a coin, a chain
 * and an address, a card for the codes its market transfers with, a platform for a page,
 * a gesture for the page and the step to take on it — and nothing else ever appears on
 * the row. That is what keeps a half-built destination from reaching the public window
 * with fields it cannot use.
 */
const SupportVariantRow = ({
  index,
  mode,
  region,
  variant,
  broken,
  onRemove,
  onAddSuggested,
  onRemoveSuggested,
  onAssetChange,
  onNetworkChange,
  register,
  errors,
  settings,
}: SupportVariantRowProps) => {
  const t = useTranslations('dashboard.support.options');
  const ts = useTranslations('support');
  const tp = useTranslations('pricing');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  /** `variants.0.address`, typed so the field array's paths stay checked. */
  const path = (field: VariantField) => `variants.${index}.${field}` as const;
  const control = (field: VariantField) => `${path(field)}-input`;

  const gatewayMissing = (provider?: string) => Boolean(settings) && Boolean(provider) && !settings?.gateways.includes(provider as GatewayId);
  const off = variant?.active === false;
  const link = mode === 'platform' || mode === 'action';
  // The destination's own market decides what a card is asked for: a sheba and a
  // sixteen-digit card at home, an IBAN and its SWIFT code abroad.
  const domestic = (variant?.region || region) === 'ir';
  // The amount policy is edited here, per destination, because it belongs to the
  // destination — not to the method that carries it.
  const money = handlesMoney(mode);
  const suggested = variant?.suggestedAmounts ?? [];
  const assetField = register(path('asset'));
  const networkField = register(path('network'));
  const [pending, setPending] = useState('');

  const commitSuggested = () => {
    const value = Number(pending.replace(/[^\d]/g, ''));
    if (Number.isFinite(value) && value > 0) onAddSuggested(index, value);
    setPending('');
  };

  return (
    <div className={broken ? 'rounded-lg border border-destructive/50 bg-background p-3' : 'rounded-lg border bg-background p-3'}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
          <span aria-hidden className="flex size-5 items-center justify-center rounded-full border text-[10px] tabular-nums">
            {localizedCount(index + 1, lang)}
          </span>
          {off && <span className="truncate">{t('destinationOff')}</span>}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <label htmlFor={control('active')} className="flex min-h-8 cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input
              id={control('active')}
              type="checkbox"
              {...register(path('active'))}
              className="size-4 shrink-0 rounded border-input accent-primary"
            />
            {t('on')}
          </label>
          {index > 0 && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 shrink-0 hover:text-destructive"
              onClick={onRemove}
              aria-label={t('removeDestination')}
            >
              <X className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>

      <div className={off ? 'mt-3 space-y-4 opacity-60' : 'mt-3 space-y-4'}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {mode === 'platform' && (
            <>
              <Field label={t('platform')} id={control('provider')} error={errors?.provider?.message}>
                <select id={control('provider')} {...register(path('provider'))} className="control">
                  <option value="">—</option>
                  {PLATFORM_PROVIDERS.map(value => (
                    <option key={value} value={value}>
                      {ts(`providers.${value}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('page')} id={control('href')} error={errors?.href?.message} hint={t('pageHint')}>
                <Input id={control('href')} type="url" dir="ltr" {...register(path('href'))} placeholder={t('pagePlaceholder')} />
              </Field>
            </>
          )}

          {mode === 'card' && (
            <>
              <Field label={t('cardNumber')} id={control('number')} error={errors?.number?.message} hint={domestic ? undefined : t('panHint')}>
                <Input
                  id={control('number')}
                  inputMode="numeric"
                  dir="ltr"
                  className="tabular-nums"
                  placeholder={domestic ? t('cardNumberPlaceholder') : t('panPlaceholder')}
                  {...register(path('number'))}
                />
              </Field>
              <Field label={domestic ? t('sheba') : t('iban')} id={control('iban')} error={errors?.iban?.message}>
                <Input
                  id={control('iban')}
                  dir="ltr"
                  className="tabular-nums"
                  placeholder={domestic ? t('ibanPlaceholder') : t('ibanIntlPlaceholder')}
                  {...register(path('iban'))}
                />
              </Field>
              {/* A SWIFT code routes what an IBAN alone cannot reach, and inside Iran no
                  banking application reads one at all — so it belongs to one market only. */}
              {!domestic && (
                <Field label={t('bic')} id={control('bic')} error={errors?.bic?.message} optionalLabel={t('optional')}>
                  <Input id={control('bic')} dir="ltr" placeholder={t('bicPlaceholder')} {...register(path('bic'))} />
                </Field>
              )}
              <Field
                label={t('cardHolder')}
                id={control('holder')}
                error={errors?.holder?.message}
                optionalLabel={domestic ? t('optional') : undefined}
              >
                <Input id={control('holder')} dir="auto" placeholder={t('cardHolderPlaceholder')} {...register(path('holder'))} />
              </Field>
              <Field label={t('cardQr')} id={control('qrPayload')} error={errors?.qrPayload?.message} hint={t('cardQrHint')}>
                <Input id={control('qrPayload')} dir="ltr" placeholder="https://…" {...register(path('qrPayload'))} />
              </Field>
            </>
          )}

          {mode === 'crypto' && (
            <>
              {/* Coin and ledger are two questions with two answers. The lists narrow each
                  other, so the pair on the row is one a wallet can actually pay. */}
              <Field label={t('asset')} id={control('asset')} error={errors?.asset?.message} hint={t('assetHint')}>
                <select
                  id={control('asset')}
                  {...assetField}
                  className="control"
                  onChange={event => {
                    assetField.onChange(event);
                    onAssetChange(index, event.target.value);
                  }}
                >
                  <option value="">—</option>
                  {assetsForNetwork(variant?.network || undefined, CRYPTO_ASSETS).map(value => (
                    <option key={value} value={value}>
                      {tp(value)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('cryptoNetwork')} id={control('network')} error={errors?.network?.message} hint={t('networkHint')}>
                <select
                  id={control('network')}
                  {...networkField}
                  className="control"
                  onChange={event => {
                    networkField.onChange(event);
                    onNetworkChange(index, event.target.value);
                  }}
                >
                  <option value="">—</option>
                  {networksForAsset(variant?.asset || undefined, CRYPTO_NETWORKS).map(value => (
                    <option key={value} value={value}>
                      {ts(`networks.${value}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('cryptoAddress')} id={control('address')} error={errors?.address?.message}>
                <Input id={control('address')} dir="ltr" {...register(path('address'))} placeholder={t('cryptoAddressPlaceholder')} />
              </Field>
            </>
          )}

          {mode === 'gateway' && (
            <Field
              label={t('gateway')}
              id={control('provider')}
              error={errors?.provider?.message}
              hint={gatewayMissing(variant?.provider) ? t('gatewayMissing') : t('gatewayHint')}
            >
              <select
                id={control('provider')}
                {...register(path('provider'))}
                className="control"
                aria-invalid={gatewayMissing(variant?.provider) || undefined}
              >
                <option value="">—</option>
                {GATEWAY_IDS.map(value => (
                  <option key={value} value={value}>
                    {ts(`providers.${value}`)}
                    {settings ? (settings.gateways.includes(value) ? ' ✓' : ' ✕') : ''}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {mode === 'action' && (
            <>
              <Field label={t('actionNetwork')} id={control('provider')} error={errors?.provider?.message}>
                <select id={control('provider')} {...register(path('provider'))} className="control">
                  <option value="">—</option>
                  {ACTION_PROVIDERS.map(value => (
                    <option key={value} value={value}>
                      {ts(`providers.${value}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('actionPage')} id={control('href')} error={errors?.href?.message} hint={t('actionPageHint')}>
                <Input id={control('href')} type="url" dir="ltr" {...register(path('href'))} placeholder={t('actionPagePlaceholder')} />
              </Field>
            </>
          )}

          {/* The one thing the supporter has to do once they are there, in the owner's words. */}
          {link && (
            <Field
              label={t('stepInstruction')}
              id={control('instruction')}
              error={errors?.instruction?.message}
              hint={t('stepInstructionHint')}
              optionalLabel={t('optional')}
            >
              <Input
                id={control('instruction')}
                dir="auto"
                maxLength={MAX_VARIANT_INSTRUCTION}
                {...register(path('instruction'))}
                placeholder={t('stepInstructionPlaceholder')}
              />
            </Field>
          )}
        </div>

        {/* What the market actually asks for, said once rather than in every hint. */}
        {mode === 'card' && <p className="text-xs leading-relaxed text-muted-foreground">{t(domestic ? 'cardIrHint' : 'cardGlobalHint')}</p>}

        {/* What the supporter sees, and the two cases where a destination differs
            from its method: the unit it is priced in and the market it serves. */}
        <div className="grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-3">
          <Field
            label={t('destinationName')}
            id={control('label')}
            error={errors?.label?.message}
            hint={t('destinationNameHint')}
            optionalLabel={t('optional')}
          >
            <Input id={control('label')} dir="auto" {...register(path('label'))} placeholder={t('destinationNamePlaceholder')} />
          </Field>
          {/* A wallet has no unit to choose: it is priced in the coin it receives. */}
          {mode === 'crypto' ? (
            <p className="self-end text-xs leading-relaxed text-muted-foreground">{t('cryptoCurrencyNote')}</p>
          ) : (
            <Field label={t('currencyOverride')} id={control('currency')} optionalLabel={t('optional')}>
              <select id={control('currency')} {...register(path('currency'))} className="control">
                <option value="">{t('inherit')}</option>
                {PRODUCT_CURRENCIES.map(code => (
                  <option key={code} value={code}>
                    {tp(code)}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label={t('regionOverride')} id={control('region')} optionalLabel={t('optional')}>
            <select id={control('region')} {...register(path('region'))} className="control">
              <option value="">{t('inherit')}</option>
              {DONATION_REGIONS.map(value => (
                <option key={value} value={value}>
                  {ts(`regions.${value}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* This destination's own amount policy: what it costs, its bounds, whether the
            supporter may name a number and which quick-picks it offers. Hidden for a
            method that takes no money, so nothing reads a leftover number as a price. */}
        {money && (
          <div className="space-y-4 border-t pt-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label={t('amount')} id={control('amount')} error={errors?.amount?.message} hint={t('amountHint')}>
                <Input
                  id={control('amount')}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  dir="ltr"
                  className="tabular-nums"
                  {...register(path('amount'), numberField)}
                />
              </Field>
              <Field label={t('minAmount')} id={control('minAmount')} error={errors?.minAmount?.message} hint={t('minAmountHint')}>
                <Input
                  id={control('minAmount')}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  dir="ltr"
                  className="tabular-nums"
                  {...register(path('minAmount'), numberField)}
                />
              </Field>
              <Field label={t('maxAmount')} id={control('maxAmount')} error={errors?.maxAmount?.message} hint={t('maxAmountHint')}>
                <Input
                  id={control('maxAmount')}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  dir="ltr"
                  className="tabular-nums"
                  {...register(path('maxAmount'), numberField)}
                />
              </Field>
            </div>

            <label htmlFor={control('customAmount')} className="flex min-h-8 cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
              <input
                id={control('customAmount')}
                type="checkbox"
                {...register(path('customAmount'))}
                className="size-4 shrink-0 rounded border-input accent-primary"
              />
              {t('customAmount')}
            </label>

            <Field label={t('suggested')} error={errors?.suggestedAmounts?.message} hint={t('suggestedHint')}>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  dir="ltr"
                  className="tabular-nums"
                  value={pending}
                  onChange={event => setPending(event.target.value)}
                  placeholder={t('suggestedPlaceholder')}
                  aria-label={t('suggestedPlaceholder')}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      commitSuggested();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={commitSuggested}>
                  {t('add')}
                </Button>
              </div>
              {suggested.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {suggested.map((value, pos) => (
                    <li key={`${value}-${pos}`}>
                      <Badge variant="secondary" onDelete={() => onRemoveSuggested(index, pos)}>
                        {/* Amounts are numeric runs: grouping must never mirror. */}
                        <bdi dir="ltr">{formatPrice(value, lang)}</bdi>
                        {variant?.currency && <span className="ms-1 opacity-70">{tp(variant.currency)}</span>}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Field>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportVariantRow;
