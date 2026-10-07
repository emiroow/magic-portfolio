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
import { useConfirmDelete } from '@/features/dashboard/hooks/useConfirmDelete';
import { useFormPanel } from '@/hooks/useFormPanel';
import useEducation from '@/features/education/hooks/useEducation';
import { formatYearMonthLocal } from '@/lib/utils';
import type { IEducation } from '@/features/education/types';
import { GraduationCap, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

/** Education section: schools and universities with a logo and a date range. */
const EducationExperience = () => {
  const t = useTranslations('dashboard.education');
  const td = useTranslations('dashboard');
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
    refetchEducations,
  } = useEducation();

  const panel = useFormPanel();
  const confirm = useConfirmDelete(deleteEducation);

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

  const beginEdit = (education: IEducation) => {
    startEdit(education);
    panel.open();
  };

  return (
    <SectionShell
      title={t('educationTitle')}
      anchorRef={panel.anchorRef}
      action={
        !panel.isOpen && (
          <Button size="icon" variant="outline" onClick={beginCreate} aria-label={t('createEducation')}>
            <Plus className="size-4" aria-hidden />
          </Button>
        )
      }
    >
      <FormPanel open={panel.isOpen} title={editingId ? t('editTitle') : t('createEducation')} onClose={closeForm}>
        <form onSubmit={handleSubmit(data => onSubmit(data, panel.close))} className="space-y-5">
          <ImageField
            label={t('logoImage')}
            alt={getValues('school') || t('logoImage')}
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
            <Field label={t('school')} id="education-school" error={errors.school?.message}>
              <Input id="education-school" {...register('school')} placeholder={t('schoolPlaceholder')} autoComplete="off" />
            </Field>
            <Field label={t('degree')} id="education-degree" error={errors.degree?.message}>
              <Input id="education-degree" {...register('degree')} placeholder={t('degreePlaceholder')} autoComplete="off" />
            </Field>
            <Field label={t('href')} id="education-href" error={errors.href?.message} className="sm:col-span-2">
              <Input id="education-href" type="url" dir="ltr" {...register('href')} placeholder={t('hrefPlaceholder')} autoComplete="off" />
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

          <FormActions submitLabel={t('save')} cancelLabel={td('cancel')} submitting={save.isPending} onCancel={closeForm} />
        </form>
      </FormPanel>

      {isPending ? (
        <CardListSkeleton rows={2} mark body={false} actions={3} />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchEducations()} />
      ) : educations && educations.length > 0 ? (
        <EntityList>
          {educations.map(education => (
            <ResumeRow
              key={education._id}
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
              onDelete={() => confirm.request(education._id, education.school)}
            />
          ))}
        </EntityList>
      ) : (
        !panel.isOpen && <EmptyState icon={GraduationCap} text={t('noEducations')} actionText={t('createFirstEducation')} onAction={beginCreate} />
      )}

      <ConfirmDialog {...confirm.dialogProps} />
    </SectionShell>
  );
};

export default EducationExperience;
