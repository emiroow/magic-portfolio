'use client';

import { ErrorState, FormSkeleton, ImageField, SectionShell } from '@/features/dashboard/components';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import { Textarea } from '@/components/ui/textarea';
import useProfile from '@/features/profile/hooks/useProfile';
import { useTranslations } from 'next-intl';

/**
 * Profile section: identity, contact info and avatar.
 *
 * The one archive that holds a single record instead of a list, so it has no create
 * button and no panel — the form is always the section. It still wears the same
 * heading, hairline, skeleton and error surface as the other eight, because an owner
 * moving between tabs should not have to relearn the page each time.
 */
const Profile = () => {
  const t = useTranslations('dashboard.profile');
  const td = useTranslations('dashboard');

  const {
    register,
    handleSubmit,
    formState: { errors },
    profile,
    isPending,
    isError,
    error,
    saving,
    onsubmit,
    uploadAvatar,
    refetchGetProfile,
  } = useProfile();

  return (
    <SectionShell title={t('title')}>
      {isPending ? (
        <FormSkeleton fields={6} mark />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchGetProfile()} />
      ) : (
        <form onSubmit={handleSubmit(onsubmit)} className="space-y-5">
          <ImageField
            label={t('profileImage')}
            alt={profile?.fullName ?? ''}
            value={profile?.avatarUrl}
            error={errors.avatarUrl?.message}
            hint={td('image.hint')}
            frameClassName="size-24 rounded-full"
            aspect={1}
            outputSize={512}
            uploading={uploadAvatar.isPending}
            onUpload={file => {
              const formData = new FormData();
              formData.append('image', file);
              uploadAvatar.mutate(formData);
            }}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('name')} id="profile-name" error={errors.name?.message}>
              <Input id="profile-name" {...register('name')} placeholder={t('namePlaceholder')} autoComplete="given-name" />
            </Field>
            <Field label={t('fullName')} id="profile-fullName" error={errors.fullName?.message}>
              <Input id="profile-fullName" {...register('fullName')} placeholder={t('fullNamePlaceholder')} autoComplete="name" />
            </Field>
            <Field label={t('jobTitle')} id="profile-jobTitle" error={errors.jobTitle?.message}>
              <Input id="profile-jobTitle" {...register('jobTitle')} placeholder={t('jobTitlePlaceholder')} autoComplete="organization-title" />
            </Field>
            <Field label={t('summary')} id="profile-summary" error={errors.summary?.message}>
              <Input id="profile-summary" {...register('summary')} placeholder={t('summaryPlaceholder')} />
            </Field>
            <Field label={t('email')} id="profile-email" error={errors.email?.message}>
              <Input id="profile-email" type="email" dir="ltr" {...register('email')} placeholder={t('emailPlaceholder')} autoComplete="email" />
            </Field>
            <Field label={t('phoneNumber')} id="profile-tel" error={errors.tel?.message}>
              <Input id="profile-tel" type="tel" dir="ltr" {...register('tel')} placeholder={t('telPlaceholder')} autoComplete="tel" />
            </Field>
          </div>

          <Field label={t('about')} id="profile-about" error={errors.description?.message} hint={t('aboutHint')}>
            <Textarea id="profile-about" rows={4} {...register('description')} placeholder={t('aboutPlaceholder')} />
          </Field>

          <Button type="submit" disabled={saving} className="rounded-full">
            {saving && <Loading size="sm" className="me-2" />}
            {t('save')}
          </Button>
        </form>
      )}
    </SectionShell>
  );
};

export default Profile;
