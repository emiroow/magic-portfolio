'use client';

import { api } from '@/lib/client-api';
import { socialSchema } from '@/features/socials/schema';
import type { ISocial } from '@/features/socials/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToastMessages } from '@/hooks/useToastMessages';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Same schema as the API plus the optional document id for edits.
const formSchema = socialSchema.extend({ _id: z.string().optional() });
type SocialForm = z.infer<typeof formSchema>;

const MAX_SOCIALS = 4;

/** Social links list + CRUD mutations for the dashboard. */
const useSocials = () => {
  const locale = useLocale();
  const t = useTranslations('dashboard.social');
  const { ok, fail, warn } = useToastMessages();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<SocialForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', url: '', icon: '' },
    mode: 'onTouched',
  });

  const {
    data: socials,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['socials', locale],
    queryFn: () => api.get<ISocial[]>(`/api/${locale}/admin/social`),
  });

  const save = useMutation({
    mutationFn: (data: SocialForm) =>
      data._id ? api.put<ISocial>(`/api/${locale}/admin/social`, data) : api.post<ISocial>(`/api/${locale}/admin/social`, data),
    onSuccess: () => {
      ok();
      reset();
      refetch();
    },
    onError: () => fail(),
  });

  const { mutate: deleteSocial, isPending: deleting } = useMutation({
    mutationFn: (id: string) => api.del(`/api/${locale}/admin/social?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      ok();
      refetch();
    },
    onError: () => fail(),
  });

  const onsubmit = (data: SocialForm) => {
    if (!data._id && (socials?.length ?? 0) >= MAX_SOCIALS) {
      warn(t('maxReached'));
      return;
    }
    save.mutate(data);
  };

  const edit = (social: ISocial) => {
    setValue('_id', social._id);
    setValue('name', social.name);
    setValue('url', social.url);
    setValue('icon', social.icon);
  };

  const resetForm = () => {
    reset();
    setValue('_id', undefined);
  };

  return {
    socials,
    isPending,
    isError,
    error,
    register,
    handleSubmit,
    setValue,
    reset: resetForm,
    watch,
    errors,
    onsubmit,
    save,
    deleteSocial,
    deleting,
    edit,
  };
};

export default useSocials;
