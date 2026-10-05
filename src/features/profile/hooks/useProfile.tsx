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
      // Store clean URLs only: strip the display-only ?cb= cache buster
      // so it never accumulates in the database.
      const clean = { ...data, avatarUrl: data.avatarUrl ? data.avatarUrl.split('?')[0] : '' };
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

  return {
    handleSubmit,
    register,
    setValue,
    reset,
    formState: { errors },
    onsubmit: (data: ProfileForm) => putProfile(data),
    saving,
    isPending,
    isError,
    error: queryError,
    profile,
    uploadAvatar,
    refetchGetProfile,
  };
};

export default useProfile;
