'use client';

import { api } from '@/lib/client-api';
import { workFormSchema } from '@/features/experience/schema';
import type { WorkForm } from '@/features/experience/schema';
import type { IWork } from '@/features/experience/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToastMessages } from '@/hooks/useToastMessages';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';

type SavedWork = Omit<WorkForm, 'current'>;

const EMPTY: WorkForm = {
  company: '',
  title: '',
  href: '',
  location: '',
  logoUrl: '',
  start: '',
  end: '',
  description: '',
  current: false,
};

/**
 * The body the API accepts, from the values the form holds.
 *
 * `current` is a question about `end`, not a column: ticking it drops the end month, so
 * an open role is stored as one with no end. Unticking it keeps whatever the owner picked
 * — an empty month stays empty rather than being filled with this month, which would
 * quietly date a role nobody dated.
 */
function toPayload({ current, start, end, logoUrl, ...rest }: WorkForm): SavedWork {
  return {
    ...rest,
    logoUrl: logoUrl ? logoUrl.split('?')[0] : '',
    start: start ?? '',
    end: current ? '' : (end ?? ''),
  };
}

/** Work experience list + CRUD and logo upload for the dashboard. */
const useWorkExperience = () => {
  const locale = useLocale();
  const { ok, fail } = useToastMessages();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<WorkForm>({
    resolver: zodResolver(workFormSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  /**
   * Back to a blank create form. `reset()` alone would not give one: `startEdit` passes
   * the record to `reset`, and react-hook-form adopts those values as the new defaults —
   * so the next "add" press would reopen already holding the last edited role.
   */
  const resetForm = () => reset({ ...EMPTY });

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
      const clean = toPayload(data);
      return clean._id ? api.put<IWork>(`/api/${locale}/admin/work`, clean) : api.post<IWork>(`/api/${locale}/admin/work`, clean);
    },
    onSuccess: () => {
      ok();
      resetForm();
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

  /**
   * The record decides its own state: a stored document with no end month — missing,
   * null or blank, all of which older records do use — opens as a current role.
   */
  const startEdit = (work: IWork) => {
    const end = work.end?.trim() ?? '';
    reset({ ...EMPTY, ...work, start: work.start?.trim() ?? '', end, current: !end, _id: work._id });
  };

  return {
    register,
    handleSubmit,
    setValue,
    watch,
    reset: resetForm,
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
