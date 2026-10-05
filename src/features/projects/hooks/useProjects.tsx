'use client';

import { api } from '@/lib/client-api';
import { projectSchema } from '@/features/projects/schema';
import type { IProject } from '@/features/projects/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToastMessages } from '@/hooks/useToastMessages';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Same schema as the API plus the optional document id for edits.
const formSchema = projectSchema.extend({ _id: z.string().optional() });
type ProjectForm = z.infer<typeof formSchema>;

const EMPTY: ProjectForm = {
  title: '',
  slug: '',
  href: '',
  dates: '',
  active: true,
  featured: false,
  description: '',
  details: '',
  technologies: [],
  links: [],
  image: '',
};

/** Projects list + CRUD, technology/link chips and image upload. */
const useProjects = () => {
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
  } = useForm<ProjectForm>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const {
    data: projects,
    isPending,
    isError,
    error,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ['projects', locale],
    queryFn: () => api.get<IProject[]>(`/api/${locale}/admin/project`),
  });

  const save = useMutation({
    mutationFn: (data: ProjectForm) => {
      // Store clean URLs: strip the display-only ?cb= cache buster.
      const clean = { ...data, image: data.image ? data.image.split('?')[0] : '' };
      return clean._id ? api.put<IProject>(`/api/${locale}/admin/project`, clean) : api.post<IProject>(`/api/${locale}/admin/project`, clean);
    },
    onSuccess: () => {
      ok();
      reset();
      refetchProjects();
    },
    onError: () => fail(),
  });

  const { mutate: deleteProject, isPending: deleting } = useMutation({
    mutationFn: (id: string) => api.del(`/api/${locale}/admin/project?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      ok();
      refetchProjects();
    },
    onError: () => fail(),
  });

  /**
   * Home page flag from the list row, without the form's `reset()` — an open
   * panel may hold unsaved edits that a row toggle must not throw away.
   */
  const toggleFeatured = useMutation({
    mutationFn: (project: IProject) => {
      const { _id, title, slug, href, dates, active, description, details, technologies, links, image } = project;
      return api.put<IProject>(`/api/${locale}/admin/project`, {
        _id,
        title,
        slug: slug ?? '',
        href: href ?? '',
        dates: dates ?? '',
        active,
        featured: !project.featured,
        description,
        details: details ?? '',
        technologies: technologies ?? [],
        links: links ?? [],
        image: image ? image.split('?')[0] : '',
      });
    },
    onSuccess: () => {
      ok();
      refetchProjects();
    },
    onError: () => fail(),
  });

  const uploadImage = useMutation({
    mutationFn: (formData: FormData) => api.upload<{ fileUrl: string }>(`/api/${locale}/admin/upload?lang=${locale}&type=project`, formData),
    onSuccess: ({ fileUrl }) => {
      // Clean URL in the form; the crop dialog preview is what needs busting.
      setValue('image', fileUrl.split('?')[0], { shouldDirty: true });
      trigger('image');
    },
    onError: () => fail(),
  });

  const deleteImage = useMutation({
    mutationFn: () => {
      const fileName = getValues('image')?.split('/').pop()?.split('?')[0];
      return api.del(`/api/${locale}/admin/upload?lang=${locale}&type=project&fileName=${encodeURIComponent(fileName ?? '')}`);
    },
    onSuccess: () => {
      setValue('image', '', { shouldDirty: true });
      trigger('image');
    },
    onError: () => fail(),
  });

  // --- technologies / links chip helpers ---
  const addTechnology = (tech: string) => {
    const value = tech.trim();
    if (!value) return;
    const current = getValues('technologies') || [];
    setValue('technologies', [...current, value], { shouldDirty: true });
    trigger('technologies');
  };

  const removeTechnology = (index: number) => {
    const current = getValues('technologies') || [];
    setValue(
      'technologies',
      current.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
    trigger('technologies');
  };

  const addLink = (link: { type: string; href: string; icon: string }) => {
    if (!link.type || !link.href) return;
    const current = getValues('links') || [];
    setValue('links', [...current, link], { shouldDirty: true });
    trigger('links');
  };

  const removeLink = (index: number) => {
    const current = getValues('links') || [];
    setValue(
      'links',
      current.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
    trigger('links');
  };

  const startEdit = (project: IProject) => {
    // `.lean()` returns stored documents as-is, so an old record has no flag.
    reset({ ...EMPTY, ...project, featured: Boolean(project.featured), _id: project._id });
  };

  return {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    errors,
    projects,
    isPending,
    isError,
    error,
    refetchProjects,
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
    onSubmit: (data: ProjectForm, onSaved?: () => void) => save.mutate(data, { onSuccess: onSaved }),
  };
};

export default useProjects;
