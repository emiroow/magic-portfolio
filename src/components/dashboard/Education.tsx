'use client';

import { EmptyState, ErrorState, Field, FormPanel, LoadingRows, SectionShell } from '@/components/dashboard/shared';
import { ResumeCard } from '@/components/resume-card';
import { Stack } from '@/components/sections/stack';
import ImageCropperDialog from '@/components/ui/image-cropper';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import useEducation from '@/hooks/dashboard/useEducation';
import { useFormPanel } from '@/hooks/dashboard/useFormPanel';
import type { IEducation } from '@/types';
import { formatYearMonthLocal } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

/** Education section: schools/universities with logo and date range. */
const EducationExperience = () => {
  const t = useTranslations('dashboard.education');
  const tcrop = useTranslations('dashboard.crop');
  const locale = useLocale();
  const lang = locale === 'fa' ? 'fa' : 'en';

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    errors,
    educations,
    isPending,
    isError,
    error,
    save,
    deleteEducation,
    uploadLogo,
    deleteLogo,
    startEdit,
    onSubmit,
    fileInputRef,
    refetchEducations,
  } = useEducation();

  const panel = useFormPanel();
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const closeForm = () => {
    panel.close();
    reset();
  };

  const beginCreate = () => {
    reset();
    panel.open();
  };

  const beginEdit = (education: IEducation) => {
    startEdit(education);
    panel.open();
  };

  const logoUrl = getValues('logoUrl');

  return (
    <SectionShell
      title={t('educationTitle')}
      anchorRef={panel.anchorRef}
      action={
        !panel.isOpen && (
          <Button size="icon" variant="outline" className="size-8" onClick={beginCreate} aria-label={t('createEducation')}>
            <Plus className="h-4 w-4" />
          </Button>
        )
      }
    >
      <FormPanel open={panel.isOpen} title={getValues('_id') ? t('editTitle') : t('createEducation')} onClose={closeForm}>
        <form onSubmit={handleSubmit(data => onSubmit(data, panel.close))} className="space-y-5">
          {/* Logo */}
          <Field label={t('logoImage')}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/20">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt={t('logoImage')} className="size-full object-contain p-1" />
                ) : (
                  <span className="text-[10px] text-muted-foreground">{t('noImage')}</span>
                )}
              </div>
              <div className="flex flex-col items-start gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadLogo.isPending}>
                  {uploadLogo.isPending ? <Loading size="sm" className="me-2" /> : null}
                  {t('uploadImage')}
                </Button>
                {logoUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => deleteLogo.mutate()} disabled={deleteLogo.isPending}>
                    {t('removeImage')}
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setCropSrc(URL.createObjectURL(file));
                    setCropOpen(true);
                  }}
                />
              </div>
            </div>
          </Field>

          <ImageCropperDialog
            open={cropOpen}
            onOpenChange={v => {
              setCropOpen(v);
              if (!v && cropSrc) {
                URL.revokeObjectURL(cropSrc);
                setCropSrc(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
            }}
            src={cropSrc}
            aspect={1}
            labels={{ title: tcrop('title'), apply: tcrop('apply'), cancel: t('cancel'), zoom: tcrop('zoom'), move: tcrop('move') }}
            outputSize={256}
            onCropped={file => {
              const formData = new FormData();
              formData.append('image', file);
              uploadLogo.mutate(formData);
            }}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('school')} id="education-school" error={errors.school?.message}>
              <Input id="education-school" {...register('school')} placeholder={t('schoolPlaceholder')} />
            </Field>
            <Field label={t('degree')} id="education-degree" error={errors.degree?.message}>
              <Input id="education-degree" {...register('degree')} placeholder={t('degreePlaceholder')} />
            </Field>
            <Field label={t('href')} id="education-href" error={errors.href?.message} className="sm:col-span-2">
              <Input id="education-href" {...register('href')} placeholder={t('hrefPlaceholder')} type="url" dir="ltr" />
            </Field>
          </div>

          <DateRangePicker
            startValue={getValues('start')}
            endValue={getValues('end')}
            onStartChange={value => setValue('start', value, { shouldValidate: true, shouldDirty: true })}
            onEndChange={value => setValue('end', value, { shouldValidate: true, shouldDirty: true })}
            startLabel={t('start')}
            endLabel={t('end')}
            startId="education-start"
            endId="education-end"
            locale={lang}
            error={{ start: errors.start?.message, end: errors.end?.message }}
          />

          <div className="flex gap-2 max-sm:flex-col">
            <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto">
              {save.isPending ? <Loading size="sm" className="me-2" /> : null}
              {t('save')}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm} className="w-full sm:w-auto">
              {t('cancelForm')}
            </Button>
          </div>
        </form>
      </FormPanel>

      {isPending ? (
        <LoadingRows />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchEducations()} />
      ) : educations && educations.length > 0 ? (
        <Stack>
          {educations.map(education => (
            <ResumeCard
              key={education._id}
              variant="row"
              logoUrl={education.logoUrl}
              altText={education.school}
              title={education.school}
              subtitle={education.degree}
              href={education.href}
              period={`${formatYearMonthLocal(education.start, lang)}${education.start && education.end ? ' – ' : ''}${formatYearMonthLocal(
                education.end,
                lang
              )}`}
              onEdit={() => beginEdit(education)}
              onDelete={() => education._id && setPendingDelete(education._id)}
            />
          ))}
        </Stack>
      ) : (
        !panel.isOpen && <EmptyState text={t('noEducations')} actionText={t('createFirstEducation')} onAction={beginCreate} />
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={open => !open && setPendingDelete(null)}
        itemName={educations?.find(e => e._id === pendingDelete)?.school}
        onConfirm={() => {
          if (pendingDelete) deleteEducation(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </SectionShell>
  );
};

export default EducationExperience;
