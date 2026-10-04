'use client';

import { CheckboxField, EmptyState, ErrorState, Field, FormPanel, LoadingRows, SectionShell } from '@/components/dashboard/shared';
import DonationRow from '@/components/dashboard/Donation-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import { Textarea } from '@/components/ui/textarea';
import { CRYPTO_NETWORKS, DONATION_MODES, DONATION_REGIONS, GATEWAY_IDS, HOME_SUPPORT_SLOTS, LINK_PROVIDERS, PRODUCT_CURRENCIES, REFERRAL_PROVIDERS } from '@/constants/global';
import useDonations from '@/hooks/dashboard/useDonations';
import { useFormPanel } from '@/hooks/dashboard/useFormPanel';
import { formatPrice, localizedCount, slugify } from '@/lib/utils';
import type { AppLocale, GatewayId, IDonation } from '@/types';
import { Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

/**
 * Buy-me-a-coffee section: the CRUD form for support options plus the list.
 *
 * One select decides which fields appear — an option only ever carries the
 * credentials of its own rail, which is what keeps the public checkout honest.
 */
const Donation = () => {
  const t = useTranslations('dashboard.donation');
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
    toggleFeatured,
    addSuggested,
    removeSuggested,
    startEdit,
    refetchDonations,
    onSubmit,
  } = useDonations();

  const panel = useFormPanel();
  const [amount, setAmount] = useState('');

  const title = watch('title');
  const editingId = watch('_id');
  const mode = watch('mode');
  const currency = watch('currency');
  const gateway = watch('gateway');
  const featured = watch('featured');
  const published = watch('active');
  const suggested = watch('suggestedAmounts') ?? [];

  // Home page picks, in the order the site renders them.
  const homePicks = (donations ?? []).filter(option => option.active && option.featured);
  const homePosition = (id?: string) => {
    const index = homePicks.findIndex(option => option._id === id);
    return index === -1 ? 0 : index + 1;
  };

  // Slots: the option being edited must not count against itself.
  const takenByOthers = homePicks.filter(option => option._id !== editingId).length;
  const slotsFull = takenByOthers >= HOME_SUPPORT_SLOTS;
  const openSlots = Math.max(HOME_SUPPORT_SLOTS - takenByOthers - (featured ? 1 : 0), 0);
  const featuredHint = !published
    ? t('featuredNeedsPublish')
    : slotsFull && !featured
      ? t('featuredFull')
      : featured && openSlots === 0
        ? t('featuredAllUsed')
        : t('featuredHint', { count: localizedCount(openSlots, lang) });

  const autoSlug = !editingId && title ? slugify(title) : watch('slug');

  /** The gateway select warns instead of failing quietly at checkout. */
  const gatewayUnconfigured = Boolean(gateway) && Boolean(settings) && !settings?.gateways.includes(gateway as GatewayId);

  const closeForm = () => {
    panel.close();
    reset();
    setAmount('');
  };

  const beginCreate = () => {
    reset();
    panel.open();
  };

  const beginEdit = (option: IDonation) => {
    startEdit(option);
    panel.open();
  };

  const commitAmount = () => {
    const value = Number(amount.replace(/[^\d]/g, ''));
    if (Number.isFinite(value) && value > 0) addSuggested(value);
    setAmount('');
  };

  return (
    <SectionShell
      title={t('title')}
      anchorRef={panel.anchorRef}
      action={
        !panel.isOpen && (
          <Button size="icon" variant="outline" className="size-8" onClick={beginCreate} aria-label={t('addOption')}>
            <Plus className="size-4" aria-hidden />
          </Button>
        )
      }
    >
      <FormPanel open={panel.isOpen} title={editingId ? t('editOption') : t('createOption')} onClose={closeForm}>
        <form
          onSubmit={handleSubmit(data =>
            onSubmit({ ...data, slug: autoSlug, featured: data.active && Boolean(data.featured) }, panel.close)
          )}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('optionTitle')} id="donation-title" error={errors.title?.message}>
              <Input id="donation-title" {...register('title')} placeholder={t('optionTitlePlaceholder')} />
            </Field>
            <Field label={t('optionSlug')} id="donation-slug" error={errors.slug?.message} hint={t('optionSlugHint')}>
              <Input
                id="donation-slug"
                value={autoSlug ?? ''}
                onChange={event => setValue('slug', event.target.value, { shouldValidate: true, shouldDirty: true })}
                placeholder={t('optionSlugPlaceholder')}
                dir="ltr"
              />
            </Field>
            <Field label={t('mode')} id="donation-mode" error={errors.mode?.message} hint={t('modeHint')}>
              <select id="donation-mode" {...register('mode')} className="control">
                {DONATION_MODES.map(value => (
                  <option key={value} value={value}>
                    {ts(`modes.${value}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('region')} id="donation-region" error={errors.region?.message} hint={t('regionHint')}>
              <select id="donation-region" {...register('region')} className="control">
                {DONATION_REGIONS.map(value => (
                  <option key={value} value={value}>
                    {ts(`regions.${value}`)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* The rail decides everything below it: only its own fields are shown. */}
          {mode === 'referral' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('platform')} id="donation-referral" error={errors.referral?.message} hint={t('platformHint')}>
                <select id="donation-referral" {...register('referral')} className="control">
                  <option value="">—</option>
                  {REFERRAL_PROVIDERS.map(value => (
                    <option key={value} value={value}>
                      {ts(`providers.${value}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('link')} id="donation-href" error={errors.href?.message} hint={t('linkHint')}>
                <Input id="donation-href" type="url" dir="ltr" {...register('href')} placeholder={t('linkPlaceholder')} />
              </Field>
            </div>
          )}

          {mode === 'link' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('gateway')} id="donation-link-provider" error={errors.linkProvider?.message} hint={t('platformHint')}>
                <select id="donation-link-provider" {...register('linkProvider')} className="control">
                  <option value="">—</option>
                  {LINK_PROVIDERS.map(value => (
                    <option key={value} value={value}>
                      {ts(`providers.${value}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('link')} id="donation-href" error={errors.href?.message} hint={t('linkHint')}>
                <Input id="donation-href" type="url" dir="ltr" {...register('href')} placeholder={t('linkPlaceholder')} />
              </Field>
            </div>
          )}

          {mode === 'card' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('cardNumber')} id="donation-card-number" error={errors.card?.number?.message} hint={t('cardHint')}>
                <Input
                  id="donation-card-number"
                  inputMode="numeric"
                  dir="ltr"
                  className="tabular-nums"
                  placeholder={t('cardNumberPlaceholder')}
                  {...register('card.number')}
                />
              </Field>
              <Field label={t('iban')} id="donation-card-iban" error={errors.card?.iban?.message}>
                <Input id="donation-card-iban" dir="ltr" className="tabular-nums" placeholder={t('ibanPlaceholder')} {...register('card.iban')} />
              </Field>
              <Field label={t('cardHolder')} id="donation-card-holder">
                <Input id="donation-card-holder" dir="auto" placeholder={t('cardHolderPlaceholder')} {...register('card.holder')} />
              </Field>
              <Field label={t('cardQr')} id="donation-card-qr" error={errors.cardQrPayload?.message} hint={t('cardQrHint')}>
                <Input id="donation-card-qr" dir="ltr" placeholder="https://…" {...register('cardQrPayload')} />
              </Field>
            </div>
          )}

          {mode === 'crypto' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('cryptoNetwork')} id="donation-crypto-network" error={errors.crypto?.network?.message} hint={t('cryptoNetworkHint')}>
                <select id="donation-crypto-network" {...register('crypto.network')} className="control">
                  <option value="">—</option>
                  {CRYPTO_NETWORKS.map(value => (
                    <option key={value} value={value}>
                      {ts(`networks.${value}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('cryptoAddress')} id="donation-crypto-address" error={errors.crypto?.address?.message} hint={t('cryptoAddressHint')}>
                <Input id="donation-crypto-address" dir="ltr" {...register('crypto.address')} placeholder={t('cryptoAddressPlaceholder')} />
              </Field>
            </div>
          )}

          {mode === 'gateway' && (
            <Field
              label={t('gateway')}
              id="donation-gateway"
              error={errors.gateway?.message}
              hint={gatewayUnconfigured ? t('gatewayMissing') : t('gatewayHint')}
            >
              <select id="donation-gateway" {...register('gateway')} className="control" aria-invalid={gatewayUnconfigured || undefined}>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={t('amount')} id="donation-amount" error={errors.amount?.message} hint={t('amountHint')}>
              <Input
                id="donation-amount"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                dir="ltr"
                className="tabular-nums"
                {...register('amount', { valueAsNumber: true })}
              />
            </Field>
            <Field label={t('currency')} id="donation-currency" error={errors.currency?.message}>
              <select id="donation-currency" {...register('currency')} className="control">
                {PRODUCT_CURRENCIES.map(code => (
                  <option key={code} value={code}>
                    {tp(code)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('minAmount')} id="donation-min" error={errors.minAmount?.message} hint={t('minAmountHint')}>
              <Input
                id="donation-min"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                dir="ltr"
                className="tabular-nums"
                {...register('minAmount', { valueAsNumber: true })}
              />
            </Field>
            <Field label={t('maxAmount')} id="donation-max" error={errors.maxAmount?.message} hint={t('maxAmountHint')}>
              <Input
                id="donation-max"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                dir="ltr"
                className="tabular-nums"
                {...register('maxAmount', { valueAsNumber: true })}
              />
            </Field>
            <Field label={t('cups')} id="donation-cups" error={errors.cups?.message} hint={t('cupsHint')}>
              <Input
                id="donation-cups"
                type="number"
                min={1}
                max={12}
                step={1}
                inputMode="numeric"
                dir="ltr"
                className="tabular-nums"
                {...register('cups', { valueAsNumber: true })}
              />
            </Field>
            <Field label={t('goal')} id="donation-goal" error={errors.goal?.message} hint={t('goalHint')}>
              <Input
                id="donation-goal"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                dir="ltr"
                className="tabular-nums"
                {...register('goal', { valueAsNumber: true })}
              />
            </Field>
            <Field label={t('order')} id="donation-order" error={errors.order?.message} hint={t('orderHint')}>
              <Input
                id="donation-order"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                dir="ltr"
                className="tabular-nums"
                {...register('order', { valueAsNumber: true })}
              />
            </Field>
            <CheckboxField id="donation-custom-amount" label={t('customAmount')} hint={t('customAmountHint')} {...register('customAmount')} />
          </div>

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

          <Field label={t('optionDescription')} id="donation-description" error={errors.description?.message} hint={t('optionDescriptionHint')}>
            <Textarea
              id="donation-description"
              rows={3}
              {...register('description')}
              placeholder={t('optionDescriptionPlaceholder')}
              dir="auto"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CheckboxField
              id="donation-active"
              label={t('active')}
              hint={t('activeHint')}
              {...register('active')}
              onChange={event => {
                setValue('active', event.target.checked, { shouldDirty: true, shouldValidate: true });
                // An unpublished option cannot hold a home page slot.
                if (!event.target.checked) setValue('featured', false, { shouldDirty: true });
              }}
            />
            <CheckboxField
              id="donation-featured"
              label={t('featured')}
              hint={featuredHint}
              {...register('featured')}
              disabled={!published || (slotsFull && !featured)}
            />
            <CheckboxField id="donation-recurring" label={t('recurring')} hint={t('recurringHint')} {...register('recurring')} />
          </div>

          <div className="flex gap-2 max-sm:flex-col">
            <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto">
              {save.isPending ? <Loading size="sm" className="me-2" /> : null}
              {editingId ? t('update') : t('create')}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm} className="w-full sm:w-auto">
              {t('cancel')}
            </Button>
          </div>
        </form>
      </FormPanel>

      {isPending ? (
        <LoadingRows />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchDonations()} />
      ) : donations && donations.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {t('homeSlots', {
              used: localizedCount(homePicks.length, lang),
              total: localizedCount(HOME_SUPPORT_SLOTS, lang),
            })}
          </p>
          {donations.map(option => (
            <DonationRow
              key={option._id}
              option={option}
              onEdit={beginEdit}
              onDelete={id => deleteDonation(id)}
              isDeleting={deleting}
              homePosition={homePosition(option._id)}
              slotsFull={homePicks.length >= HOME_SUPPORT_SLOTS}
              onToggleHome={item => toggleFeatured.mutate(item)}
              togglingHome={toggleFeatured.isPending}
              onToggleActive={item => toggleActive.mutate(item)}
              togglingActive={toggleActive.isPending}
            />
          ))}
        </div>
      ) : (
        !panel.isOpen && <EmptyState text={t('noOptions')} actionText={t('createFirstOption')} onAction={beginCreate} />
      )}
    </SectionShell>
  );
};

export default Donation;
