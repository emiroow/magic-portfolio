'use client';

import { api } from '@/lib/client-api';
import { educationSchema } from '@/features/education/schema';
import type { IEducation } from '@/features/education/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToastMessages } from '@/hooks/useToastMessages';
import { useLocale } from 'next-intl';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Same schema as the API plus the optional document id for edits.
const formSchema = educationSchema.extend({ _id: z.string().optional() });
type EducationForm = z.infer<typeof formSchema>;

const EMPTY: EducationForm = { school: '', degree: '', href: '', logoUrl: '', start: '', end: '' };

/** Education list + CRUD and logo upload for the dashboard. */
const useEducation = () => {
  const locale = useLocale();
  const { ok, fail } = useToastMessages();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<EducationForm>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const {
    data: educations,
    isPending,
    isError,
    error,
    refetch: refetchEducations,
  } = useQuery({
    queryKey: ['educations', locale],
    queryFn: () => api.get<IEducation[]>(`/api/${locale}/admin/education`),
  });

  const save = useMutation({
    mutationFn: (data: EducationForm) => {
      // Store clean URLs: strip the display-only ?cb= cache buster.
      const clean = { ...data, logoUrl: data.logoUrl ? data.logoUrl.split('?')[0] : '' };
      return clean._id ? api.put<IEducation>(`/api/${locale}/admin/education`, clean) : api.post<IEducation>(`/api/${locale}/admin/education`, clean);
    },
    onSuccess: () => {
      ok();
      reset();
      refetchEducations();
    },
    onError: () => fail(),
  });

  const { mutate: deleteEducation, isPending: deleting } = useMutation({
    mutationFn: (id: string) => api.del(`/api/${locale}/admin/education?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      ok();
      refetchEducations();
    },
    onError: () => fail(),
  });

  const uploadLogo = useMutation({
    mutationFn: (formData: FormData) => api.upload<{ fileUrl: string }>(`/api/${locale}/admin/upload?lang=${locale}&type=education`, formData),
    onSuccess: ({ fileUrl }) => {
      setValue('logoUrl', `${fileUrl.split('?')[0]}?cb=${Date.now()}`, { shouldDirty: true });
      trigger('logoUrl');
    },
    onError: () => fail(),
  });

  const deleteLogo = useMutation({
    mutationFn: () => {
      const fileName = getValues('logoUrl')?.split('/').pop()?.split('?')[0];
      return api.del(`/api/${locale}/admin/upload?lang=${locale}&type=education&fileName=${encodeURIComponent(fileName ?? '')}`);
    },
    onSuccess: () => {
      setValue('logoUrl', '', { shouldDirty: true });
      trigger('logoUrl');
    },
    onError: () => fail(),
  });

  const startEdit = (education: IEducation) => reset({ ...EMPTY, ...education, _id: education._id });

  return {
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
    refetchEducations,
    save,
    deleteEducation,
    deleting,
    uploadLogo,
    deleteLogo,
    startEdit,
    fileInputRef,
    onSubmit: (data: EducationForm, onSaved?: () => void) => save.mutate(data, { onSuccess: onSaved }),
  };
};

export default useEducation;
