'use client';

import { api } from '@/lib/client-api';
import type { IProfile } from '@/features/profile/types';
import { profileSchema } from '@/features/profile/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToastMessages } from '@/hooks/useToastMessages';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type ProfileForm = z.infer<typeof profileSchema>;

const EMPTY: ProfileForm = {
  name: '',
  fullName: '',
  jobTitle: '',
  email: '',
  tel: '',
  summary: '',
  description: '',
  avatarUrl: '',
  resumeUrl: '',
  languages: [],
};

/** Profile form state, loading and mutations (single doc per locale). */
const useProfile = () => {
  const locale = useLocale() as 'fa' | 'en';
  const { ok, fail } = useToastMessages();

  const {
    handleSubmit,
    register,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const {
    data: profile,
    isPending,
    isError,
    error: queryError,
    refetch: refetchGetProfile,
  } = useQuery({
    queryKey: ['profile', locale],
    queryFn: async () => {
      const data = await api.get<IProfile | null>(`/api/${locale}/admin/profile`);
      // The cache-buster keeps avatars fresh in the browser after re-upload.
      const avatarUrl = data?.avatarUrl ? `${data.avatarUrl.split('?')[0]}?cb=${Date.now()}` : '';
      reset({ ...EMPTY, ...(data ?? {}), avatarUrl });
      return data ? { ...data, avatarUrl } : null;
    },
  });

  const { mutate: putProfile, isPending: saving } = useMutation({
    mutationFn: (data: ProfileForm) => {
      // Store clean URLs only (drop the display-only ?cb=), and drop half-typed
      // language rows so a blank name never trips the server's required-name rule.
      const clean = {
        ...data,
        avatarUrl: data.avatarUrl ? data.avatarUrl.split('?')[0] : '',
        languages: (data.languages ?? []).filter(language => language.name?.trim()),
      };
      return api.put<IProfile>(`/api/${locale}/admin/profile`, clean);
    },
    onSuccess: () => {
      ok();
      refetchGetProfile();
    },
    onError: () => fail(),
  });

  const uploadAvatar = useMutation({
    mutationFn: (formData: FormData) => api.upload<{ fileUrl: string }>(`/api/${locale}/admin/upload?lang=${locale}&type=avatar`, formData),
    onSuccess: ({ fileUrl }) => {
      setValue('avatarUrl', `${fileUrl.split('?')[0]}?cb=${Date.now()}`, { shouldDirty: true });
      refetchGetProfile();
    },
    onError: () => fail(),
  });

  // A résumé upload is stored but not auto-persisted (unlike the avatar): the URL lands
  // in the form and only reaches the database on Save, so we deliberately do not refetch
  // here — a refetch would reset the form and drop the fresh URL.
  const uploadResume = useMutation({
    mutationFn: (formData: FormData) => api.upload<{ fileUrl: string }>(`/api/${locale}/admin/upload?lang=${locale}&type=resume`, formData),
    onSuccess: ({ fileUrl }) => {
      setValue('resumeUrl', fileUrl.split('?')[0], { shouldDirty: true });
    },
    onError: () => fail(),
  });

  const removeResume = () => setValue('resumeUrl', '', { shouldDirty: true });

  return {
    handleSubmit,
    register,
    setValue,
    reset,
    watch,
    formState: { errors },
    onsubmit: (data: ProfileForm) => putProfile(data),
    saving,
    isPending,
    isError,
    error: queryError,
    profile,
    uploadAvatar,
    uploadResume,
    removeResume,
    refetchGetProfile,
  };
};

export default useProfile;
