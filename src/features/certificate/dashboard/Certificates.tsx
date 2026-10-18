'use client';

import {
  CardListSkeleton,
  EmptyState,
  EntityList,
  ErrorState,
  FormActions,
  FormPanel,
  ImageField,
  SectionShell,
} from '@/features/dashboard/components';
import CertificateRow from '@/features/certificate/dashboard/CertificateRow';
import { CheckboxField, Field } from '@/components/ui/field';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useConfirmDelete } from '@/features/dashboard/hooks/useConfirmDelete';
import { useFormPanel } from '@/hooks/useFormPanel';
import useCertificates from '@/features/certificate/hooks/useCertificates';
import type { AppLocale } from '@/types';
import type { ICertificate } from '@/features/certificate/types';
import { Award, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

/** Certificates section: credentials earned, with an issuer mark and a validity span. */
const Certificates = () => {
  const t = useTranslations('dashboard.certificate');
  const td = useTranslations('dashboard');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    errors,
    certificates,
    isPending,
    isError,
    error,
    save,
    deleteCertificate,
    deletingId,
    toggleFeatured,
    togglingFeaturedId,
    uploadLogo,
    deleteLogo,
    startEdit,
    onSubmit,
    refetchCertificates,
  } = useCertificates();

  const panel = useFormPanel();
  const confirm = useConfirmDelete(deleteCertificate);

  const editingId = watch('_id');
  const title = watch('title');
  const logoUrl = watch('logoUrl');

  // Featured certificates are sorted first on the generated résumé; all valid
  // certificates are rendered regardless of the flag.
  const resumeNote = t('resumeHint');

  const closeForm = () => {
    panel.close();
    reset();
  };

  const beginCreate = () => {
    reset();
    panel.open();
  };

  const beginEdit = (certificate: ICertificate) => {
    startEdit(certificate);
    panel.open();
  };

  return (
    <SectionShell
      title={t('title')}
      description={t('description')}
      anchorRef={panel.anchorRef}
      action={
        !panel.isOpen && (
          <Button size="icon" variant="outline" onClick={beginCreate} aria-label={t('createCertificate')}>
            <Plus className="size-4" aria-hidden />
          </Button>
        )
      }
    >
      <FormPanel open={panel.isOpen} title={editingId ? t('editCertificate') : t('createCertificate')} onClose={closeForm}>
        <form onSubmit={handleSubmit(data => onSubmit({ ...data, featured: Boolean(data.featured) }, panel.close))} className="space-y-5">
          <ImageField
            label={t('logoImage')}
            alt={title || t('logoImage')}
            value={logoUrl}
            hint={td('image.hint')}
            error={errors.logoUrl?.message}
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
            <Field label={t('certificateTitle')} id="certificate-title" error={errors.title?.message}>
              <Input id="certificate-title" {...register('title')} placeholder={t('titlePlaceholder')} autoComplete="off" />
            </Field>
            <Field label={t('issuer')} id="certificate-issuer" error={errors.issuer?.message}>
              <Input id="certificate-issuer" {...register('issuer')} placeholder={t('issuerPlaceholder')} autoComplete="off" />
            </Field>
            <Field label={t('href')} id="certificate-href" error={errors.href?.message}>
              <Input id="certificate-href" type="url" dir="ltr" {...register('href')} placeholder={t('hrefPlaceholder')} autoComplete="off" />
            </Field>
            <Field label={t('credentialId')} id="certificate-credential-id" error={errors.credentialId?.message} hint={t('credentialIdHint')}>
              <Input
                id="certificate-credential-id"
                dir="ltr"
                {...register('credentialId')}
                placeholder={t('credentialIdPlaceholder')}
                autoComplete="off"
              />
            </Field>
          </div>

          <DateRangePicker
            startValue={watch('issueDate')}
            endValue={watch('expirationDate')}
            onStartChange={value => setValue('issueDate', value, { shouldValidate: true, shouldDirty: true })}
            onEndChange={value => setValue('expirationDate', value, { shouldValidate: true, shouldDirty: true })}
            startLabel={t('issueDate')}
            endLabel={t('expirationDate')}
            startId="certificate-issue-date"
            endId="certificate-expiration-date"
            endPlaceholder={t('noExpiration')}
            locale={lang}
            error={{ start: errors.issueDate?.message, end: errors.expirationDate?.message }}
          />

          <Field label={t('fieldDescription')} id="certificate-description" error={errors.description?.message}>
            <Textarea id="certificate-description" rows={3} {...register('description')} placeholder={t('descriptionPlaceholder')} />
          </Field>

          <CheckboxField id="certificate-featured" label={t('featured')} hint={resumeNote} {...register('featured')} />

          <FormActions
            submitLabel={editingId ? t('update') : t('create')}
            cancelLabel={td('cancel')}
            submitting={save.isPending}
            onCancel={closeForm}
          />
        </form>
      </FormPanel>

      {isPending ? (
        <CardListSkeleton rows={2} mark media={false} actions={4} />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchCertificates()} />
      ) : certificates && certificates.length > 0 ? (
        <EntityList>
          {certificates.map(certificate => (
            <CertificateRow
              key={certificate._id}
              certificate={certificate}
              lang={lang}
              noExpirationLabel={t('noExpiration')}
              onEdit={beginEdit}
              onDelete={item => confirm.request(item._id, item.title)}
              onToggleResume={toggleFeatured}
              deleting={deletingId === certificate._id}
              togglingResume={togglingFeaturedId === certificate._id}
            />
          ))}
        </EntityList>
      ) : (
        !panel.isOpen && <EmptyState icon={Award} text={t('noCertificates')} actionText={t('createFirstCertificate')} onAction={beginCreate} />
      )}

      <ConfirmDialog {...confirm.dialogProps} />
    </SectionShell>
  );
};

export default Certificates;
