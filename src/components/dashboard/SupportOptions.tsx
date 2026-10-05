'use client';

import { CheckboxField, EmptyState, ErrorState, Field, FormPanel, LoadingRows, SectionShell } from '@/components/dashboard/shared';
import SupportOptionRow from '@/components/dashboard/SupportOptionCard';
import { MODE_ICONS } from '@/components/support/support-meta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import { Textarea } from '@/components/ui/textarea';
import { CRYPTO_NETWORKS, DONATION_MODES, DONATION_REGIONS, GATEWAY_IDS, PLATFORM_PROVIDERS, PRODUCT_CURRENCIES } from '@/constants/global';
import useDonations, { numberField } from '@/hooks/dashboard/useDonations';
import { useFormPanel } from '@/hooks/dashboard/useFormPanel';
import { formatPrice, localizedCount, slugify } from '@/lib/utils';
import { useValidationMessage } from '@/hooks/useValidationMessage';
import type { AppLocale, DonationMode, GatewayId, IDonation } from '@/types';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

/**
 * Field groups of the method form, in the order they are filled in.
 *
 * A payment method is one decision (which way money travels) plus the places it can
 * arrive at, so the form asks in that order and shows only the fields that decision
 * needs. The ids are the anchor a failed submit scrolls to.
 */
const GROUPS = [
  { id: 'identity', label: 'groupIdentity', anchor: 'support-title', fields: ['title', 'slug', 'description'] },
  { id: 'rail', label: 'groupRail', anchor: 'support-mode-group', fields: ['mode', 'region', 'variants'] },
  { id: 'amount', label: 'groupAmount', anchor: 'support-amount', fields: ['amount', 'currency', 'minAmount', 'maxAmount', 'suggestedAmounts'] },
  { id: 'publish', label: 'groupPublish', anchor: 'support-active', fields: ['active', 'order'] },
] as const;

type GroupId = (typeof GROUPS)[number]['id'];

/**
 * Payment methods: the CRUD form for the ways this project can be backed, plus the
 * list of them.
 *
 * One choice decides everything below it — a method only ever carries the
 * destinations of its own kind, which is what keeps the public checkout honest.
 */
