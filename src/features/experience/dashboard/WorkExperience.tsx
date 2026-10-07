'use client';

import {
  CardListSkeleton,
  EmptyState,
  EntityList,
  ErrorState,
  FormActions,
  FormPanel,
  ImageField,
  ResumeRow,
  SectionShell,
} from '@/features/dashboard/components';
import { Field } from '@/components/ui/field';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useConfirmDelete } from '@/features/dashboard/hooks/useConfirmDelete';
import { useFormPanel } from '@/hooks/useFormPanel';
import useWorkExperience from '@/features/experience/hooks/useWorkExperience';
import { formatYearMonthLocal } from '@/lib/utils';
import type { IWork } from '@/features/experience/types';
import { Briefcase, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

/** Work experience section: timeline entries with a logo, a place and a date range. */
const WorkExperience = () => {
  const t = useTranslations('dashboard.workExperience');
  const td = useTranslations('dashboard');
  const tRoot = useTranslations();
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
    refetchWorks,
  } = useWorkExperience();

  const panel = useFormPanel();
  const confirm = useConfirmDelete(deleteWork);

  const editingId = getValues('_id');
  const logoUrl = getValues('logoUrl');

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

  return (
    <SectionShell
      title={t('experience')}
      anchorRef={panel.anchorRef}
      action={
        !panel.isOpen && (
          <Button size="icon" variant="outline" onClick={beginCreate} aria-label={t('createWork')}>
            <Plus className="size-4" aria-hidden />
          </Button>
        )
      }
    >
      <FormPanel open={panel.isOpen} title={editingId ? t('editWork') : t('createWork')} onClose={closeForm}>
        <form onSubmit={handleSubmit(data => onSubmit(data, panel.close))} className="space-y-5">
          <ImageField
            label={t('logoImage')}
            alt={getValues('company') || t('logoImage')}
            value={logoUrl}
            hint={td('image.hint')}
            frameClassName="size-20 rounded-lg"
            fit="contain"
            aspect={1}
            outputSize={256}
            uploading={uploadLogo.isPending}
            removing={deleteLogo.isPending}
            onRemove={() => deleteLogo.mutate()}
            onUpload={file => {
              const formData = new FormData();
              formData.append('image', file);
              uploadLogo.mutate(formData);
            }}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('company')} id="work-company" error={errors.company?.message}>
              <Input id="work-company" {...register('company')} placeholder={t('companyPlaceholder')} autoComplete="off" />
            </Field>
            <Field label={t('title')} id="work-title" error={errors.title?.message}>
              <Input id="work-title" {...register('title')} placeholder={t('titlePlaceholder')} autoComplete="off" />
            </Field>
            <Field label={t('href')} id="work-href" error={errors.href?.message}>
              <Input id="work-href" type="url" dir="ltr" {...register('href')} placeholder={t('hrefPlaceholder')} autoComplete="off" />
            </Field>
            <Field label={t('location')} id="work-location" error={errors.location?.message}>
              <Input id="work-location" {...register('location')} placeholder={t('locationPlaceholder')} autoComplete="off" />
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

          <FormActions submitLabel={t('save')} cancelLabel={td('cancel')} submitting={save.isPending} onCancel={closeForm} />
        </form>
      </FormPanel>

      {isPending ? (
        <CardListSkeleton rows={2} mark media={false} actions={3} />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchWorks()} />
      ) : works && works.length > 0 ? (
        <EntityList>
          {works.map(work => (
            <ResumeRow
              key={work._id}
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
              onEdit={() => beginEdit(work)}
              onDelete={() => confirm.request(work._id, work.company)}
            />
          ))}
        </EntityList>
      ) : (
        !panel.isOpen && (
          <EmptyState icon={Briefcase} text={t('noWorkExperiences')} actionText={t('createFirstWorkExperience')} onAction={beginCreate} />
        )
      )}

      <ConfirmDialog {...confirm.dialogProps} />
    </SectionShell>
  );
};

export default WorkExperience;
