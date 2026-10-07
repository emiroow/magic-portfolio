'use client';

import {
  CardListSkeleton,
  EmptyState,
  EntityCard,
  EntityList,
  ErrorState,
  FormActions,
  FormPanel,
  RowAction,
  SectionShell,
} from '@/features/dashboard/components';
import { iconDecider } from '@/components/icons';
import { Field } from '@/components/ui/field';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useConfirmDelete } from '@/features/dashboard/hooks/useConfirmDelete';
import { useFormPanel } from '@/hooks/useFormPanel';
import useSocials from '@/features/socials/hooks/useSocials';
import { MAX_SOCIALS, SOCIAL_ICONS } from '@/features/socials/constants';
import { localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { ISocial } from '@/features/socials/types';
import { Link2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

/** Social links section: the dock's outbound links, capped at what it can carry. */
const Socials = () => {
  const t = useTranslations('dashboard.social');
  const td = useTranslations('dashboard');
  // Icon names are already labelled for the navigation dock; reuse those words.
  const tNav = useTranslations('navbar');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const {
    socials,
    isPending,
    isError,
    error,
    refetchSocials,
    register,
    handleSubmit,
    reset,
    watch,
    errors,
    save,
    deleteSocial,
    startEdit,
    maxReached,
    onSubmit,
  } = useSocials();

  const panel = useFormPanel();
  const confirm = useConfirmDelete(deleteSocial);

  const selectedIcon = watch('icon');
  const editingId = watch('_id');
  const count = socials?.length ?? 0;

  // An icon slug the dock has no label for stays readable as stored.
  const iconLabel = (value: string) => (tNav.has(`social.${value}`) ? tNav(`social.${value}`) : value);

  const closeForm = () => {
    panel.close();
    reset();
  };

  const beginCreate = () => {
    reset();
    panel.open();
  };

  const beginEdit = (social: ISocial) => {
    startEdit(social);
    panel.open();
  };

  return (
    <SectionShell
      title={t('title')}
      anchorRef={panel.anchorRef}
      action={
        !panel.isOpen && (
          <>
            <span aria-live="polite" className="text-xs tabular-nums text-muted-foreground">
              {t('slotCount', { used: localizedCount(count, lang), max: localizedCount(MAX_SOCIALS, lang) })}
            </span>
            <Button
              size="icon"
              variant="outline"
              onClick={beginCreate}
              disabled={maxReached}
              aria-label={t('create')}
              title={maxReached ? t('maxReached') : t('create')}
            >
              <Plus className="size-4" aria-hidden />
            </Button>
          </>
        )
      }
    >
      <FormPanel open={panel.isOpen} title={editingId ? t('edit') : t('create')} onClose={closeForm}>
        <form onSubmit={handleSubmit(data => onSubmit(data, panel.close))} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={t('name')} id="social-name" error={errors.name?.message}>
              <Input id="social-name" {...register('name')} placeholder={t('namePlaceholder')} autoComplete="off" />
            </Field>
            <Field label={t('url')} id="social-url" error={errors.url?.message} className="sm:col-span-2">
              <Input id="social-url" type="url" dir="ltr" {...register('url')} placeholder={t('urlPlaceholder')} autoComplete="off" />
            </Field>
          </div>

          <Field label={t('icon')} id="social-icon" error={errors.icon?.message}>
            <div className="flex items-center gap-3">
              <Select id="social-icon" {...register('icon')} className="sm:max-w-56">
                <option value="">{t('selectIcon')}</option>
                {SOCIAL_ICONS.map(icon => (
                  <option key={icon} value={icon}>
                    {iconLabel(icon)}
                  </option>
                ))}
              </Select>
              {/* Seeing the glyph is the only way to know the slug picked the right one. */}
              {selectedIcon && (
                <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                  {iconDecider(selectedIcon, 'size-4')}
                </span>
              )}
            </div>
          </Field>

          <FormActions
            submitLabel={editingId ? t('save') : t('create')}
            cancelLabel={td('cancel')}
            submitting={save.isPending}
            onCancel={closeForm}
          />
        </form>
      </FormPanel>

      {isPending ? (
        <CardListSkeleton rows={2} mark body={false} actions={2} />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchSocials()} />
      ) : socials && socials.length > 0 ? (
        <EntityList>
          {socials.map(social => (
            <EntityCard
              key={social._id}
              title={social.name}
              meta={<bdi dir="ltr">{social.url}</bdi>}
              leading={
                <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                  {iconDecider(social.icon, 'size-4')}
                </span>
              }
              actions={
                <>
                  <RowAction label={td('edit')} icon={Pencil} onClick={() => beginEdit(social)} />
                  <RowAction label={td('delete')} icon={Trash2} danger onClick={() => confirm.request(social._id, social.name)} />
                </>
              }
            />
          ))}
        </EntityList>
      ) : (
        !panel.isOpen && <EmptyState icon={Link2} text={t('noSocials')} actionText={t('addFirstSocial')} onAction={beginCreate} />
      )}

      <ConfirmDialog {...confirm.dialogProps} />
    </SectionShell>
  );
};

export default Socials;
