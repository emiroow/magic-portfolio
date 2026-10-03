'use client';

import { iconDecider } from '@/components/icons';
import { EmptyState, ErrorState, Field, LoadingRows, SectionShell } from '@/components/dashboard/shared';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import useSocials from '@/hooks/dashboard/useSocials';
import { useSectionScroll } from '@/hooks/dashboard/useFormPanel';
import { Pencil, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { ISocial } from '@/types';

const AVAILABLE_ICONS = ['github', 'linkedin', 'x', 'instagram', 'telegram', 'whatsapp', 'youtube', 'website', 'email'];

/** Social links section: inline create/edit form plus a badge list. */
const Socials = () => {
  const t = useTranslations('dashboard.social');
  const tDash = useTranslations('dashboard');
  // Icon names are already labelled for the navigation dock; reuse those words.
  const tNav = useTranslations('navbar');
  const { socials, isPending, isError, error, register, handleSubmit, reset, watch, errors, onsubmit, save, deleteSocial, edit } =
    useSocials();

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const { anchorRef, scrollToSection } = useSectionScroll();
  const selectedIcon = watch('icon');
  const editingId = watch('_id');

  // An icon slug the dock has no label for stays readable as stored.
  const iconLabel = (value: string) => (tNav.has(`social.${value}`) ? tNav(`social.${value}`) : value);

  // The form sits above the list, so an edit has to bring it back into view.
  const beginEdit = (social: ISocial) => {
    edit(social);
    scrollToSection();
  };

  return (
    <SectionShell title={t('title')} anchorRef={anchorRef}>
      {/* Create / edit form */}
      <form onSubmit={handleSubmit(onsubmit)} className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
        <Field label={t('name')} id="social-name" error={errors.name?.message} className="md:col-span-3">
          <Input id="social-name" {...register('name')} placeholder={t('namePlaceholder')} autoComplete="off" />
        </Field>

        <Field label={t('url')} id="social-url" error={errors.url?.message} className="md:col-span-4">
          <Input id="social-url" {...register('url')} placeholder={t('urlPlaceholder')} type="url" dir="ltr" />
        </Field>

        <Field label={t('icon')} id="social-icon" error={errors.icon?.message} className="md:col-span-3">
          <select id="social-icon" className="control" {...register('icon')}>
            <option value="">{t('selectIcon')}</option>
            {AVAILABLE_ICONS.map(icon => (
              <option key={icon} value={icon}>
                {iconLabel(icon)}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex h-10 items-center gap-2 md:col-span-2">
          <Button type="submit" disabled={save.isPending} className="w-full md:w-auto">
            {save.isPending ? <Loading size="sm" className="me-2" /> : null}
            {t('save')}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={reset} className="w-full md:w-auto">
              {tDash('cancel')}
            </Button>
          )}
        </div>
      </form>

      {/* Selected icon preview + list */}
      <div className="mt-8">
        {isPending ? (
          <LoadingRows rows={1} />
        ) : isError ? (
          <ErrorState message={error?.message} />
        ) : (
          <>
            {selectedIcon && (
              <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span aria-hidden className="inline-flex size-7 items-center justify-center rounded-md border bg-background">
                  {iconDecider(selectedIcon, 'size-4')}
                </span>
                {t('icon')}: {iconLabel(selectedIcon)}
              </p>
            )}

            {socials && socials.length > 0 ? (
              <div className="overflow-hidden rounded-xl border">
                <ul className="divide-y divide-border">
                  {socials.map(social => (
                    <li key={social._id} className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40 sm:p-4">
                      <span
                        aria-hidden
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background"
                      >
                        {iconDecider(social.icon, 'size-4')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{social.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          <bdi dir="ltr">{social.url}</bdi>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-0.5">
                        <Button size="icon" variant="ghost" className="size-8" onClick={() => beginEdit(social)} aria-label={tDash('edit')}>
                          <Pencil className="size-4" aria-hidden />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 hover:text-destructive"
                          onClick={() => social._id && setPendingDelete(social._id)}
                          aria-label={tDash('delete')}
                        >
                          <X className="size-4" aria-hidden />
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyState text={t('noSocials')} />
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={open => !open && setPendingDelete(null)}
        itemName={socials?.find(s => s._id === pendingDelete)?.name}
        onConfirm={() => {
          if (pendingDelete) deleteSocial(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </SectionShell>
  );
};

export default Socials;
