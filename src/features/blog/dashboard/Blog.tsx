'use client';

import { CheckboxField, EmptyState, ErrorState, Field, FormPanel, LoadingRows, SectionShell } from '@/features/dashboard/shared';
import BlogRow from '@/features/blog/dashboard/Blog-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ImageCropperDialog from '@/components/ui/image-cropper';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import MarkdownEditor from '@/components/ui/markdown-editor';
import useBlog from '@/features/blog/hooks/useBlog';
import { useFormPanel } from '@/hooks/useFormPanel';
import { FilterChip } from '@/components/ui/filter-chip';
import { HOME_BLOG_SLOTS } from '@/features/blog/constants';
import { isOptimizableImage, localizedCount, slugify } from '@/lib/utils';
import type { IBlog } from '@/features/blog/types';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

/** Listing filter. */
const STATUSES = ['all', 'published', 'draft'] as const;
type Status = (typeof STATUSES)[number];

const isDraft = (post: IBlog) => post.published === false;

/** Blog section: markdown editor with cover, tags, drafts and search. */
const Blog = () => {
  const t = useTranslations('dashboard.blog');
  const tDash = useTranslations('dashboard');
  const tcrop = useTranslations('dashboard.crop');
  const locale = useLocale();
  const lang = locale === 'fa' ? 'fa' : 'en';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    errors,
    posts,
    isPending,
    isError,
    error,
    save,
    deletePost,
    deleting,
    togglePublished,
    toggleFeatured,
    uploadCover,
    deleteCover,
    startEdit,
    addTag,
    removeTag,
    onSubmit,
    refetchPosts,
  } = useBlog();

  const panel = useFormPanel();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [tagInput, setTagInput] = useState('');
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const title = watch('title');
  const content = watch('content');
  const tags = watch('tags') ?? [];
  const image = watch('image');
  const editingId = watch('_id');
  const published = watch('published');
  const featured = watch('featured');

  // Auto-derive the slug from the title while creating; a touched slug wins.
  const autoSlug = !editingId && title ? slugify(title) : watch('slug');

  const words = (content || '').trim().split(/\s+/).filter(Boolean).length;

  const closeForm = () => {
    panel.close();
    reset();
    setTagInput('');
  };

  const beginCreate = () => {
    reset();
    panel.open();
  };

  const beginEdit = (post: IBlog) => {
    startEdit(post);
    panel.open();
  };

  const commitTag = () => {
    addTag(tagInput);
    setTagInput('');
  };

  const filtered = (posts ?? []).filter(post => {
    if (status === 'published' && isDraft(post)) return false;
    if (status === 'draft' && !isDraft(post)) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
      post.title.toLowerCase().includes(needle) ||
      post.slug.toLowerCase().includes(needle) ||
      (post.tags ?? []).some(tag => tag.toLowerCase().includes(needle))
    );
  });

  const drafts = (posts ?? []).filter(isDraft).length;

  // Home page picks, in the order the site renders them (newest first).
  const homePicks = (posts ?? []).filter(post => !isDraft(post) && post.featured);
  const homePosition = (id?: string) => {
    const index = homePicks.findIndex(post => post._id === id);
    return index === -1 ? 0 : index + 1;
  };

  // Slots: the post being edited must not count against itself.
  const takenByOthers = homePicks.filter(post => post._id !== editingId).length;
  const slotsFull = takenByOthers >= HOME_BLOG_SLOTS;
  const openSlots = Math.max(HOME_BLOG_SLOTS - takenByOthers - (featured ? 1 : 0), 0);
  const featuredHint = !published
    ? t('featuredNeedsPublish')
    : slotsFull && !featured
      ? t('featuredFull')
      : featured && openSlots === 0
        ? t('featuredAllUsed')
        : t('featuredHint', { count: localizedCount(openSlots, lang) });

  return (
    <SectionShell
      title={t('title')}
      anchorRef={panel.anchorRef}
      action={
        !panel.isOpen && (
          <Button size="icon" variant="outline" className="size-8" onClick={beginCreate} aria-label={t('createBlog')}>
            <Plus className="size-4" aria-hidden />
          </Button>
        )
      }
    >
      <FormPanel open={panel.isOpen} title={editingId ? t('edit') : t('createBlog')} onClose={closeForm}>
        <form
          onSubmit={handleSubmit(data =>
            onSubmit({ ...data, slug: autoSlug, featured: (data.published ?? true) && Boolean(data.featured) }, panel.close)
          )}
          className="space-y-5"
        >
          {/* Cover image */}
          <Field label={t('coverImage')} error={errors.image?.message} hint={t('uploadImageHint')}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex h-20 w-32 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/20">
                {image &&
                  (isOptimizableImage(image) ? (
                    <Image src={image} alt={t('coverImage')} fill sizes="128px" className="object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={t('coverImage')} className="size-full object-cover" />
                  ))}
              </div>
              <div className="flex flex-col items-start gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadCover.isPending}>
                  {uploadCover.isPending ? <Loading size="sm" className="me-2" /> : null}
                  {t('uploadImage')}
                </Button>
                {image && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => deleteCover.mutate()} disabled={deleteCover.isPending}>
                    {t('removeImage')}
                  </Button>
                )}
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
            labels={{ title: tcrop('title'), apply: tcrop('apply'), cancel: tDash('cancel'), zoom: tcrop('zoom'), move: tcrop('move') }}
            outputSize={1200}
            onCropped={file => {
              const formData = new FormData();
              formData.append('image', file);
              uploadCover.mutate(formData);
            }}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('titleLabel')} id="blog-title" error={errors.title?.message}>
              <Input id="blog-title" {...register('title')} placeholder={t('titlePlaceholder')} />
            </Field>
            <Field label={t('slugLabel')} id="blog-slug" error={errors.slug?.message} hint={t('slugHint')}>
              <Input
                id="blog-slug"
                value={autoSlug}
                onChange={e => setValue('slug', e.target.value, { shouldValidate: true, shouldDirty: true })}
                placeholder={t('slugPlaceholder')}
                dir="ltr"
              />
            </Field>
          </div>

          <Field label={t('summaryLabel')} id="blog-summary" error={errors.summary?.message} hint={t('summaryHint')}>
            <Input id="blog-summary" {...register('summary')} placeholder={t('summaryPlaceholder')} />
          </Field>

          {/* Tags */}
          <Field label={t('tagsLabel')} error={errors.tags?.message} hint={t('tagsHint')}>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    commitTag();
                  }
                }}
                placeholder={t('tagsPlaceholder')}
                aria-label={t('tagsPlaceholder')}
              />
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={commitTag}>
                {tDash('add')}
              </Button>
            </div>
            {tags.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {tags.map((tag, index) => (
                  <li key={`${tag}-${index}`}>
                    <Badge variant="secondary" onDelete={() => removeTag(index)}>
                      {tag}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CheckboxField
              id="blog-published"
              label={t('published')}
              {...register('published')}
              onChange={event => {
                setValue('published', event.target.checked, { shouldDirty: true, shouldValidate: true });
                // A draft cannot hold a home page slot.
                if (!event.target.checked) setValue('featured', false, { shouldDirty: true });
              }}
            />
            <CheckboxField
              id="blog-featured"
              label={t('featured')}
              hint={featuredHint}
              {...register('featured')}
              disabled={!published || (slotsFull && !featured)}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t('wordCount', { count: localizedCount(words, lang) })}</p>

          <Field label={t('contentLabel')} error={errors.content?.message}>
            {/* The editor is uncontrolled from RHF's perspective; sync via setValue. */}
            <MarkdownEditor
              value={content ?? ''}
              onChange={value => setValue('content', value, { shouldValidate: true, shouldDirty: true })}
              height={360}
            />
          </Field>

          <div className="flex gap-2 max-sm:flex-col">
            <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto">
              {save.isPending ? <Loading size="sm" className="me-2" /> : null}
              {t('save')}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm} className="w-full sm:w-auto">
              {tDash('cancel')}
            </Button>
          </div>
        </form>
      </FormPanel>

      {isPending ? (
        <LoadingRows />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchPosts()} />
      ) : posts && posts.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {t('homeSlots', {
              used: localizedCount(homePicks.length, lang),
              total: localizedCount(HOME_BLOG_SLOTS, lang),
            })}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              className="sm:max-w-xs"
            />
            <div className="flex gap-1.5" role="group" aria-label={t('statusFilter')}>
              {STATUSES.map(value => (
                <FilterChip key={value} active={status === value} onClick={() => setStatus(value)}>
                  {t(value)}
                  {value === 'draft' && drafts > 0 && <span className="tabular-nums">({localizedCount(drafts, lang)})</span>}
                </FilterChip>
              ))}
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map(post => (
                <BlogRow
                  key={post._id}
                  post={post}
                  onEdit={beginEdit}
                  onDelete={id => deletePost(id)}
                  isDeleting={deleting}
                  homePosition={homePosition(post._id)}
                  slotsFull={homePicks.length >= HOME_BLOG_SLOTS}
                  onToggleHome={post => toggleFeatured.mutate(post)}
                  togglingHome={toggleFeatured.isPending}
                  onTogglePublished={post => togglePublished.mutate(post)}
                  togglingPublished={togglePublished.isPending}
                />
              ))}
            </div>
          ) : (
            <EmptyState text={t('noResults')} />
          )}
        </div>
      ) : (
        !panel.isOpen && <EmptyState text={t('noBlogs')} actionText={t('createBlog')} onAction={beginCreate} />
      )}
    </SectionShell>
  );
};

export default Blog;
