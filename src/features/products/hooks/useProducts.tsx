'use client';

import { api } from '@/lib/client-api';
import { productSchema } from '@/features/products/schema';
import type { IProduct } from '@/features/products/types';
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
const formSchema = productSchema.extend({ _id: z.string().optional() });
type ProductForm = z.infer<typeof formSchema>;

const EMPTY: ProductForm = {
  title: '',
  slug: '',
  category: '',
  description: '',
  details: '',
  image: '',
  images: [],
  features: [],
  price: 0,
  currency: 'usd',
  available: true,
  href: '',
  active: true,
  featured: false,
};

/** Products list + CRUD, feature chips and the image gallery for the dashboard. */
const useProducts = () => {
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
  } = useForm<ProductForm>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const gallery = useGallery({
    type: 'product',
    read: () => getValues('images') ?? [],
    write: next => setValue('images', next, { shouldDirty: true }),
    touch: () => trigger('images'),
  });

  const {
    data: products,
    isPending,
    isError,
    error,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products', locale],
    queryFn: () => api.get<IProduct[]>(`/api/${locale}/admin/product`),
  });

  const save = useMutation({
    mutationFn: (data: ProductForm) => {
      // The gallery owns the order; the cover is always its first entry.
      const images = data.images ?? [];
      const clean = { ...data, images, image: images[0] ?? '' };
      return clean._id ? api.put<IProduct>(`/api/${locale}/admin/product`, clean) : api.post<IProduct>(`/api/${locale}/admin/product`, clean);
    },
    onSuccess: () => {
      ok();
      reset();
      refetchProducts();
      // Files the owner unlinked only go once the new list is on record.
      gallery.purge();
    },
    onError: () => fail(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/${locale}/admin/product?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      ok();
      refetchProducts();
    },
    onError: () => fail(),
  });

  /**
   * Row-level toggles send only the flipped flag: the update schema is partial,
   * so a long-form body open in the edit panel is never rewritten by mistake.
   */
  const activeMutation = useMutation({
    mutationFn: (product: IProduct) => api.put<IProduct>(`/api/${locale}/admin/product`, { _id: product._id, active: !product.active }),
    onSuccess: () => {
      ok();
      refetchProducts();
    },
    onError: () => fail(),
  });

  const availableMutation = useMutation({
    mutationFn: (product: IProduct) => api.put<IProduct>(`/api/${locale}/admin/product`, { _id: product._id, available: !product.available }),
    onSuccess: () => {
      ok();
      refetchProducts();
    },
    onError: () => fail(),
  });

  /**
   * Home page flag from the list row, without the form's `reset()` — an open
   * panel may hold unsaved edits that a row toggle must not throw away. The
   * update schema is partial, so the whole record is resent with the flipped
   * flag to keep every required field valid.
   */
  const featuredMutation = useMutation({
    mutationFn: (product: IProduct) => {
      const { _id, title, slug, category, description, details, features, price, currency, available, href, active } = product;
      // The gallery is resent as read: a row toggle must not empty it.
      const shots = galleryUrls(product);
      return api.put<IProduct>(`/api/${locale}/admin/product`, {
        _id,
        title,
        slug: slug ?? '',
        category: category ?? '',
        description,
        details: details ?? '',
        image: shots[0] ?? '',
        images: shots,
        features: features ?? [],
        price,
        currency,
        available,
        href: href ?? '',
        active,
        featured: !product.featured,
      });
    },
    onSuccess: () => {
      ok();
      refetchProducts();
    },
    onError: () => fail(),
  });

  // --- feature chips ---
  const addFeature = (value: string) => {
    const feature = value.trim();
    if (!feature) return;
    const current = getValues('features') || [];
    // The list keys on the text, and a repeated bullet reads as a mistake.
    if (current.some(item => item.toLowerCase() === feature.toLowerCase())) return;
    setValue('features', [...current, feature], { shouldDirty: true });
    trigger('features');
  };

  const removeFeature = (index: number) => {
    const current = getValues('features') || [];
    setValue(
      'features',
      current.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
    trigger('features');
  };

  const startEdit = (product: IProduct) => {
    // `.lean()` returns stored documents as-is, so an old record can lack a field.
    reset({
      ...EMPTY,
      ...product,
      images: galleryUrls(product),
      features: product.features ?? [],
      price: Number.isFinite(product.price) ? product.price : 0,
      currency: product.currency ?? 'usd',
      available: product.available !== false,
      featured: Boolean(product.featured),
      _id: product._id,
    });
    // A fresh record starts from what is on the store, not from a cancelled edit.
    gallery.discard();
  };

  return {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    errors,
    products,
    isPending,
    isError,
    error,
    refetchProducts,
    save,
    deleteProduct: deleteMutation.mutate,
    deletingId: pendingRecordId(deleteMutation),
    toggleActive: activeMutation.mutate,
    togglingActiveId: pendingRecordId(activeMutation),
    toggleAvailable: availableMutation.mutate,
    togglingAvailableId: pendingRecordId(availableMutation),
    toggleFeatured: featuredMutation.mutate,
    togglingFeaturedId: pendingRecordId(featuredMutation),
    /** Gives the gallery field its upload, its change tracking and its purge. */
    gallery,
    /** Clears a cancelled edit's pending file deletions along with the form. */
    resetForm: () => {
      reset();
      gallery.discard();
    },
    addFeature,
    removeFeature,
    startEdit,
    onSubmit: (data: ProductForm, onSaved?: () => void) => save.mutate(data, { onSuccess: onSaved }),
  };
};

export default useProducts;
