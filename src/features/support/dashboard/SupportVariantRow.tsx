'use client';

import { Field } from '@/features/dashboard/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ACTION_PROVIDERS,
  CRYPTO_NETWORKS,
  DONATION_REGIONS,
  GATEWAY_IDS,
  MAX_VARIANT_INSTRUCTION,
  PLATFORM_PROVIDERS,
} from '@/features/support/constants';
import { PRODUCT_CURRENCIES } from '@/constants/global';
import type { DonationRegister, VariantErrors, VariantField } from '@/features/support/hooks/useDonations';
import { localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { DonationMode, GatewayId } from '@/features/support/types';
import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface SupportVariantRowProps {
  index: number;
  mode: DonationMode;
  /** The row's own values, for the two things the header has to say about them. */
  variant?: { active?: boolean; provider?: string };
  /** Whether this row holds a mistake, so its frame can say so. */
  broken: boolean;
  onRemove: () => void;
  register: DonationRegister;
  errors?: VariantErrors;
  settings?: { gateways: GatewayId[] };
}

/**
 * One destination of a method in the dashboard form.
 *
 * The method decides which fields a destination has: a wallet asks for a chain and an
 * address, a card for digits, a platform for a page, a gesture for the page and the
 * step to take on it — and nothing else ever appears on the row. That is what keeps a
 * half-built destination from reaching the public window with fields it cannot use.
 */
const SupportVariantRow = ({ index, mode, variant, broken, onRemove, register, errors, settings }: SupportVariantRowProps) => {
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
              <Field label={t('cardNumber')} id={control('number')} error={errors?.number?.message}>
                <Input
                  id={control('number')}
                  inputMode="numeric"
                  dir="ltr"
                  className="tabular-nums"
                  placeholder={t('cardNumberPlaceholder')}
                  {...register(path('number'))}
                />
              </Field>
              <Field label={t('iban')} id={control('iban')} error={errors?.iban?.message}>
                <Input id={control('iban')} dir="ltr" className="tabular-nums" placeholder={t('ibanPlaceholder')} {...register(path('iban'))} />
              </Field>
              <Field label={t('cardHolder')} id={control('holder')} optionalLabel={t('optional')}>
                <Input id={control('holder')} dir="auto" placeholder={t('cardHolderPlaceholder')} {...register(path('holder'))} />
              </Field>
              <Field label={t('cardQr')} id={control('qrPayload')} error={errors?.qrPayload?.message} hint={t('cardQrHint')}>
                <Input id={control('qrPayload')} dir="ltr" placeholder="https://…" {...register(path('qrPayload'))} />
              </Field>
            </>
          )}

          {mode === 'crypto' && (
            <>
              <Field label={t('cryptoNetwork')} id={control('network')} error={errors?.network?.message}>
                <select id={control('network')} {...register(path('network'))} className="control">
                  <option value="">—</option>
                  {CRYPTO_NETWORKS.map(value => (
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
      </div>
    </div>
  );
};

export default SupportVariantRow;
