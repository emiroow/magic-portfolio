'use client';

import { api } from '@/lib/client-api';
import { skillSchema } from '@/features/skills/schema';
import type { ISkill } from '@/features/skills/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToastMessages } from '@/hooks/useToastMessages';
import { pendingRecordId } from '@/hooks/pendingRecordId';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Same schema as the API plus the optional document id for edits.
const formSchema = skillSchema.extend({ _id: z.string().optional() });
type SkillForm = z.infer<typeof formSchema>;

const EMPTY: SkillForm = { name: '', icon: '' };

/** Direction a row moves: one place up the priority list, or one place down. */
type MoveDirection = -1 | 1;

/** Skills list + CRUD and the display-priority moves for the dashboard. */
const useSkills = () => {
  const locale = useLocale();
  const t = useTranslations('dashboard.skill');
  const { ok, fail, warn } = useToastMessages();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SkillForm>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

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

  const save = useMutation({
    mutationFn: (data: SkillForm) => {
      // A new skill joins the toolkit at the end of the list; the row arrows lift it.
      const body: SkillForm = data._id ? data : { ...data, order: skills?.length ?? 0 };
      return body._id ? api.put<ISkill>(`/api/${locale}/admin/skill`, body) : api.post<ISkill>(`/api/${locale}/admin/skill`, body);
    },
    onSuccess: () => {
      ok();
      reset(EMPTY);
      refetchSkills();
    },
    onError: () => fail(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/${locale}/admin/skill?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      ok();
      refetchSkills();
    },
    onError: () => fail(),
  });

  /**
   * One row up or down.
   *
   * The list is re-ranked by position and only the rows whose rank actually changed
   * are written, so a steady-state move costs two updates. The first move on records
   * saved before ordering existed pins every rank instead — a one-time settle, after
   * which the dashboard order and the home page order are the same numbers. A row
   * sitting at rank 0 is already where it sorts, so it is left alone rather than
   * written a value that changes nothing.
   */
  const move = useMutation({
    mutationFn: async ({ _id, direction }: { _id: string; direction: MoveDirection }) => {
      const list = [...(skills ?? [])];
      const index = list.findIndex(skill => skill._id === _id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= list.length) return;

      const [moved] = list.splice(index, 1);
      list.splice(target, 0, moved);

      await Promise.all(
        list
          .map((skill, position) =>
            (skill.order ?? 0) === position ? null : api.put(`/api/${locale}/admin/skill`, { _id: skill._id, order: position })
          )
          .filter(Boolean)
      );
    },
    onSuccess: () => {
      ok();
      refetchSkills();
    },
    onError: () => fail(),
  });

  const startEdit = (skill: ISkill) => reset({ ...EMPTY, ...skill, icon: skill.icon ?? '', _id: skill._id });

  return {
    register,
    handleSubmit,
    reset: () => reset(EMPTY),
    watch,
    setValue,
    errors,
    skills,
    isPending,
    isError,
    error,
    refetchSkills,
    save,
    deleteSkill: deleteMutation.mutate,
    deletingId: pendingRecordId(deleteMutation),
    moveSkill: move.mutate,
    movingId: pendingRecordId(move),
    /** Ranks travel between rows, so a second move in flight would re-rank a stale list. */
    moving: move.isPending,
    startEdit,
    // The panel closes only on a saved record; a rejected save leaves it editable.
    onSubmit: (data: SkillForm, onSaved?: () => void) => {
      // Two pills of one name read as a mistake on the site, and nothing on the API
      // refuses the second one — so the list checks before it is filed.
      const name = data.name.trim().toLowerCase();
      if (name && (skills ?? []).some(skill => skill._id !== data._id && skill.name.trim().toLowerCase() === name)) {
        warn(t('duplicateSkill'));
        return;
      }
      save.mutate(data, { onSuccess: onSaved });
    },
  };
};

export default useSkills;
