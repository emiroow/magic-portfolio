'use client';

import { api } from '@/lib/client-api';
import { workSchema } from '@/features/experience/schema';
import type { IWork } from '@/features/experience/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToastMessages } from '@/hooks/useToastMessages';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Same schema as the API plus the optional document id for edits.
const formSchema = workSchema.extend({ _id: z.string().optional() });
type WorkForm = z.infer<typeof formSchema>;

const EMPTY: WorkForm = {
  company: '',
  title: '',
  href: '',
  location: '',
  logoUrl: '',
  start: '',
  end: '',
  description: '',
};

/** Work experience list + CRUD and logo upload for the dashboard. */
const useWorkExperience = () => {
  const locale = useLocale();
  const { ok, fail } = useToastMessages();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<WorkForm>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const {
    data: works,
    isPending,
    isError,
    error,
    refetch: refetchWorks,
  } = useQuery({
    queryKey: ['works', locale],
    queryFn: () => api.get<IWork[]>(`/api/${locale}/admin/work`),
  });

  const save = useMutation({
    mutationFn: (data: WorkForm) => {
      // Store clean URLs: strip the display-only ?cb= cache buster.
      const clean = { ...data, logoUrl: data.logoUrl ? data.logoUrl.split('?')[0] : '' };
      return clean._id ? api.put<IWork>(`/api/${locale}/admin/work`, clean) : api.post<IWork>(`/api/${locale}/admin/work`, clean);
    },
    onSuccess: () => {
      ok();
      reset();
      refetchWorks();
    },
    onError: () => fail(),
  });

  const { mutate: deleteWork, isPending: deleting } = useMutation({
    mutationFn: (id: string) => api.del(`/api/${locale}/admin/work?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      ok();
      refetchWorks();
    },
    onError: () => fail(),
  });

  const uploadLogo = useMutation({
    mutationFn: (formData: FormData) => api.upload<{ fileUrl: string }>(`/api/${locale}/admin/upload?lang=${locale}&type=experience`, formData),
    onSuccess: ({ fileUrl }) => {
      setValue('logoUrl', `${fileUrl.split('?')[0]}?cb=${Date.now()}`, { shouldDirty: true });
      trigger('logoUrl');
    },
    onError: () => fail(),
  });

  const deleteLogo = useMutation({
    mutationFn: () => {
      const fileName = getValues('logoUrl')?.split('/').pop()?.split('?')[0];
      return api.del(`/api/${locale}/admin/upload?lang=${locale}&type=experience&fileName=${encodeURIComponent(fileName ?? '')}`);
    },
    onSuccess: () => {
      setValue('logoUrl', '', { shouldDirty: true });
      trigger('logoUrl');
    },
    onError: () => fail(),
  });

  const startEdit = (work: IWork) => reset({ ...EMPTY, ...work, _id: work._id });

  return {
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
    refetchWorks,
    save,
    deleteWork,
    deleting,
    uploadLogo,
    deleteLogo,
    startEdit,
    onSubmit: (data: WorkForm, onSaved?: () => void) => save.mutate(data, { onSuccess: onSaved }),
  };
};

export default useWorkExperience;
