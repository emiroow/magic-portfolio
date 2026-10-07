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
import { MAX_SOCIALS } from '@/features/socials/constants';

// Same schema as the API plus the optional document id for edits.
const formSchema = socialSchema.extend({ _id: z.string().optional() });
type SocialForm = z.infer<typeof formSchema>;

const EMPTY: SocialForm = { name: '', url: '', icon: '' };

/** Social links list + CRUD mutations for the dashboard. */
const useSocials = () => {
  const locale = useLocale();
  const t = useTranslations('dashboard.social');
  const { ok, fail, warn } = useToastMessages();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SocialForm>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const {
    data: socials,
    isPending,
    isError,
    error,
    refetch: refetchSocials,
  } = useQuery({
    queryKey: ['socials', locale],
    queryFn: () => api.get<ISocial[]>(`/api/${locale}/admin/social`),
  });

  const save = useMutation({
    mutationFn: (data: SocialForm) =>
      data._id ? api.put<ISocial>(`/api/${locale}/admin/social`, data) : api.post<ISocial>(`/api/${locale}/admin/social`, data),
    onSuccess: () => {
      ok();
      reset(EMPTY);
      refetchSocials();
    },
    onError: () => fail(),
  });

  const { mutate: deleteSocial, isPending: deleting } = useMutation({
    mutationFn: (id: string) => api.del(`/api/${locale}/admin/social?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      ok();
      refetchSocials();
    },
    onError: () => fail(),
  });

  const startEdit = (social: ISocial) => reset({ ...EMPTY, ...social, _id: social._id });

  return {
    socials,
    isPending,
    isError,
    error,
    refetchSocials,
    register,
    handleSubmit,
    reset: () => reset(EMPTY),
    watch,
    errors,
    save,
    deleteSocial,
    deleting,
    startEdit,
    maxReached: (socials?.length ?? 0) >= MAX_SOCIALS,
    // The panel closes only on a saved record; a rejected save leaves it editable.
    onSubmit: (data: SocialForm, onSaved?: () => void) => {
      if (!data._id && (socials?.length ?? 0) >= MAX_SOCIALS) {
        warn(t('maxReached'));
        return;
      }
      save.mutate(data, { onSuccess: onSaved });
    },
  };
};

export default useSocials;
