'use client';

import {
  CardListSkeleton,
  EmptyState,
  EntityCard,
  EntityList,
  ErrorState,
  FormActions,
  FormPanel,
  RowAction,
  SectionShell,
} from '@/features/dashboard/components';
import { iconDecider } from '@/components/icons';
import { Field } from '@/components/ui/field';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useConfirmDelete } from '@/features/dashboard/hooks/useConfirmDelete';
import { useFormPanel } from '@/hooks/useFormPanel';
import useSkills from '@/features/skills/hooks/useSkills';
import { SKILL_ICON_GROUPS, SKILL_ICONS } from '@/features/skills/constants';
import type { ISkill } from '@/features/skills/types';
import { ChevronDown, ChevronUp, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Skills section: the toolkit, now a record per pill rather than a bare name —
 * an icon and a place in the display order are edited like every other archive,
 * while the list stays flat rows because a skill is one word, not a document.
 */
const Skills = () => {
  const t = useTranslations('dashboard.skill');
  const td = useTranslations('dashboard');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    errors,
    skills,
    isPending,
    isError,
    error,
    refetchSkills,
    save,
    deleteSkill,
    deletingId,
    moveSkill,
    movingId,
    moving,
    startEdit,
    onSubmit,
  } = useSkills();

  const panel = useFormPanel();
  const confirm = useConfirmDelete(deleteSkill);

  const editingId = watch('_id');
  const selectedIcon = watch('icon');

  // An icon slug the catalogue has no label for stays readable as stored.
  const iconLabel = (value: string) => (t.has(`icons.${value}`) ? t(`icons.${value}`) : value);

  const closeForm = () => {
    panel.close();
    reset();
  };

  const beginCreate = () => {
    reset();
    panel.open();
  };

  const beginEdit = (skill: ISkill) => {
    startEdit(skill);
    panel.open();
  };

  return (
    <SectionShell
      title={t('title')}
      anchorRef={panel.anchorRef}
      action={
        !panel.isOpen && (
          <Button size="icon" variant="outline" onClick={beginCreate} aria-label={t('create')}>
            <Plus className="size-4" aria-hidden />
          </Button>
        )
      }
    >
      <FormPanel open={panel.isOpen} title={editingId ? t('edit') : t('create')} onClose={closeForm}>
        <form onSubmit={handleSubmit(data => onSubmit(data, panel.close))} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('name')} id="skill-name" error={errors.name?.message}>
              <Input id="skill-name" {...register('name')} placeholder={t('namePlaceholder')} autoComplete="off" />
            </Field>

            <Field label={t('icon')} id="skill-icon" error={errors.icon?.message}>
              <div className="flex items-center gap-3">
                {/* Controlled by the form value rather than left to the DOM: the panel mounts after
                    `reset()` has written the record, and an unattached uncontrolled select would
                    open on its placeholder — the owner's saved icon seeming lost. */}
                <Select id="skill-icon" {...register('icon')} value={selectedIcon ?? ''} className="sm:max-w-56">
                  <option value="">{t('selectIcon')}</option>
                  {/* Sectioned, because a flat list of this size cannot be scanned: the native
                      popup renders these as headings and still jumps by typed text within one. */}
                  {SKILL_ICON_GROUPS.map(section => (
                    <optgroup key={section.group} label={t(`iconGroups.${section.group}`)}>
                      {section.icons.map(icon => (
                        <option key={icon} value={icon}>
                          {iconLabel(icon)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  {/* A stored slug the picker does not list — a seeded or hand-written
                      record — still gets an option, so the select reads its value, not blank. */}
                  {selectedIcon && !SKILL_ICONS.includes(selectedIcon as (typeof SKILL_ICONS)[number]) && (
                    <option value={selectedIcon}>{iconLabel(selectedIcon)}</option>
                  )}
                </Select>
                {/* Seeing the glyph is the only way to know the slug picked the right one. */}
                {selectedIcon && (
                  <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                    {iconDecider(selectedIcon, 'size-4')}
                  </span>
                )}
              </div>
            </Field>
          </div>

          <FormActions
            submitLabel={editingId ? t('save') : t('create')}
            cancelLabel={td('cancel')}
            submitting={save.isPending}
            onCancel={closeForm}
          />
        </form>
      </FormPanel>

      {isPending ? (
        <CardListSkeleton rows={3} mark media={false} body={false} actions={4} />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchSkills()} />
      ) : skills && skills.length > 0 ? (
        <EntityList>
          {skills.map((skill, index) => (
            <EntityCard
              key={skill._id ?? `${skill.name}-${index}`}
              title={skill.name}
              leading={
                skill.icon ? (
                  <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                    {iconDecider(skill.icon, 'size-4')}
                  </span>
                ) : undefined
              }
              actions={
                <>
                  {/* The list order is the display order, so the arrows are the priority control. */}
                  <RowAction
                    label={t('moveUp')}
                    icon={ChevronUp}
                    disabled={index === 0 || moving}
                    pending={movingId === skill._id}
                    onClick={() => skill._id && moveSkill({ _id: skill._id, direction: -1 })}
                  />
                  <RowAction
                    label={t('moveDown')}
                    icon={ChevronDown}
                    disabled={index === skills.length - 1 || moving}
                    pending={movingId === skill._id}
                    onClick={() => skill._id && moveSkill({ _id: skill._id, direction: 1 })}
                  />
                  <RowAction label={td('edit')} icon={Pencil} onClick={() => beginEdit(skill)} />
                  <RowAction
                    label={td('delete')}
                    icon={Trash2}
                    danger
                    pending={deletingId === skill._id}
                    onClick={() => confirm.request(skill._id, skill.name)}
                  />
                </>
              }
            />
          ))}
        </EntityList>
      ) : (
        !panel.isOpen && <EmptyState icon={Sparkles} text={t('noSkills')} actionText={t('addFirstSkill')} onAction={beginCreate} />
      )}

      <ConfirmDialog {...confirm.dialogProps} />
    </SectionShell>
  );
};

export default Skills;
