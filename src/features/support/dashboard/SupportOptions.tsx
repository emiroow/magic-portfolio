'use client';

import { CheckboxField, EmptyState, ErrorState, Field, FormPanel, LoadingRows, SectionShell } from '@/features/dashboard/shared';
import FormGroup from '@/features/support/dashboard/SupportFormGroup';
import SupportModePicker from '@/features/support/dashboard/SupportModePicker';
import SupportOptionRow from '@/features/support/dashboard/SupportOptionCard';
import SupportVariantRow from '@/features/support/dashboard/SupportVariantRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import { Textarea } from '@/components/ui/textarea';
import { DONATION_REGIONS } from '@/features/support/constants';
import { PRODUCT_CURRENCIES } from '@/constants/global';
import useDonations, { numberField } from '@/features/support/hooks/useDonations';
import { useFormPanel } from '@/hooks/useFormPanel';
import { localizedCount, slugify } from '@/lib/utils';
import { useValidationMessage } from '@/hooks/useValidationMessage';
import type { AppLocale } from '@/types';
import type { DonationMode, IDonation } from '@/features/support/types';
import { AlertTriangle, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

/**
 * Field groups of the method form, in the order they are filled in.
 *
 * A support method is one decision (which way the backing travels) plus the places it
 * can arrive at, so the form asks in that order and shows only the fields that
 * decision needs. The amount policy belongs to each destination and is edited inside
 * the destination rows, not in a group of its own. The ids are the anchor a failed
 * submit scrolls to.
 */
const GROUPS = [
  { id: 'identity', label: 'groupIdentity', anchor: 'support-title', fields: ['title', 'slug', 'description'] },
  { id: 'rail', label: 'groupRail', anchor: 'support-mode-group', fields: ['mode', 'region', 'currency', 'variants'] },
  { id: 'publish', label: 'groupPublish', anchor: 'support-active', fields: ['active', 'order'] },
] as const;

type GroupId = (typeof GROUPS)[number]['id'];

/**
 * Support methods: the CRUD form for the ways this project can be backed, plus the
 * list of them.
 *
 * This file composes the form; the parts of it that carry their own rules live beside
 * it — `SupportModePicker` for the decision that shapes everything below, and
 * `SupportVariantRow` for the destinations a method can be paid into. One method only
 * ever holds destinations of its own kind, which is what keeps the public window honest.
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
    addVariantSuggested,
    removeVariantSuggested,
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
  /** The error summary only appears once a submit has been refused. */
  const [refused, setRefused] = useState(false);

  const title = watch('title');
  const editingId = watch('_id');
  const mode = watch('mode') as DonationMode;
  const variants = watch('variants') ?? [];

  // Every method shows the same groups; the amount policy is edited per destination.
  const groups = GROUPS;

  /** Which groups still hold a mistake, so the summary can point at one. */
  const brokenGroups = useMemo(() => {
    const names = Object.keys(errors as Record<string, unknown>);
    return groups.filter(group => group.fields.some(field => names.includes(field))).map(group => group.id);
  }, [errors, groups]);

  /** The number shown beside a group's heading, in the order the form asks. */
  const stepOf = (id: GroupId) => groups.findIndex(group => group.id === id) + 1;

  const autoSlug = !editingId && title ? slugify(title) : watch('slug');

  const closeForm = () => {
    panel.close();
    reset();
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
                    <Button
                      key={id}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-full px-2.5 text-[11px]"
                      onClick={() => focusGroup(id)}
                    >
                      {t(group.label)}
                    </Button>
                  );
                })}
              </span>
            </div>
          )}

          {/* 1 — what the method is */}
          <FormGroup
            id="support-title"
            index={stepOf('identity')}
            title={t('groupIdentity')}
            description={t('groupIdentityHint')}
            broken={brokenGroups.includes('identity')}
          >
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

          {/* 2 — how the backing arrives, and where it lands */}
          <FormGroup
            id="support-mode-group"
            index={stepOf('rail')}
            title={t('groupRail')}
            description={t('groupRailHint')}
            broken={brokenGroups.includes('rail')}
          >
            <SupportModePicker value={mode} onChange={setMode} />

            <Field label={t('region')} id="support-region" error={errors.region?.message} hint={t('regionHint')}>
              <select id="support-region" {...register('region')} className="control">
                {DONATION_REGIONS.map(value => (
                  <option key={value} value={value}>
                    {ts(`regions.${value}`)}
                  </option>
                ))}
              </select>
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

            {/* Destinations: the places this method can actually arrive at. */}
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
                <SupportVariantRow
                  key={field.id}
                  index={index}
                  mode={mode}
                  variant={variants[index]}
                  broken={Boolean(errors.variants?.[index])}
                  onRemove={() => removeVariant(index)}
                  onAddSuggested={addVariantSuggested}
                  onRemoveSuggested={removeVariantSuggested}
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

          {/* 3 — where it shows up */}
          <FormGroup
            id="support-active"
            index={stepOf('publish')}
            title={t('groupPublish')}
            description={t('groupPublishHint')}
            broken={brokenGroups.includes('publish')}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CheckboxField
                id="support-active"
                label={t('active')}
                hint={t('activeHint')}
                {...register('active')}
                onChange={event => setValue('active', event.target.checked, { shouldDirty: true, shouldValidate: true })}
              />
              <Field label={t('order')} id="support-order" error={errors.order?.message} hint={t('orderHint')}>
                <Input
                  id="support-order"
                  type="number"
                  min={0}
                  max={999}
                  step={1}
                  inputMode="numeric"
                  dir="ltr"
                  className="tabular-nums"
                  {...register('order', numberField)}
                />
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

export default SupportOptions;
