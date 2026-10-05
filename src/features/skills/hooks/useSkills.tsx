'use client';

import { api } from '@/lib/client-api';
import type { ISkill } from '@/features/skills/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToastMessages } from '@/hooks/useToastMessages';
import { useLocale } from 'next-intl';

/** Skills list + add/delete mutations for the dashboard. */
const useSkills = () => {
  const locale = useLocale();
  const { ok, fail } = useToastMessages();

  const {
    data: skills,
    isPending,
    isError,
    error,
    refetch: refetchSkills,
  } = useQuery({
    queryKey: ['skills', locale],
    queryFn: () => api.get<ISkill[]>(`/api/${locale}/admin/skill`),
  });

  const { mutate: addSkill, isPending: adding } = useMutation({
    mutationFn: (name: string) => api.post<ISkill>(`/api/${locale}/admin/skill`, { name }),
    onSuccess: () => {
      ok();
      refetchSkills();
    },
    onError: () => fail(),
  });

  const { mutate: deleteSkill, isPending: deleting } = useMutation({
    mutationFn: (id: string) => api.del(`/api/${locale}/admin/skill?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      ok();
      refetchSkills();
    },
    onError: () => fail(),
  });

  return { skills, isPending, isError, error, addSkill, adding, deleteSkill, deleting, refetchSkills };
};

export default useSkills;
