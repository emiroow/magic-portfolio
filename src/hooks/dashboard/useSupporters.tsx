'use client';

import { api } from '@/lib/client-api';
import type { ISupporter, SupporterStatus } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useToastMessages } from './useToastMessages';

/**
 * Support records for the dashboard: the list the owner works through to confirm
 * card-to-card and crypto transfers, and the three switches on each row (status,
 * wall visibility, private note). Records are created by visitors, never here.
 */
const useSupporters = () => {
  const locale = useLocale();
  const { ok, fail } = useToastMessages();
  const queryClient = useQueryClient();

  const {
    data: supporters,
    isPending,
    isError,
    error,
    refetch: refetchSupporters,
  } = useQuery({
    queryKey: ['supporters', locale],
    queryFn: () => api.get<ISupporter[]>(`/api/${locale}/admin/supporter`),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['supporters', locale] });

  const update = useMutation({
    mutationFn: (body: { _id: string; status?: SupporterStatus; showOnWall?: boolean; note?: string }) =>
      api.put<ISupporter>(`/api/${locale}/admin/supporter`, body),
    onSuccess: () => {
      ok();
      refresh();
    },
    onError: () => fail(),
  });

  const { mutate: removeSupporter, isPending: deleting } = useMutation({
    mutationFn: (id: string) => api.del(`/api/${locale}/admin/supporter?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      ok();
      refresh();
    },
    onError: () => fail(),
  });

  const setStatus = (record: ISupporter, status: SupporterStatus) => update.mutate({ _id: record._id!, status });
  const toggleWall = (record: ISupporter) => update.mutate({ _id: record._id!, showOnWall: record.showOnWall === false });
  const saveNote = (record: ISupporter, note: string) => update.mutate({ _id: record._id!, note: note.trim() });

  return {
    supporters,
    isPending,
    isError,
    error,
    refetchSupporters,
    update,
    removeSupporter,
    deleting,
    setStatus,
    toggleWall,
    saveNote,
  };
};

export default useSupporters;
