'use client';

import { EmptyState, ErrorState, SectionShell } from '@/features/dashboard/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import useSkills from '@/features/skills/hooks/useSkills';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

/** Skills section: add skills one by one, delete with confirmation. */
const Skills = () => {
  const t = useTranslations('dashboard.skill');
  const { skills, isPending, isError, error, addSkill, adding, deleteSkill, refetchSkills } = useSkills();

  const [name, setName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value || adding) return;
    addSkill(value);
    setName('');
  };

  return (
    <SectionShell title={t('title')}>
      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('inputPlaceholder')}
          aria-label={t('inputPlaceholder')}
          className="max-w-sm rounded-full"
        />
        <Button type="submit" disabled={!name.trim() || adding} className="shrink-0 rounded-full">
          <Plus className="me-2 size-4" aria-hidden />
          {t('add')}
        </Button>
      </form>

      <div className="mt-6">
        {isPending ? (
          <div className="flex flex-wrap gap-2" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={error?.message} onRetry={() => refetchSkills()} />
        ) : skills && skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <Badge
                key={skill._id}
                variant="outline"
                className="px-3 py-1 text-xs font-normal"
                onDelete={() => skill._id && setPendingDelete(skill._id)}
              >
                {skill.name}
              </Badge>
            ))}
          </div>
        ) : (
          <EmptyState text={t('noSkills')} />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={open => !open && setPendingDelete(null)}
        itemName={skills?.find(s => s._id === pendingDelete)?.name}
        onConfirm={() => {
          if (pendingDelete) deleteSkill(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </SectionShell>
  );
};

export default Skills;
