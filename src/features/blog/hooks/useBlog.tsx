'use client';

import { api } from '@/lib/client-api';
import { blogSchema } from '@/features/blog/schema';
import type { IBlog } from '@/features/blog/types';
import { galleryUrls } from '@/lib/utils';
import { useGallery } from '@/hooks/useGallery';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToastMessages } from '@/hooks/useToastMessages';
import { pendingRecordId } from '@/hooks/pendingRecordId';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Same schema as the API plus the optional document id for edits.
const formSchema = blogSchema.extend({ _id: z.string().optional() });
type BlogForm = z.infer<typeof formSchema>;

const EMPTY: BlogForm = { title: '', slug: '', summary: '', content: '', image: '', images: [], tags: [], published: true, featured: false };

/** Blog post list + CRUD (drafts, tags, image gallery) for the dashboard editor. */
const useBlog = () => {
  const locale = useLocale();
  const { ok, fail } = useToastMessages();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<BlogForm>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const gallery = useGallery({
    type: 'blog',
    read: () => getValues('images') ?? [],
    write: next => setValue('images', next, { shouldDirty: true }),
    touch: () => trigger('images'),
  });

  const {
    data: posts,
    isPending,
    isError,
    error,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ['blog-posts', locale],
    queryFn: () => api.get<IBlog[]>(`/api/${locale}/admin/blog`),
  });

  const save = useMutation({
    // The gallery owns the order; the cover is always its first entry.
    mutationFn: (data: BlogForm) => {
      const images = data.images ?? [];
      const clean = { ...data, images, image: images[0] ?? '' };
      return clean._id ? api.put<IBlog>(`/api/${locale}/admin/blog`, clean) : api.post<IBlog>(`/api/${locale}/admin/blog`, clean);
    },
    onSuccess: () => {
      ok();
      reset();
      refetchPosts();
      // Files the owner unlinked only go once the new list is on record.
      gallery.purge();
    },
    onError: () => fail(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/${locale}/admin/blog?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      ok();
      refetchPosts();
    },
    onError: () => fail(),
  });

  // Publish/unpublish straight from the list row.
  const publishedMutation = useMutation({
    mutationFn: (post: IBlog) => api.put<IBlog>(`/api/${locale}/admin/blog`, { _id: post._id, published: !post.published }),
    onSuccess: () => {
      ok();
      refetchPosts();
    },
    onError: () => fail(),
  });

  // Home page pick from the list row. The update schema is partial, so only the
  // flipped flag is sent and an open edit panel is never rewritten.
  const featuredMutation = useMutation({
    mutationFn: (post: IBlog) => api.put<IBlog>(`/api/${locale}/admin/blog`, { _id: post._id, featured: !post.featured }),
    onSuccess: () => {
      ok();
      refetchPosts();
    },
    onError: () => fail(),
  });

  const startEdit = (post: IBlog) => {
    reset({
      ...EMPTY,
      ...post,
      images: galleryUrls(post),
      tags: post.tags ?? [],
      published: post.published ?? true,
      featured: Boolean(post.featured),
      _id: post._id,
    });
    gallery.discard();
  };

  const addTag = (value: string) => {
    const tag = value.trim();
    if (!tag) return;
    const current = getValues('tags') || [];
    if (!current.some(item => item.toLowerCase() === tag.toLowerCase())) {
      setValue('tags', [...current, tag], { shouldDirty: true });
    }
  };

  const removeTag = (index: number) => {
    const current = getValues('tags') || [];
    setValue(
      'tags',
      current.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  };

  return {
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
    refetchPosts,
    save,
    deletePost: deleteMutation.mutate,
    deletingId: pendingRecordId(deleteMutation),
    togglePublished: publishedMutation.mutate,
    togglingPublishedId: pendingRecordId(publishedMutation),
    toggleFeatured: featuredMutation.mutate,
    togglingFeaturedId: pendingRecordId(featuredMutation),
    /** Gives the gallery field its upload, its change tracking and its purge. */
    gallery,
    /** Clears a cancelled edit's pending file deletions along with the form. */
    resetForm: () => {
      reset();
      gallery.discard();
    },
    startEdit,
    addTag,
    removeTag,
    onSubmit: (data: BlogForm, onSaved?: () => void) => save.mutate(data, { onSuccess: onSaved }),
  };
};

export default useBlog;
