'use client';

import {
  AdminToolbar,
  CardListSkeleton,
  ChipInput,
  EmptyState,
  EntityList,
  ErrorState,
  FormActions,
  FormPanel,
  GalleryField,
  SectionShell,
} from '@/features/dashboard/components';
import BlogRow from '@/features/blog/dashboard/BlogRow';
import { CheckboxField, Field } from '@/components/ui/field';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import MarkdownEditor from '@/components/ui/markdown-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConfirmDelete } from '@/features/dashboard/hooks/useConfirmDelete';
import { useFormPanel } from '@/hooks/useFormPanel';
import useBlog from '@/features/blog/hooks/useBlog';
import { HOME_BLOG_SLOTS } from '@/features/blog/constants';
import { MAX_GALLERY_IMAGES } from '@/constants/global';
import { IMAGE_SPECS } from '@/constants/imageSpecs';
import { localizedCount, slugify } from '@/lib/utils';
import { MAX_TAG_ITEMS, MAX_TAG_ITEM_LENGTH } from '@/lib/validations';
import type { AppLocale } from '@/types';
import type { IBlog } from '@/features/blog/types';
import { FileText, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

/** Listing filter. */
const STATUSES = ['all', 'published', 'draft'] as const;
type Status = (typeof STATUSES)[number];

const isDraft = (post: IBlog) => post.published === false;

/** Blog section: markdown editor with a cover, tags, drafts and search. */
const Blog = () => {
  const t = useTranslations('dashboard.blog');
  const td = useTranslations('dashboard');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    errors,
    posts,
    isPending,
    isError,
    error,
    save,
    deletePost,
    deletingId,
    togglePublished,
    togglingPublishedId,
    toggleFeatured,
    togglingFeaturedId,
    gallery,
    resetForm,
    startEdit,
    addTag,
    removeTag,
    onSubmit,
    refetchPosts,
  } = useBlog();

  const panel = useFormPanel();
  const confirm = useConfirmDelete(deletePost);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('all');

  const title = watch('title');
  const content = watch('content');
  const tags = watch('tags') ?? [];
  const images = watch('images') ?? [];
  const editingId = watch('_id');
  const published = watch('published');
  const featured = watch('featured');

  // Auto-derive the slug from the title while creating; a touched slug wins.
  const autoSlug = !editingId && title ? slugify(title) : watch('slug');

  const words = (content || '').trim().split(/\s+/).filter(Boolean).length;

  const closeForm = () => {
    panel.close();
    resetForm();
  };

  const beginCreate = () => {
    resetForm();
    panel.open();
  };

  const beginEdit = (post: IBlog) => {
    startEdit(post);
    panel.open();
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

  const statusLabel: Record<Status, string> = {
    all: t('all'),
    published: t('statusPublished'),
    draft: t('statusDraft'),
  };

  return (
    <SectionShell
      title={t('title')}
      anchorRef={panel.anchorRef}
      action={
        !panel.isOpen && (
          <Button size="icon" variant="outline" onClick={beginCreate} aria-label={t('createBlog')}>
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
          <GalleryField
            label={t('imagesLabel')}
            alt={title || t('imagesLabel')}
            value={images}
            onChange={gallery.commit}
            upload={gallery.upload}
            error={errors.images?.message}
            hint={td('gallery.hint')}
            max={MAX_GALLERY_IMAGES}
            frameClassName="h-20 w-36 rounded-lg"
            aspect={IMAGE_SPECS.blog.aspect}
            outputSize={IMAGE_SPECS.blog.width}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('titleLabel')} id="blog-title" error={errors.title?.message}>
              <Input id="blog-title" {...register('title')} placeholder={t('titlePlaceholder')} autoComplete="off" />
            </Field>
            <Field label={t('slugLabel')} id="blog-slug" error={errors.slug?.message} hint={t('slugHint')}>
              <Input
                id="blog-slug"
                dir="ltr"
                value={autoSlug}
                onChange={event => setValue('slug', event.target.value, { shouldValidate: true, shouldDirty: true })}
                placeholder={t('slugPlaceholder')}
                autoComplete="off"
              />
            </Field>
          </div>

          <Field label={t('summaryLabel')} id="blog-summary" error={errors.summary?.message} hint={t('summaryHint')}>
            <Input id="blog-summary" {...register('summary')} placeholder={t('summaryPlaceholder')} autoComplete="off" />
          </Field>

          <ChipInput
            label={t('tagsLabel')}
            hint={t('tagsHint')}
            error={errors.tags?.message}
            items={tags}
            onAdd={addTag}
            onRemove={removeTag}
            placeholder={t('tagsPlaceholder')}
            addLabel={td('add')}
            maxLength={MAX_TAG_ITEM_LENGTH}
            blockedReason={tags.length >= MAX_TAG_ITEMS ? td('maxEntries', { count: localizedCount(MAX_TAG_ITEMS, lang) }) : undefined}
          />

          <Field label={t('contentLabel')} error={errors.content?.message} hint={t('wordCount', { count: localizedCount(words, lang) })}>
            {/* The editor is uncontrolled from RHF's perspective; sync via setValue. */}
            <MarkdownEditor
              value={content ?? ''}
              onChange={value => setValue('content', value, { shouldValidate: true, shouldDirty: true })}
              placeholder={td('markdown.placeholder')}
              height={360}
            />
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

          <FormActions submitLabel={t('save')} cancelLabel={td('cancel')} submitting={save.isPending} onCancel={closeForm} />
        </form>
      </FormPanel>

      {isPending ? (
        <CardListSkeleton actions={5} />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchPosts()} />
      ) : posts && posts.length > 0 ? (
        <>
          <AdminToolbar
            query={query}
            onQueryChange={setQuery}
            searchLabel={t('searchPlaceholder')}
            clearSearchLabel={td('clearSearch')}
            chips={STATUSES.map(value => ({
              value,
              label: (
                <>
                  {statusLabel[value]}
                  {value === 'draft' && drafts > 0 && <span className="tabular-nums">({localizedCount(drafts, lang)})</span>}
                </>
              ),
            }))}
            active={status}
            onPick={value => setStatus(value as Status)}
            chipsLabel={t('statusFilter')}
            meta={t('homeSlots', { used: localizedCount(homePicks.length, lang), total: localizedCount(HOME_BLOG_SLOTS, lang) })}
          />

          {filtered.length > 0 ? (
            <EntityList>
              {filtered.map(post => (
                <BlogRow
                  key={post._id}
                  post={post}
                  onEdit={beginEdit}
                  onDelete={item => confirm.request(item._id, item.title)}
                  deleting={deletingId === post._id}
                  togglingPublished={togglingPublishedId === post._id}
                  togglingHome={togglingFeaturedId === post._id}
                  homePosition={homePosition(post._id)}
                  slotsFull={homePicks.length >= HOME_BLOG_SLOTS}
                  onToggleHome={item => toggleFeatured(item)}
                  onTogglePublished={item => togglePublished(item)}
                />
              ))}
            </EntityList>
          ) : (
            <EmptyState icon={FileText} text={t('noResults')} />
          )}
        </>
      ) : (
        !panel.isOpen && <EmptyState icon={FileText} text={t('noBlogs')} actionText={t('createBlog')} onAction={beginCreate} />
      )}

      <ConfirmDialog {...confirm.dialogProps} />
    </SectionShell>
  );
};

export default Blog;
