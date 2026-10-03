'use client';

import { Field } from '@/components/dashboard/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import ImageCropperDialog from '@/components/ui/image-cropper';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import useProfile from '@/hooks/dashboard/useProfile';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ImagePlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

/** Profile section: identity, contact info and avatar upload with crop. */
const Profile = () => {
  const t = useTranslations('dashboard.profile');
  const tDash = useTranslations('dashboard');
  const tcrop = useTranslations('dashboard.crop');

  const { register, handleSubmit, formState: { errors }, profile, isPending, isError, error, saving, onsubmit, uploadAvatar, refetchGetProfile } = useProfile();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  if (isPending) {
    return (
      <div className="mt-8 space-y-4" aria-busy="true">
        <Skeleton className="h-24 w-24 rounded-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed border-destructive/40 py-14 text-center">
        <p className="text-sm text-muted-foreground">{error?.message || tDash('loadError')}</p>
        <Button variant="outline" size="sm" onClick={() => refetchGetProfile()}>
          {tDash('retry')}
        </Button>
      </div>
    );
  }

  const openCropper = () => fileInputRef.current?.click();

  return (
    <section className="mb-16">
      <form onSubmit={handleSubmit(onsubmit)} className="mt-8 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className={cn('relative flex size-24 items-center justify-center overflow-hidden rounded-full border')}>
            {profile?.avatarUrl ? (
              <Avatar className="size-full">
                <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
              </Avatar>
            ) : (
              <span className="text-xs text-muted-foreground">{t('noImage')}</span>
            )}
            {uploadAvatar.isPending && (
              <span className="absolute inset-0 flex items-center justify-center bg-background/70">
                <Loading size="sm" />
              </span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t('profileImage')}</p>
            <Button type="button" variant="outline" size="sm" onClick={openCropper} disabled={uploadAvatar.isPending}>
              <ImagePlus className="me-2 h-4 w-4" />
              {t('uploadImage')}
            </Button>
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
            {errors.avatarUrl && <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>}
          </div>
        </div>

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
          labels={{ title: tcrop('title'), apply: tcrop('apply'), cancel: t('cancelForm'), zoom: tcrop('zoom'), move: tcrop('move') }}
          outputSize={512}
          onCropped={file => {
            const formData = new FormData();
            formData.append('image', file);
            uploadAvatar.mutate(formData);
          }}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('name')} id="profile-name" error={errors.name?.message}>
            <Input id="profile-name" {...register('name')} placeholder={t('namePlaceholder')} />
          </Field>
          <Field label={t('fullName')} id="profile-fullName" error={errors.fullName?.message}>
            <Input id="profile-fullName" {...register('fullName')} placeholder={t('fullNamePlaceholder')} />
          </Field>
          <Field label={t('jobTitle')} id="profile-jobTitle" error={errors.jobTitle?.message}>
            <Input id="profile-jobTitle" {...register('jobTitle')} placeholder={t('jobTitle')} />
          </Field>
          <Field label={t('email')} id="profile-email" error={errors.email?.message}>
            <Input id="profile-email" type="email" {...register('email')} placeholder={t('emailPlaceholder')} dir="ltr" />
          </Field>
          <Field label={t('phoneNumber')} id="profile-tel" error={errors.tel?.message}>
            <Input id="profile-tel" {...register('tel')} placeholder={t('telPlaceholder')} dir="ltr" />
          </Field>
          <Field label={t('summary')} id="profile-summary" error={errors.summary?.message}>
            <Input id="profile-summary" {...register('summary')} placeholder={t('summaryPlaceholder')} />
          </Field>
        </div>

        <Field label={t('about')} id="profile-about" error={errors.description?.message}>
          <Textarea id="profile-about" rows={4} {...register('description')} placeholder={t('aboutPlaceholder')} />
        </Field>

        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loading size="sm" className="me-2" /> : null}
          {t('save')}
        </Button>
      </form>
    </section>
  );
};

export default Profile;
