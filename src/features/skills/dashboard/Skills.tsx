'use client';

import { ChipList, ChipListSkeleton, EmptyState, ErrorState, SectionShell } from '@/features/dashboard/components';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useConfirmDelete } from '@/features/dashboard/hooks/useConfirmDelete';
import useSkills from '@/features/skills/hooks/useSkills';
import { Plus, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

/**
 * Skills section: the one archive that is a flat set of names rather than records,
 * so it gets a composer and chips instead of a panel and cards.
 */
const Skills = () => {
  const t = useTranslations('dashboard.skill');
  const { skills, isPending, isError, error, addSkill, adding, deleteSkill, refetchSkills } = useSkills();

  const [name, setName] = useState('');
  const confirm = useConfirmDelete(deleteSkill);

  const value = name.trim();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!value || adding) return;
    // The draft survives a rejected save: losing what was typed makes a failed
    // request cost the owner the work, not just the round trip.
    addSkill(value, { onSuccess: () => setName('') });
  };

  return (
    <SectionShell title={t('title')}>
      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder={t('inputPlaceholder')}
          aria-label={t('inputPlaceholder')}
          className="max-w-sm rounded-full"
        />
        <Button type="submit" disabled={!value || adding} className="shrink-0 rounded-full">
          <Plus className="me-2 size-4" aria-hidden />
          {t('add')}
        </Button>
      </form>

      <div className="mt-6">
        {isPending ? (
          <ChipListSkeleton />
        ) : isError ? (
          <ErrorState message={error?.message} onRetry={() => refetchSkills()} />
        ) : skills && skills.length > 0 ? (
          <ChipList
            items={skills.map(skill => skill.name)}
            variant="outline"
            className="flex flex-wrap gap-2"
            chipClassName="px-3 py-1 text-xs font-normal"
            onRemove={index => confirm.request(skills[index]?._id, skills[index]?.name)}
          />
        ) : (
          <EmptyState icon={Sparkles} text={t('noSkills')} />
        )}
      </div>

      <ConfirmDialog {...confirm.dialogProps} />
    </SectionShell>
  );
};

export default Skills;
