'use client';

import { api } from '@/lib/client-api';
import { projectSchema } from '@/features/projects/schema';
import type { IProject } from '@/features/projects/types';
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
  images: [],
};

/** Projects list + CRUD, technology/link chips and the image gallery. */
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

  const gallery = useGallery({
    type: 'project',
    read: () => getValues('images') ?? [],
    write: next => setValue('images', next, { shouldDirty: true }),
    touch: () => trigger('images'),
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
      // The gallery owns the order; the cover is always its first entry.
      const images = data.images ?? [];
      const clean = { ...data, images, image: images[0] ?? '' };
      return clean._id ? api.put<IProject>(`/api/${locale}/admin/project`, clean) : api.post<IProject>(`/api/${locale}/admin/project`, clean);
    },
    onSuccess: () => {
      ok();
      reset();
      refetchProjects();
      // Files the owner unlinked only go once the new list is on record.
      gallery.purge();
    },
    onError: () => fail(),
  });

  const deleteMutation = useMutation({
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
  const featuredMutation = useMutation({
    mutationFn: (project: IProject) => {
      const { _id, title, slug, href, dates, active, description, details, technologies, links } = project;
      // The gallery is resent as read: a row toggle must not empty it.
      const shots = galleryUrls(project);
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
        image: shots[0] ?? '',
        images: shots,
      });
    },
    onSuccess: () => {
      ok();
      refetchProjects();
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
    reset({ ...EMPTY, ...project, images: galleryUrls(project), featured: Boolean(project.featured), _id: project._id });
    gallery.discard();
  };

  return {
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
    refetchProjects,
    save,
    deleteProject: deleteMutation.mutate,
    deletingId: pendingRecordId(deleteMutation),
    toggleFeatured: featuredMutation.mutate,
    togglingFeaturedId: pendingRecordId(featuredMutation),
    /** Gives the gallery field its upload, its change tracking and its purge. */
    gallery,
    /** Clears a cancelled edit's pending file deletions along with the form. */
    resetForm: () => {
      reset();
      gallery.discard();
    },
    addTechnology,
    removeTechnology,
    addLink,
    removeLink,
    startEdit,
    onSubmit: (data: ProjectForm, onSaved?: () => void) => save.mutate(data, { onSuccess: onSaved }),
  };
};

export default useProjects;