const SupportOptions = () => {
  const t = useTranslations('dashboard.support.options');
  const ts = useTranslations('support');
  const tp = useTranslations('pricing');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    errors,
    donations,
    settings,
    isPending,
    isError,
    error,
    save,
    deleteDonation,
    deleting,
    toggleActive,
    addSuggested,
    removeSuggested,
    setMode,
    addVariant,
    removeVariant,
    variantFieldsArray: list,
    startEdit,
    refetchDonations,
    onSubmit,
  } = useDonations();

  const panel = useFormPanel();
  const tv = useValidationMessage();
  const [amount, setAmount] = useState('');
  /** The error summary only appears once a submit has been refused. */
  const [refused, setRefused] = useState(false);

  const title = watch('title');
  const editingId = watch('_id');
  const mode = watch('mode') as DonationMode;
  const currency = watch('currency');
  const suggested = watch('suggestedAmounts') ?? [];
  const variants = watch('variants') ?? [];

  /** Which groups still hold a mistake, so the summary can point at one. */
  const brokenGroups = useMemo(() => {
    const names = Object.keys(errors as Record<string, unknown>);
    return GROUPS.filter(group => group.fields.some(field => names.includes(field))).map(group => group.id);
  }, [errors]);

  const autoSlug = !editingId && title ? slugify(title) : watch('slug');

  const closeForm = () => {
    panel.close();
    reset();
    setAmount('');
    setRefused(false);
  };

  const beginCreate = () => {
    reset();
    setRefused(false);
    panel.open();
  };

  const beginEdit = (method: IDonation) => {
    startEdit(method);
    setRefused(false);
    panel.open();
  };

  const commitAmount = () => {
    const value = Number(amount.replace(/[^\d]/g, ''));
    if (Number.isFinite(value) && value > 0) addSuggested(value);
    setAmount('');
  };

  /** A refused submit says which step to go back to, and takes you there. */
  const focusGroup = (id: GroupId) => {
    const group = GROUPS.find(item => item.id === id);
    if (!group) return;

    const field = document.getElementById(group.anchor);
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) field.focus();
  };

  return (
    <SectionShell
      title={t('title')}
      anchorRef={panel.anchorRef}
      action={
        !panel.isOpen && (
          <Button size="sm" variant="outline" className="rounded-full" onClick={beginCreate}>
            <Plus className="me-2 size-4" aria-hidden />
            {t('addMethod')}
          </Button>
        )
      }
    >
      <FormPanel open={panel.isOpen} title={editingId ? t('editMethod') : t('createMethod')} onClose={closeForm}>
        <form
          onSubmit={handleSubmit(
            data => onSubmit({ ...data, slug: autoSlug }, panel.close),
            () => setRefused(true)
          )}
          className="space-y-8"
          noValidate
        >
          {refused && brokenGroups.length > 0 && (
            <div role="alert" className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/40 px-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2 text-xs text-destructive">
                <AlertTriangle className="size-4 shrink-0" aria-hidden />
                {t('fixErrors')}
              </span>
              <span className="flex flex-wrap gap-1.5">
                {brokenGroups.map(id => {
                  const group = GROUPS.find(item => item.id === id);
                  if (!group) return null;

                  return (
                    <Button key={id} type="button" size="sm" variant="outline" className="h-7 rounded-full px-2.5 text-[11px]" onClick={() => focusGroup(id)}>
                      {t(group.label)}
                    </Button>
                  );
                })}
              </span>
            </div>
          )}

          {/* 1 — what the method is */}
          <FormGroup id="support-title" index={1} title={t('groupIdentity')} description={t('groupIdentityHint')} broken={brokenGroups.includes('identity')}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('methodTitle')} id="support-title" error={errors.title?.message}>
                <Input id="support-title" {...register('title')} placeholder={t('methodTitlePlaceholder')} dir="auto" />
              </Field>
              <Field label={t('methodSlug')} id="support-slug" error={errors.slug?.message} hint={t('methodSlugHint')}>
                <Input
                  id="support-slug"
                  value={autoSlug ?? ''}
                  onChange={event => setValue('slug', event.target.value, { shouldValidate: true, shouldDirty: true })}
                  placeholder={t('methodSlugPlaceholder')}
                  dir="ltr"
                />
              </Field>
            </div>
            <Field label={t('methodDescription')} id="support-description" error={errors.description?.message} hint={t('methodDescriptionHint')}>
              <Textarea id="support-description" rows={3} {...register('description')} placeholder={t('methodDescriptionPlaceholder')} dir="auto" />
            </Field>
          </FormGroup>

          {/* 2 — how the money arrives, and where it lands */}
          <FormGroup id="support-mode-group" index={2} title={t('groupRail')} description={t('groupRailHint')} broken={brokenGroups.includes('rail')}>
            <div role="radiogroup" aria-label={t('chooseMethod')} className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {DONATION_MODES.map(value => {
                const Icon = MODE_ICONS[value];
                const active = mode === value;

                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMode(value)}
                    className={
                      active
                        ? 'flex min-h-11 items-center gap-2 rounded-lg border border-foreground bg-foreground px-3 py-2 text-start text-sm font-medium text-background transition-colors'
                        : 'flex min-h-11 items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-start text-sm font-medium transition-colors hover:border-foreground/40 hover:bg-muted/40'
                    }
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 truncate">{ts(`modes.${value}`)}</span>
                  </button>
                );
              })}
            </div>

            <Field label={t('region')} id="support-region" error={errors.region?.message} hint={t('regionHint')}>
              <select id="support-region" {...register('region')} className="control">
                {DONATION_REGIONS.map(value => (
                  <option key={value} value={value}>
                    {ts(`regions.${value}`)}
                  </option>
                ))}
              </select>
            </Field>

            {/* Destinations: the places this method can actually be paid into. */}
            <div className="space-y-3 rounded-lg border bg-muted/20 p-3 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold leading-tight">{t('destinations', { count: localizedCount(list.fields.length, lang) })}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('destinationsHint')}</p>
                </div>
                <Button type="button" size="sm" variant="outline" className="shrink-0 rounded-full" onClick={addVariant}>
                  <Plus className="me-1.5 size-3.5" aria-hidden />
                  {t('addDestination')}
                </Button>
              </div>

              {list.fields.map((field, index) => (
                <VariantRow
                  key={field.id}
                  index={index}
                  mode={mode}
                  variant={variants[index]}
                  broken={Boolean(errors.variants?.[index])}
                  onRemove={() => removeVariant(index)}
                  register={register}
                  errors={errors.variants?.[index]}
                  settings={settings}
                />
              ))}

              {errors.variants?.message && (
                <p role="alert" className="text-xs text-destructive">
                  {tv(String(errors.variants.message))}
                </p>
              )}
            </div>
          </FormGroup>

          {/* 3 — what it costs */}
          <FormGroup id="support-amount" index={3} title={t('groupAmount')} description={t('groupAmountHint')} broken={brokenGroups.includes('amount')}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={t('amount')} id="support-amount" error={errors.amount?.message} hint={t('amountHint')}>
                <Input id="support-amount" type="number" min={0} step={1} inputMode="numeric" dir="ltr" className="tabular-nums" {...register('amount', numberField)} />
              </Field>
              <Field label={t('currency')} id="support-currency" error={errors.currency?.message} hint={t('currencyHint')}>
                <select id="support-currency" {...register('currency')} className="control">
                  {PRODUCT_CURRENCIES.map(code => (
                    <option key={code} value={code}>
                      {tp(code)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('minAmount')} id="support-min" error={errors.minAmount?.message} hint={t('minAmountHint')}>
                <Input id="support-min" type="number" min={0} step={1} inputMode="numeric" dir="ltr" className="tabular-nums" {...register('minAmount', numberField)} />
              </Field>
              <Field label={t('maxAmount')} id="support-max" error={errors.maxAmount?.message} hint={t('maxAmountHint')}>
                <Input id="support-max" type="number" min={0} step={1} inputMode="numeric" dir="ltr" className="tabular-nums" {...register('maxAmount', numberField)} />
              </Field>
            </div>

            <CheckboxField id="support-custom-amount" label={t('customAmount')} hint={t('customAmountHint')} {...register('customAmount')} />

            {/* Quick-pick amounts, shown as chips on the supporter's amount step. */}
            <Field label={t('suggested')} error={errors.suggestedAmounts?.message} hint={t('suggestedHint')}>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  dir="ltr"
                  className="tabular-nums"
                  value={amount}
                  onChange={event => setAmount(event.target.value)}
                  placeholder={t('suggestedPlaceholder')}
                  aria-label={t('suggestedPlaceholder')}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      commitAmount();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={commitAmount}>
                  {t('add')}
                </Button>
              </div>
              {suggested.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {suggested.map((value, index) => (
                    <li key={`${value}-${index}`}>
                      <Badge variant="secondary" onDelete={() => removeSuggested(index)}>
                        {/* Amounts are numeric runs: grouping must never mirror. */}
                        <bdi dir="ltr">{formatPrice(value, lang)}</bdi>
                        <span className="ms-1 opacity-70">{tp(currency)}</span>
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Field>
          </FormGroup>

          {/* 4 — where it shows up */}
          <FormGroup id="support-active" index={4} title={t('groupPublish')} description={t('groupPublishHint')} broken={brokenGroups.includes('publish')}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CheckboxField
                id="support-active"
                label={t('active')}
                hint={t('activeHint')}
                {...register('active')}
                onChange={event => setValue('active', event.target.checked, { shouldDirty: true, shouldValidate: true })}
              />
              <Field label={t('order')} id="support-order" error={errors.order?.message} hint={t('orderHint')}>
                <Input id="support-order" type="number" min={0} max={999} step={1} inputMode="numeric" dir="ltr" className="tabular-nums" {...register('order', numberField)} />
              </Field>
            </div>
          </FormGroup>

          <div className="flex flex-wrap items-center gap-2 border-t pt-5 max-sm:flex-col sm:justify-between">
            <div className="flex w-full gap-2 max-sm:flex-col sm:w-auto">
              <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto">
                {save.isPending ? <Loading size="sm" className="me-2" /> : null}
                {editingId ? t('update') : t('create')}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm} className="w-full sm:w-auto">
                {t('cancel')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/80">{t('fieldsRequiredHint')}</p>
          </div>
        </form>
      </FormPanel>

      {isPending ? (
        <LoadingRows />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchDonations()} />
      ) : donations && donations.length > 0 ? (
        <div className="space-y-4">
          {donations.map(method => (
            <SupportOptionRow
              key={method._id}
              method={method}
              onEdit={beginEdit}
              onDelete={id => deleteDonation(id)}
              isDeleting={deleting}
              onToggleActive={item => toggleActive.mutate(item)}
              togglingActive={toggleActive.isPending}
            />
          ))}
        </div>
      ) : (
        !panel.isOpen && <EmptyState text={t('noMethods')} actionText={t('createFirstMethod')} onAction={beginCreate} />
      )}
    </SectionShell>
  );
};

/* --------------------------------- parts ---------------------------------- */

/** One numbered step of the form, with its own heading and error marker. */
function FormGroup({
  id,
  index,
  title,
  description,
  broken,
  children,
}: {
  /** Id of the step's first control, for the summary's jump link. */
  id: string;
  index: number;
  title: string;
  description: string;
  broken: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations('dashboard.support.options');

  return (
    <fieldset id={id} className="space-y-4 border-0 p-0">
      <legend className="mb-1 flex items-center gap-2.5">
        <span
          aria-hidden
          className={
            broken
              ? 'flex size-6 items-center justify-center rounded-full border border-destructive text-[11px] font-bold tabular-nums text-destructive'
              : 'flex size-6 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums text-muted-foreground'
          }
        >
          {index}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold leading-tight">{title}</span>
          <span className="block text-xs leading-relaxed text-muted-foreground">{description}</span>
        </span>
        <span className="sr-only">{t('stepOfFields', { current: index, title })}</span>
      </legend>
      <div className="space-y-4 sm:ps-8">{children}</div>
    </fieldset>
  );
}

/** Fields a destination row can hold, and the only paths its inputs register. */
type VariantField = 'label' | 'provider' | 'href' | 'number' | 'iban' | 'holder' | 'qrPayload' | 'network' | 'address' | 'currency' | 'region' | 'active';

type VariantErrors = Partial<Record<VariantField, { message?: string }>>;

/**
 * One destination row. The method decides which fields it shows: a wallet asks for a
 * chain and an address, a card for digits, a platform for a page — nothing else.
 */
function VariantRow({
  index,
  mode,
  variant,
  broken,
  onRemove,
  register,
  errors,
  settings,
}: {
  index: number;
  mode: DonationMode;
  variant?: { active?: boolean; provider?: string };
  broken: boolean;
  onRemove: () => void;
  register: ReturnType<typeof useDonations>['register'];
  errors?: VariantErrors;
  settings?: { gateways: GatewayId[] };
}) {
  const t = useTranslations('dashboard.support.options');
  const ts = useTranslations('support');
  const tp = useTranslations('pricing');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  /** `variants.0.address`, typed so the field array's paths stay checked. */
  const path = (field: VariantField) => `variants.${index}.${field}` as const;

  const gatewayMissing = (provider?: string) => Boolean(settings) && Boolean(provider) && !settings?.gateways.includes(provider as GatewayId);
  const off = variant?.active === false;

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
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
            <input type="checkbox" {...register(path('active'))} className="size-3.5 rounded border-input accent-primary" />
            {t('on')}
          </label>
          {index > 0 && (
            <Button type="button" size="icon" variant="ghost" className="size-7 hover:text-destructive" onClick={onRemove} aria-label={t('removeDestination')}>
              <X className="size-3.5" aria-hidden />
            </Button>
          )}
        </div>
      </div>

      <div className={off ? 'mt-3 space-y-4 opacity-60' : 'mt-3 space-y-4'}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {mode === 'platform' && (
            <>
              <Field label={t('platform')} id={`${path('provider')}-input`} error={errors?.provider?.message}>
                <select id={`${path('provider')}-input`} {...register(path('provider'))} className="control">
                  <option value="">—</option>
                  {PLATFORM_PROVIDERS.map(value => (
                    <option key={value} value={value}>
                      {ts(`providers.${value}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('page')} id={`${path('href')}-input`} error={errors?.href?.message} hint={t('pageHint')}>
                <Input id={`${path('href')}-input`} type="url" dir="ltr" {...register(path('href'))} placeholder={t('pagePlaceholder')} />
              </Field>
            </>
          )}

          {mode === 'card' && (
            <>
              <Field label={t('cardNumber')} id={`${path('number')}-input`} error={errors?.number?.message}>
                <Input id={`${path('number')}-input`} inputMode="numeric" dir="ltr" className="tabular-nums" placeholder={t('cardNumberPlaceholder')} {...register(path('number'))} />
              </Field>
              <Field label={t('iban')} id={`${path('iban')}-input`} error={errors?.iban?.message}>
                <Input id={`${path('iban')}-input`} dir="ltr" className="tabular-nums" placeholder={t('ibanPlaceholder')} {...register(path('iban'))} />
              </Field>
              <Field label={t('cardHolder')} id={`${path('holder')}-input`} optionalLabel={t('optional')}>
                <Input id={`${path('holder')}-input`} dir="auto" placeholder={t('cardHolderPlaceholder')} {...register(path('holder'))} />
              </Field>
              <Field label={t('cardQr')} id={`${path('qrPayload')}-input`} error={errors?.qrPayload?.message} hint={t('cardQrHint')}>
                <Input id={`${path('qrPayload')}-input`} dir="ltr" placeholder="https://…" {...register(path('qrPayload'))} />
              </Field>
            </>
          )}

          {mode === 'crypto' && (
            <>
              <Field label={t('cryptoNetwork')} id={`${path('network')}-input`} error={errors?.network?.message}>
                <select id={`${path('network')}-input`} {...register(path('network'))} className="control">
                  <option value="">—</option>
                  {CRYPTO_NETWORKS.map(value => (
                    <option key={value} value={value}>
                      {ts(`networks.${value}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('cryptoAddress')} id={`${path('address')}-input`} error={errors?.address?.message}>
                <Input id={`${path('address')}-input`} dir="ltr" {...register(path('address'))} placeholder={t('cryptoAddressPlaceholder')} />
              </Field>
            </>
          )}

          {mode === 'gateway' && (
            <Field label={t('gateway')} id={`${path('provider')}-input`} error={errors?.provider?.message} hint={gatewayMissing(variant?.provider) ? t('gatewayMissing') : t('gatewayHint')}>
              <select id={`${path('provider')}-input`} {...register(path('provider'))} className="control" aria-invalid={gatewayMissing(variant?.provider) || undefined}>
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
        </div>

        {/* What the supporter sees, and the two cases where a destination differs
            from its method: the unit it is priced in and the market it serves. */}
        <div className="grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-3">
          <Field label={t('destinationName')} id={`${path('label')}-input`} error={errors?.label?.message} hint={t('destinationNameHint')} optionalLabel={t('optional')}>
            <Input id={`${path('label')}-input`} dir="auto" {...register(path('label'))} placeholder={t('destinationNamePlaceholder')} />
          </Field>
          <Field label={t('currencyOverride')} id={`${path('currency')}-input`} optionalLabel={t('optional')}>
            <select id={`${path('currency')}-input`} {...register(path('currency'))} className="control">
              <option value="">{t('inherit')}</option>
              {PRODUCT_CURRENCIES.map(code => (
                <option key={code} value={code}>
                  {tp(code)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('regionOverride')} id={`${path('region')}-input`} optionalLabel={t('optional')}>
            <select id={`${path('region')}-input`} {...register(path('region'))} className="control">
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
}

export default SupportOptions;
