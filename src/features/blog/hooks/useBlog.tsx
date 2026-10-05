'use client';

import { api } from '@/lib/client-api';
import { blogSchema } from '@/features/blog/schema';
import type { IBlog } from '@/features/blog/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToastMessages } from '@/hooks/useToastMessages';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Same schema as the API plus the optional document id for edits.
const formSchema = blogSchema.extend({ _id: z.string().optional() });
type BlogForm = z.infer<typeof formSchema>;

const EMPTY: BlogForm = { title: '', slug: '', summary: '', content: '', image: '', tags: [], published: true, featured: false };

/** Blog post list + CRUD (drafts, tags, cover image) for the dashboard editor. */
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
    formState: { errors },
  } = useForm<BlogForm>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
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
    mutationFn: (data: BlogForm) =>
      data._id ? api.put<IBlog>(`/api/${locale}/admin/blog`, data) : api.post<IBlog>(`/api/${locale}/admin/blog`, data),
    onSuccess: () => {
      ok();
      reset();
      refetchPosts();
    },
    onError: () => fail(),
  });

  const { mutate: deletePost, isPending: deleting } = useMutation({
    mutationFn: (id: string) => api.del(`/api/${locale}/admin/blog?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      ok();
      refetchPosts();
    },
    onError: () => fail(),
  });

  // Publish/unpublish straight from the list row.
  const togglePublished = useMutation({
    mutationFn: (post: IBlog) => api.put<IBlog>(`/api/${locale}/admin/blog`, { _id: post._id, published: !post.published }),
    onSuccess: () => {
      ok();
      refetchPosts();
    },
    onError: () => fail(),
  });

  // Home page pick from the list row. The update schema is partial, so only the
  // flipped flag is sent and an open edit panel is never rewritten.
  const toggleFeatured = useMutation({
    mutationFn: (post: IBlog) => api.put<IBlog>(`/api/${locale}/admin/blog`, { _id: post._id, featured: !post.featured }),
    onSuccess: () => {
      ok();
      refetchPosts();
    },
    onError: () => fail(),
  });

  const startEdit = (post: IBlog) =>
    reset({ ...EMPTY, ...post, tags: post.tags ?? [], published: post.published ?? true, featured: Boolean(post.featured), _id: post._id });

  /** Cover image: upload returns a clean URL that goes straight into the form. */
  const uploadCover = useMutation({
    mutationFn: (formData: FormData) => api.upload<{ fileUrl: string }>(`/api/${locale}/admin/upload?lang=${locale}&type=blog`, formData),
    onSuccess: ({ fileUrl }) => {
      setValue('image', fileUrl.split('?')[0], { shouldDirty: true });
      ok();
    },
    onError: () => fail(),
  });

  const deleteCover = useMutation({
    mutationFn: () => {
      const fileName = getValues('image')?.split('/').pop()?.split('?')[0];
      return api.del(`/api/${locale}/admin/upload?lang=${locale}&type=blog&fileName=${encodeURIComponent(fileName ?? '')}`);
    },
    onSuccess: () => setValue('image', '', { shouldDirty: true }),
    onError: () => fail(),
  });

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
    getValues,
    reset,
    errors,
    posts,
    isPending,
    isError,
    error,
    refetchPosts,
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
    onSubmit: (data: BlogForm, onSaved?: () => void) => save.mutate(data, { onSuccess: onSaved }),
  };
};

export default useBlog;
