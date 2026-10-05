'use client';

import { api } from '@/lib/client-api';
import { productSchema } from '@/features/products/schema';
import type { IProduct } from '@/features/products/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToastMessages } from '@/hooks/useToastMessages';
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
  features: [],
  price: 0,
  currency: 'usd',
  available: true,
  href: '',
  active: true,
  featured: false,
};

/** Products list + CRUD, feature chips and cover upload for the dashboard. */
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
      // Store clean URLs: strip the display-only ?cb= cache buster.
      const clean = { ...data, image: data.image ? data.image.split('?')[0] : '' };
      return clean._id ? api.put<IProduct>(`/api/${locale}/admin/product`, clean) : api.post<IProduct>(`/api/${locale}/admin/product`, clean);
    },
    onSuccess: () => {
      ok();
      reset();
      refetchProducts();
    },
    onError: () => fail(),
  });

  const { mutate: deleteProduct, isPending: deleting } = useMutation({
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
  const toggleActive = useMutation({
    mutationFn: (product: IProduct) => api.put<IProduct>(`/api/${locale}/admin/product`, { _id: product._id, active: !product.active }),
    onSuccess: () => {
      ok();
      refetchProducts();
    },
    onError: () => fail(),
  });

  const toggleAvailable = useMutation({
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
  const toggleFeatured = useMutation({
    mutationFn: (product: IProduct) => {
      const { _id, title, slug, category, description, details, image, features, price, currency, available, href, active } = product;
      return api.put<IProduct>(`/api/${locale}/admin/product`, {
        _id,
        title,
        slug: slug ?? '',
        category: category ?? '',
        description,
        details: details ?? '',
        image: image ? image.split('?')[0] : '',
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

  const uploadImage = useMutation({
    mutationFn: (formData: FormData) => api.upload<{ fileUrl: string }>(`/api/${locale}/admin/upload?lang=${locale}&type=product`, formData),
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
      return api.del(`/api/${locale}/admin/upload?lang=${locale}&type=product&fileName=${encodeURIComponent(fileName ?? '')}`);
    },
    onSuccess: () => {
      setValue('image', '', { shouldDirty: true });
      trigger('image');
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
      features: product.features ?? [],
      price: Number.isFinite(product.price) ? product.price : 0,
      currency: product.currency ?? 'usd',
      available: product.available !== false,
      featured: Boolean(product.featured),
      _id: product._id,
    });
  };

  return {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    errors,
    products,
    isPending,
    isError,
    error,
    refetchProducts,
    save,
    deleteProduct,
    deleting,
    toggleActive,
    toggleAvailable,
    toggleFeatured,
    uploadImage,
    deleteImage,
    addFeature,
    removeFeature,
    startEdit,
    onSubmit: (data: ProductForm, onSaved?: () => void) => save.mutate(data, { onSuccess: onSaved }),
  };
};

export default useProducts;
