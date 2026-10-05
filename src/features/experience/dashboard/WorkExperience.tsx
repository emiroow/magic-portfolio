'use client';

import { EmptyState, ErrorState, Field, FormPanel, LoadingRows, SectionShell } from '@/features/dashboard/shared';
import { ResumeCard } from '@/components/resume-card';
import { Stack } from '@/components/stack';
import ImageCropperDialog from '@/components/ui/image-cropper';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import { Textarea } from '@/components/ui/textarea';
import useWorkExperience from '@/features/experience/hooks/useWorkExperience';
import { useFormPanel } from '@/hooks/useFormPanel';
import type { IWork } from '@/features/experience/types';
import { formatYearMonthLocal } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

/** Work experience section: timeline entries with logo and date range. */
const WorkExperience = () => {
  const t = useTranslations('dashboard.workExperience');
  const tRoot = useTranslations();
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
    works,
    isPending,
    isError,
    error,
    save,
    deleteWork,
    uploadLogo,
    deleteLogo,
    startEdit,
    onSubmit,
    fileInputRef,
    refetchWorks,
  } = useWorkExperience();

  const panel = useFormPanel();
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const closeForm = () => {
    panel.close();
    reset();
  };

  const beginCreate = () => {
    reset();
    panel.open();
  };

  const beginEdit = (work: IWork) => {
    startEdit(work);
    panel.open();
  };

  const logoUrl = getValues('logoUrl');

  return (
    <SectionShell
      title={t('experience')}
      anchorRef={panel.anchorRef}
      action={
        !panel.isOpen && (
          <Button size="icon" variant="outline" className="size-8" onClick={beginCreate} aria-label={t('createWork')}>
            <Plus className="h-4 w-4" />
          </Button>
        )
      }
    >
      <FormPanel open={panel.isOpen} title={getValues('_id') ? t('editWork') : t('createWork')} onClose={closeForm}>
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
            <Field label={t('company')} id="work-company" error={errors.company?.message}>
              <Input id="work-company" {...register('company')} placeholder={t('companyPlaceholder')} />
            </Field>
            <Field label={t('title')} id="work-title" error={errors.title?.message}>
              <Input id="work-title" {...register('title')} placeholder={t('titlePlaceholder')} />
            </Field>
            <Field label={t('href')} id="work-href" error={errors.href?.message}>
              <Input id="work-href" {...register('href')} placeholder={t('hrefPlaceholder')} type="url" dir="ltr" />
            </Field>
            <Field label={t('location')} id="work-location" error={errors.location?.message}>
              <Input id="work-location" {...register('location')} placeholder={t('locationPlaceholder')} />
            </Field>
          </div>

          <DateRangePicker
            startValue={getValues('start')}
            endValue={getValues('end')}
            onStartChange={value => setValue('start', value, { shouldValidate: true, shouldDirty: true })}
            onEndChange={value => setValue('end', value, { shouldValidate: true, shouldDirty: true })}
            startLabel={t('start')}
            endLabel={t('end')}
            startId="work-start"
            endId="work-end"
            locale={lang}
            error={{ start: errors.start?.message, end: errors.end?.message }}
          />

          <Field label={t('description')} id="work-description" error={errors.description?.message}>
            <Textarea id="work-description" rows={4} {...register('description')} placeholder={t('descriptionPlaceholder')} />
          </Field>

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
        <ErrorState message={error?.message} onRetry={() => refetchWorks()} />
      ) : works && works.length > 0 ? (
        <Stack>
          {works.map(work => (
            <ResumeCard
              key={work._id}
              variant="row"
              logoUrl={work.logoUrl}
              altText={work.company}
              title={work.company}
              subtitle={work.title}
              href={work.href}
              description={work.description}
              meta={work.location}
              period={`${formatYearMonthLocal(work.start, lang)}${work.start && work.end ? ' – ' : ''}${
                work.end ? formatYearMonthLocal(work.end, lang) : work.start ? tRoot('present') : ''
              }`}
              isExpanded={expanded === work._id}
              onToggle={() => setExpanded(expanded === work._id ? null : (work._id ?? null))}
              onEdit={() => beginEdit(work)}
              onDelete={() => work._id && setPendingDelete(work._id)}
            />
          ))}
        </Stack>
      ) : (
        !panel.isOpen && <EmptyState text={t('noWorkExperiences')} actionText={t('createFirstWorkExperience')} onAction={beginCreate} />
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={open => !open && setPendingDelete(null)}
        itemName={works?.find(w => w._id === pendingDelete)?.company}
        onConfirm={() => {
          if (pendingDelete) deleteWork(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </SectionShell>
  );
};

export default WorkExperience;
