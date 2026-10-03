'use client';

import { CheckboxField, EmptyState, ErrorState, Field, FormPanel, LoadingRows, SectionShell } from '@/components/dashboard/shared';
import ImageCropperDialog from '@/components/ui/image-cropper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import MarkdownEditor from '@/components/ui/markdown-editor';
import { Textarea } from '@/components/ui/textarea';
import useProjects from '@/hooks/dashboard/useProjects';
import { useFormPanel } from '@/hooks/dashboard/useFormPanel';
import { HOME_PROJECT_SLOTS } from '@/constants/global';
import ProjectRow from './Project-card';
import { cn, isOptimizableImage, localizedCount, slugify } from '@/lib/utils';
import type { AppLocale, IProject } from '@/types';
import { Plus, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRef, useState } from 'react';

/** Stored link kinds; the labels shown beside them live under `linkTypes`. */
const LINK_TYPES = ['github', 'demo', 'website', 'figma', 'docs', 'video', 'download'] as const;

/** Projects section: CRUD form (cover, slug, long-form body, links) + list. */
const Projects = () => {
  const t = useTranslations('dashboard.projects');
  const tLink = useTranslations('linkTypes');
  const tcrop = useTranslations('dashboard.crop');
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
    deleting,
    toggleFeatured,
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
  const [tech, setTech] = useState('');
  const [link, setLink] = useState({ type: '', href: '', icon: '' });
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  };

  const beginCreate = () => {
    reset();
    panel.open();
  };

  const beginEdit = (project: IProject) => {
    startEdit(project);
    panel.open();
  };

  return (
    <SectionShell
      title={t('title')}
      anchorRef={panel.anchorRef}
      action={
        !panel.isOpen && (
          <Button size="icon" variant="outline" className="size-8" onClick={beginCreate} aria-label={t('addProject')}>
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
          {/* Cover image */}
          <Field label={t('projectImage')} error={errors.image?.message} hint={t('uploadImageHint')}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex h-24 w-40 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/20 sm:h-28 sm:w-48">
                {image &&
                  (isOptimizableImage(image) ? (
                    <Image src={image} alt={t('projectImage')} fill sizes="192px" className="object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={t('projectImage')} className="size-full object-cover" />
                  ))}
                {image && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute end-1.5 top-1.5 size-6 rounded-full"
                    onClick={() => deleteImage.mutate()}
                    disabled={deleteImage.isPending}
                    aria-label={t('removeImage')}
                  >
                    {deleteImage.isPending ? <Loading size="sm" /> : <X className="size-3" aria-hidden />}
                  </Button>
                )}
              </div>
              <div className="flex flex-col items-start gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadImage.isPending}>
                  {uploadImage.isPending ? <Loading size="sm" className="me-2" /> : null}
                  {t('uploadImage')}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setCropSrc(URL.createObjectURL(file));
                    setCropOpen(true);
                  }}
                />
              </div>
            </div>
          </Field>

          <ImageCropperDialog
            open={cropOpen}
            onOpenChange={v => {
              setCropOpen(v);
              if (!v && cropSrc) {
                URL.revokeObjectURL(cropSrc);
                setCropSrc(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
            }}
            src={cropSrc}
            aspect={16 / 9}
            labels={{ title: tcrop('title'), apply: tcrop('apply'), cancel: t('cancel'), zoom: tcrop('zoom'), move: tcrop('move') }}
            outputSize={1600}
            onCropped={file => {
              const formData = new FormData();
              formData.append('image', file);
              uploadImage.mutate(formData);
            }}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('projectTitle')} id="project-title" error={errors.title?.message}>
              <Input id="project-title" {...register('title')} placeholder={t('projectTitlePlaceholder')} />
            </Field>
            <Field label={t('projectSlug')} id="project-slug" error={errors.slug?.message} hint={t('projectSlugHint')}>
              <Input
                id="project-slug"
                value={autoSlug}
                onChange={e => setValue('slug', e.target.value, { shouldValidate: true, shouldDirty: true })}
                placeholder={t('projectSlugPlaceholder')}
                dir="ltr"
              />
            </Field>
            <Field label={t('projectUrl')} id="project-href" error={errors.href?.message}>
              <Input id="project-href" {...register('href')} placeholder={t('projectUrlPlaceholder')} type="url" dir="ltr" />
            </Field>
            <Field label={t('projectDates')} id="project-dates" error={errors.dates?.message}>
              <Input id="project-dates" {...register('dates')} placeholder={t('projectDatesPlaceholder')} />
            </Field>
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

          <Field label={t('projectDescription')} id="project-description" error={errors.description?.message} hint={t('projectDescriptionHint')}>
            <Textarea id="project-description" rows={3} {...register('description')} placeholder={t('projectDescriptionPlaceholder')} />
          </Field>

          {/* Technologies */}
          <Field label={t('technologies')} error={errors.technologies?.message}>
            <div className="flex gap-2">
              <Input
                value={tech}
                onChange={e => setTech(e.target.value)}
                placeholder={t('technologyPlaceholder')}
                aria-label={t('technologyPlaceholder')}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTechnology(tech);
                    setTech('');
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  addTechnology(tech);
                  setTech('');
                }}
              >
                {t('add')}
              </Button>
            </div>
            {technologies.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {technologies.map((item, index) => (
                  <li key={`${item}-${index}`}>
                    <Badge variant="secondary" onDelete={() => removeTechnology(index)}>
                      {item}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Field>

          {/* Links */}
          <Field label={t('projectLinks')} error={errors.links?.message}>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={link.type}
                onChange={e => setLink({ ...link, type: e.target.value, icon: e.target.value })}
                aria-label={t('selectLinkType')}
                className={cn('control sm:max-w-48')}
              >
                <option value="">{t('selectLinkType')}</option>
                {LINK_TYPES.map(value => (
                  <option key={value} value={value}>
                    {tLink(value)}
                  </option>
                ))}
              </select>
              <Input
                value={link.href}
                onChange={e => setLink({ ...link, href: e.target.value })}
                placeholder={t('linkUrlPlaceholder')}
                type="url"
                dir="ltr"
                aria-label={t('linkUrl')}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={!link.type || !link.href}
                onClick={() => {
                  addLink(link);
                  setLink({ type: '', href: '', icon: '' });
                }}
              >
                {t('add')}
              </Button>
            </div>
            {links.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {links.map((item, index) => (
                  <li key={`${item.type}-${index}`}>
                    <Badge variant="secondary" onDelete={() => removeLink(index)}>
                      {linkLabel(item.type)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Field>

          {/* Long-form body shown on the project page */}
          <Field label={t('projectDetails')} error={errors.details?.message} hint={t('projectDetailsHint')}>
            <MarkdownEditor
              value={details ?? ''}
              onChange={value => setValue('details', value, { shouldValidate: true, shouldDirty: true })}
              height={320}
            />
          </Field>

          <div className="flex gap-2 max-sm:flex-col">
            <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto">
              {save.isPending ? <Loading size="sm" className="me-2" /> : null}
              {editingId ? t('update') : t('create')}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm} className="w-full sm:w-auto">
              {t('cancel')}
            </Button>
          </div>
        </form>
      </FormPanel>

      {isPending ? (
        <LoadingRows />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchProjects()} />
      ) : projects && projects.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {t('homeSlots', {
              used: localizedCount(homePicks.length, lang),
              total: localizedCount(HOME_PROJECT_SLOTS, lang),
            })}
          </p>
          {projects.map(project => (
            <ProjectRow
              key={project._id}
              project={project}
              onEdit={beginEdit}
              onDelete={id => deleteProject(id)}
              isDeleting={deleting}
              homePosition={homePosition(project._id)}
              slotsFull={homePicks.length >= HOME_PROJECT_SLOTS}
              onToggleHome={project => toggleFeatured.mutate(project)}
              togglingHome={toggleFeatured.isPending}
            />
          ))}
        </div>
      ) : (
        !panel.isOpen && <EmptyState text={t('noProjects')} actionText={t('createFirstProject')} onAction={beginCreate} />
      )}
    </SectionShell>
  );
};

export default Projects;
