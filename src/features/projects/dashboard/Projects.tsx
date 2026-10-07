'use client';

import {
  CardListSkeleton,
  ChipInput,
  ChipList,
  EmptyState,
  EntityList,
  ErrorState,
  FormActions,
  FormPanel,
  ImageField,
  SectionShell,
} from '@/features/dashboard/components';
import ProjectRow from '@/features/projects/dashboard/ProjectRow';
import { CheckboxField, Field } from '@/components/ui/field';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import MarkdownEditor from '@/components/ui/markdown-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useConfirmDelete } from '@/features/dashboard/hooks/useConfirmDelete';
import { useFormPanel } from '@/hooks/useFormPanel';
import useProjects from '@/features/projects/hooks/useProjects';
import { HOME_PROJECT_SLOTS } from '@/features/projects/constants';
import { localizedCount, slugify } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IProject } from '@/features/projects/types';
import { FolderGit2, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

/** Stored link kinds; the labels shown beside them live under `linkTypes`. */
const LINK_TYPES = ['github', 'demo', 'website', 'figma', 'docs', 'video', 'download'] as const;

const EMPTY_LINK = { type: '', href: '', icon: '' };

/** Projects section: cover, slug, long-form body and outbound links. */
const Projects = () => {
  const t = useTranslations('dashboard.projects');
  const td = useTranslations('dashboard');
  const tLink = useTranslations('linkTypes');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    errors,
    projects,
    isPending,
    isError,
    error,
    save,
    deleteProject,
    deletingId,
    toggleFeatured,
    togglingFeaturedId,
    uploadImage,
    deleteImage,
    addTechnology,
    removeTechnology,
    addLink,
    removeLink,
    startEdit,
    onSubmit,
    refetchProjects,
  } = useProjects();

  const panel = useFormPanel();
  const confirm = useConfirmDelete(deleteProject);
  const [link, setLink] = useState(EMPTY_LINK);

  const title = watch('title');
  const details = watch('details');
  const editingId = watch('_id');
  const image = watch('image');
  const technologies = watch('technologies') ?? [];
  const links = watch('links') ?? [];
  const published = watch('active');
  const featured = watch('featured');

  // Home page picks, in the order the site renders them (newest first).
  const homePicks = (projects ?? []).filter(project => project.active && project.featured);
  const homePosition = (id?: string) => {
    const index = homePicks.findIndex(project => project._id === id);
    return index === -1 ? 0 : index + 1;
  };

  // Slots: the project being edited must not count against itself.
  const takenByOthers = homePicks.filter(project => project._id !== editingId).length;
  const slotsFull = takenByOthers >= HOME_PROJECT_SLOTS;
  const openSlots = Math.max(HOME_PROJECT_SLOTS - takenByOthers - (featured ? 1 : 0), 0);
  const featuredHint = !published
    ? t('featuredNeedsPublish')
    : slotsFull && !featured
      ? t('featuredFull')
      : featured && openSlots === 0
        ? t('featuredAllUsed')
        : t('featuredHint', { count: localizedCount(openSlots, lang) });

  // Slug drives `/projects/[slug]`; it is auto-derived until edited by hand.
  const autoSlug = !editingId && title ? slugify(title) : watch('slug');

  // A stored type is a slug, so anything unexpected falls through readable.
  const linkLabel = (value: string) => (tLink.has(value) ? tLink(value) : value);

  const closeForm = () => {
    panel.close();
    reset();
    setLink(EMPTY_LINK);
  };

  const beginCreate = () => {
    reset();
    panel.open();
  };

  const beginEdit = (project: IProject) => {
    startEdit(project);
    panel.open();
  };

  const commitLink = () => {
    addLink(link);
    setLink(EMPTY_LINK);
  };

  return (
    <SectionShell
      title={t('title')}
      anchorRef={panel.anchorRef}
      action={
        !panel.isOpen && (
          <Button size="icon" variant="outline" onClick={beginCreate} aria-label={t('addProject')}>
            <Plus className="size-4" aria-hidden />
          </Button>
        )
      }
    >
      <FormPanel open={panel.isOpen} title={editingId ? t('editProject') : t('createProject')} onClose={closeForm}>
        <form
          onSubmit={handleSubmit(data => onSubmit({ ...data, slug: autoSlug, featured: data.active && Boolean(data.featured) }, panel.close))}
          className="space-y-5"
        >
          <ImageField
            label={t('projectImage')}
            alt={title || t('projectImage')}
            value={image}
            error={errors.image?.message}
            hint={td('image.hint')}
            frameClassName="h-24 w-40 rounded-lg sm:h-28 sm:w-48"
            aspect={16 / 9}
            outputSize={1600}
            uploading={uploadImage.isPending}
            removing={deleteImage.isPending}
            onRemove={() => deleteImage.mutate()}
            onUpload={file => {
              const formData = new FormData();
              formData.append('image', file);
              uploadImage.mutate(formData);
            }}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('projectTitle')} id="project-title" error={errors.title?.message}>
              <Input id="project-title" {...register('title')} placeholder={t('projectTitlePlaceholder')} autoComplete="off" />
            </Field>
            <Field label={t('projectSlug')} id="project-slug" error={errors.slug?.message} hint={t('projectSlugHint')}>
              <Input
                id="project-slug"
                dir="ltr"
                value={autoSlug}
                onChange={event => setValue('slug', event.target.value, { shouldValidate: true, shouldDirty: true })}
                placeholder={t('projectSlugPlaceholder')}
                autoComplete="off"
              />
            </Field>
            <Field label={t('projectUrl')} id="project-href" error={errors.href?.message}>
              <Input id="project-href" type="url" dir="ltr" {...register('href')} placeholder={t('projectUrlPlaceholder')} autoComplete="off" />
            </Field>
            <Field label={t('projectDates')} id="project-dates" error={errors.dates?.message}>
              <Input id="project-dates" {...register('dates')} placeholder={t('projectDatesPlaceholder')} autoComplete="off" />
            </Field>
          </div>

          <Field label={t('projectDescription')} id="project-description" error={errors.description?.message} hint={t('projectDescriptionHint')}>
            <Textarea id="project-description" rows={3} {...register('description')} placeholder={t('projectDescriptionPlaceholder')} />
          </Field>

          <ChipInput
            label={t('technologies')}
            error={errors.technologies?.message}
            items={technologies}
            onAdd={addTechnology}
            onRemove={removeTechnology}
            placeholder={t('technologyPlaceholder')}
            addLabel={td('add')}
          />

          <Field label={t('projectLinks')} error={errors.links?.message}>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={link.type}
                onChange={event => setLink({ ...link, type: event.target.value, icon: event.target.value })}
                aria-label={t('selectLinkType')}
                className="sm:max-w-48"
              >
                <option value="">{t('selectLinkType')}</option>
                {LINK_TYPES.map(value => (
                  <option key={value} value={value}>
                    {tLink(value)}
                  </option>
                ))}
              </Select>
              <Input
                type="url"
                dir="ltr"
                value={link.href}
                onChange={event => setLink({ ...link, href: event.target.value })}
                placeholder={t('linkUrlPlaceholder')}
                aria-label={t('linkUrl')}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full"
                disabled={!link.type || !link.href}
                onClick={commitLink}
              >
                <Plus className="me-1.5 size-3.5" aria-hidden />
                {td('add')}
              </Button>
            </div>
            <ChipList items={links} onRemove={removeLink} renderChip={item => linkLabel(item.type)} />
          </Field>

          {/* Long-form body shown on the project page */}
          <Field label={t('projectDetails')} error={errors.details?.message} hint={t('projectDetailsHint')}>
            <MarkdownEditor
              value={details ?? ''}
              onChange={value => setValue('details', value, { shouldValidate: true, shouldDirty: true })}
              placeholder={td('markdown.placeholder')}
              height={320}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CheckboxField
              id="project-active"
              label={t('active')}
              {...register('active')}
              onChange={event => {
                setValue('active', event.target.checked, { shouldDirty: true, shouldValidate: true });
                // An unpublished project cannot hold a home page slot.
                if (!event.target.checked) setValue('featured', false, { shouldDirty: true });
              }}
            />
            <CheckboxField
              id="project-featured"
              label={t('featured')}
              hint={featuredHint}
              {...register('featured')}
              disabled={!published || (slotsFull && !featured)}
            />
          </div>

          <FormActions
            submitLabel={editingId ? t('update') : t('create')}
            cancelLabel={td('cancel')}
            submitting={save.isPending}
            onCancel={closeForm}
          />
        </form>
      </FormPanel>

      {isPending ? (
        <CardListSkeleton />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchProjects()} />
      ) : projects && projects.length > 0 ? (
        <>
          <p aria-live="polite" className="mb-3 text-xs text-muted-foreground">
            {t('homeSlots', { used: localizedCount(homePicks.length, lang), total: localizedCount(HOME_PROJECT_SLOTS, lang) })}
          </p>
          <EntityList>
            {projects.map(project => (
              <ProjectRow
                key={project._id}
                project={project}
                onEdit={beginEdit}
                onDelete={item => confirm.request(item._id, item.title)}
                deleting={deletingId === project._id}
                homePosition={homePosition(project._id)}
                slotsFull={homePicks.length >= HOME_PROJECT_SLOTS}
                onToggleHome={item => toggleFeatured(item)}
                togglingHome={togglingFeaturedId === project._id}
              />
            ))}
          </EntityList>
        </>
      ) : (
        !panel.isOpen && <EmptyState icon={FolderGit2} text={t('noProjects')} actionText={t('createFirstProject')} onAction={beginCreate} />
      )}

      <ConfirmDialog {...confirm.dialogProps} />
    </SectionShell>
  );
};

export default Projects;
