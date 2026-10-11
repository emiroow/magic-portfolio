'use client';

import { api } from '@/lib/client-api';
import { certificateSchema } from '@/features/certificate/schema';
import type { ICertificate } from '@/features/certificate/types';
import { cleanImageUrl, isOptimizableImage } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToastMessages } from '@/hooks/useToastMessages';
import { pendingRecordId } from '@/hooks/pendingRecordId';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Same schema as the API plus the optional document id for edits.
const formSchema = certificateSchema.extend({ _id: z.string().optional() });
type CertificateForm = z.infer<typeof formSchema>;

const EMPTY: CertificateForm = {
  title: '',
  issuer: '',
  href: '',
  logoUrl: '',
  credentialId: '',
  issueDate: '',
  expirationDate: '',
  description: '',
  featured: false,
};

/** Certificates list + CRUD, the résumé flag and the issuer mark upload. */
const useCertificates = () => {
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
  } = useForm<CertificateForm>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const {
    data: certificates,
    isPending,
    isError,
    error,
    refetch: refetchCertificates,
  } = useQuery({
    queryKey: ['certificates', locale],
    queryFn: () => api.get<ICertificate[]>(`/api/${locale}/admin/certificate`),
  });

  const save = useMutation({
    mutationFn: (data: CertificateForm) => {
      // Store the clean reference: nothing display-only may reach the document.
      const clean = { ...data, logoUrl: cleanImageUrl(data.logoUrl), featured: Boolean(data.featured) };
      return clean._id
        ? api.put<ICertificate>(`/api/${locale}/admin/certificate`, clean)
        : api.post<ICertificate>(`/api/${locale}/admin/certificate`, clean);
    },
    onSuccess: () => {
      ok();
      reset();
      refetchCertificates();
    },
    onError: () => fail(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/${locale}/admin/certificate?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      ok();
      refetchCertificates();
    },
    onError: () => fail(),
  });

  /**
   * Résumé flag from the list row, without the form's `reset()` — an open panel may
   * hold unsaved edits a row toggle must not throw away. The update schema is
   * partial, so only the flipped flag travels.
   */
  const featuredMutation = useMutation({
    mutationFn: (certificate: ICertificate) =>
      api.put<ICertificate>(`/api/${locale}/admin/certificate`, { _id: certificate._id, featured: !certificate.featured }),
    onSuccess: () => {
      ok();
      refetchCertificates();
    },
    onError: () => fail(),
  });

  const uploadLogo = useMutation({
    mutationFn: (formData: FormData) => api.upload<{ fileUrl: string }>(`/api/${locale}/admin/upload?lang=${locale}&type=certificate`, formData),
    onSuccess: ({ fileUrl }) => {
      setValue('logoUrl', cleanImageUrl(fileUrl), { shouldDirty: true });
      trigger('logoUrl');
    },
    onError: () => fail(),
  });

  const deleteLogo = useMutation({
    mutationFn: () => {
      const stored = cleanImageUrl(getValues('logoUrl'));
      const fileName = stored.split('/').pop();
      // A pasted external picture is not ours to erase: drop the reference only,
      // instead of asking storage for a file it never held and reporting a failure.
      if (!fileName || !isOptimizableImage(stored)) return Promise.resolve();
      return api.del(`/api/${locale}/admin/upload?lang=${locale}&type=certificate&fileName=${encodeURIComponent(fileName)}`);
    },
    onSuccess: () => {
      setValue('logoUrl', '', { shouldDirty: true });
      trigger('logoUrl');
    },
    onError: () => fail(),
  });

  const startEdit = (certificate: ICertificate) =>
    reset({
      ...EMPTY,
      ...certificate,
      // `.lean()` returns stored documents as they are, so an old record can lack the flag.
      featured: Boolean(certificate.featured),
      logoUrl: cleanImageUrl(certificate.logoUrl),
      _id: certificate._id,
    });

  return {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    errors,
    certificates,
    isPending,
    isError,
    error,
    refetchCertificates,
    save,
    deleteCertificate: deleteMutation.mutate,
    deletingId: pendingRecordId(deleteMutation),
    toggleFeatured: featuredMutation.mutate,
    togglingFeaturedId: pendingRecordId(featuredMutation),
    uploadLogo,
    deleteLogo,
    startEdit,
    onSubmit: (data: CertificateForm, onSaved?: () => void) => save.mutate(data, { onSuccess: onSaved }),
  };
};

export default useCertificates;
