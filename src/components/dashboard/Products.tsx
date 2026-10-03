'use client';

import { CheckboxField, EmptyState, ErrorState, Field, FormPanel, LoadingRows, SectionShell } from '@/components/dashboard/shared';
import ProductRow from '@/components/dashboard/Product-card';
import ImageCropperDialog from '@/components/ui/image-cropper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import MarkdownEditor from '@/components/ui/markdown-editor';
import { Textarea } from '@/components/ui/textarea';
import { PRODUCT_CURRENCIES, HOME_PRODUCT_SLOTS } from '@/constants/global';
import useProducts from '@/hooks/dashboard/useProducts';
import { useFormPanel } from '@/hooks/dashboard/useFormPanel';
import { isOptimizableImage, localizedCount, slugify } from '@/lib/utils';
import type { AppLocale, IProduct } from '@/types';
import { Plus, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRef, useState } from 'react';

/** Products section: CRUD form (cover, price, currency, features) + list. */
const Products = () => {
  const t = useTranslations('dashboard.products');
  const tp = useTranslations('pricing');
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
    products,
    isPending,
    isError,
    error,
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
    onSubmit,
    refetchProducts,
  } = useProducts();

  const panel = useFormPanel();
  const [feature, setFeature] = useState('');
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const title = watch('title');
  const details = watch('details');
  const editingId = watch('_id');
  const image = watch('image');
  const features = watch('features') ?? [];
  const published = watch('active');
  const featured = watch('featured');

  // Home page picks, in the order the site renders them (newest first).
  const homePicks = (products ?? []).filter(product => product.active && product.featured);
  const homePosition = (id?: string) => {
    const index = homePicks.findIndex(product => product._id === id);
    return index === -1 ? 0 : index + 1;
  };

  // Slots: the product being edited must not count against itself.
  const takenByOthers = homePicks.filter(product => product._id !== editingId).length;
  const slotsFull = takenByOthers >= HOME_PRODUCT_SLOTS;
  const openSlots = Math.max(HOME_PRODUCT_SLOTS - takenByOthers - (featured ? 1 : 0), 0);
  const featuredHint = !published
    ? t('featuredNeedsPublish')
    : slotsFull && !featured
      ? t('featuredFull')
      : featured && openSlots === 0
        ? t('featuredAllUsed')
        : t('featuredHint', { count: localizedCount(openSlots, lang) });

  // Slug drives `/products/[slug]`; it is auto-derived until edited by hand.
  const autoSlug = !editingId && title ? slugify(title) : watch('slug');

  const closeForm = () => {
    panel.close();
    reset();
    setFeature('');
  };

  const beginCreate = () => {
    reset();
    panel.open();
  };

  const beginEdit = (product: IProduct) => {
    startEdit(product);
    panel.open();
  };

  const commitFeature = () => {
    addFeature(feature);
    setFeature('');
  };

  return (
    <SectionShell
      title={t('title')}
      anchorRef={panel.anchorRef}
      action={
        !panel.isOpen && (
          <Button size="icon" variant="outline" className="size-8" onClick={beginCreate} aria-label={t('addProduct')}>
            <Plus className="size-4" aria-hidden />
          </Button>
        )
      }
    >
      <FormPanel open={panel.isOpen} title={editingId ? t('editProduct') : t('createProduct')} onClose={closeForm}>
        <form onSubmit={handleSubmit(data => onSubmit({ ...data, slug: autoSlug, featured: data.active && Boolean(data.featured) }, panel.close))} className="space-y-5">
          {/* Cover image */}
          <Field label={t('productImage')} error={errors.image?.message} hint={t('uploadImageHint')}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex h-24 w-32 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/20 sm:h-28 sm:w-36">
                {image &&
                  (isOptimizableImage(image) ? (
                    <Image src={image} alt={t('productImage')} fill sizes="144px" className="object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={t('productImage')} className="size-full object-cover" />
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
            aspect={4 / 3}
            labels={{ title: tcrop('title'), apply: tcrop('apply'), cancel: t('cancel'), zoom: tcrop('zoom'), move: tcrop('move') }}
            outputSize={1600}
            onCropped={file => {
              const formData = new FormData();
              formData.append('image', file);
              uploadImage.mutate(formData);
            }}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('productTitle')} id="product-title" error={errors.title?.message}>
              <Input id="product-title" {...register('title')} placeholder={t('productTitlePlaceholder')} />
            </Field>
            <Field label={t('productSlug')} id="product-slug" error={errors.slug?.message} hint={t('productSlugHint')}>
              <Input
                id="product-slug"
                value={autoSlug}
                onChange={e => setValue('slug', e.target.value, { shouldValidate: true, shouldDirty: true })}
                placeholder={t('productSlugPlaceholder')}
                dir="ltr"
              />
            </Field>
            <Field label={t('productCategory')} id="product-category" error={errors.category?.message} hint={t('productCategoryHint')}>
              <Input id="product-category" {...register('category')} placeholder={t('productCategoryPlaceholder')} />
            </Field>
            <Field label={t('productPrice')} id="product-price" error={errors.price?.message} hint={t('productPriceHint')}>
              {/* Prices are numeric runs: kept LTR so grouping and decimals never mirror. */}
              <Input
                id="product-price"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                dir="ltr"
                className="tabular-nums"
                {...register('price', { valueAsNumber: true })}
              />
            </Field>
            <Field label={t('productCurrency')} id="product-currency" error={errors.currency?.message}>
              <select id="product-currency" {...register('currency')} className="control">
                {PRODUCT_CURRENCIES.map(code => (
                  <option key={code} value={code}>
                    {tp(code)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('productUrl')} id="product-href" error={errors.href?.message} hint={t('productUrlHint')}>
              <Input id="product-href" {...register('href')} placeholder={t('productUrlPlaceholder')} type="url" dir="ltr" />
            </Field>
            <CheckboxField
              id="product-active"
              label={t('active')}
              hint={t('activeHint')}
              {...register('active')}
              onChange={event => {
                setValue('active', event.target.checked, { shouldDirty: true, shouldValidate: true });
                // An unpublished product cannot hold a home page slot.
                if (!event.target.checked) setValue('featured', false, { shouldDirty: true });
              }}
            />
            <CheckboxField
              id="product-featured"
              label={t('featured')}
              hint={featuredHint}
              {...register('featured')}
              disabled={!published || (slotsFull && !featured)}
            />
            <CheckboxField id="product-available" label={t('available')} hint={t('availableHint')} {...register('available')} />
          </div>

          <Field label={t('productDescription')} id="product-description" error={errors.description?.message} hint={t('productDescriptionHint')}>
            <Textarea id="product-description" rows={3} {...register('description')} placeholder={t('productDescriptionPlaceholder')} />
          </Field>

          {/* Features: the "what you get" bullets */}
          <Field label={t('features')} error={errors.features?.message} hint={t('featuresHint')}>
            <div className="flex gap-2">
              <Input
                value={feature}
                onChange={e => setFeature(e.target.value)}
                placeholder={t('featurePlaceholder')}
                aria-label={t('featurePlaceholder')}
                maxLength={40}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    commitFeature();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={commitFeature}>
                {t('add')}
              </Button>
            </div>
            {features.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {features.map((item, index) => (
                  <li key={`${item}-${index}`}>
                    <Badge variant="secondary" onDelete={() => removeFeature(index)}>
                      {item}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Field>

          {/* Long-form body shown on the product page */}
          <Field label={t('productDetails')} error={errors.details?.message} hint={t('productDetailsHint')}>
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
        <ErrorState message={error?.message} onRetry={() => refetchProducts()} />
      ) : products && products.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {t('homeSlots', {
              used: localizedCount(homePicks.length, lang),
              total: localizedCount(HOME_PRODUCT_SLOTS, lang),
            })}
          </p>
          {products.map(product => (
            <ProductRow
              key={product._id}
              product={product}
              onEdit={beginEdit}
              onDelete={id => deleteProduct(id)}
              isDeleting={deleting}
              homePosition={homePosition(product._id)}
              slotsFull={homePicks.length >= HOME_PRODUCT_SLOTS}
              onToggleHome={product => toggleFeatured.mutate(product)}
              togglingHome={toggleFeatured.isPending}
              onToggleActive={product => toggleActive.mutate(product)}
              togglingActive={toggleActive.isPending}
              onToggleAvailable={product => toggleAvailable.mutate(product)}
              togglingAvailable={toggleAvailable.isPending}
            />
          ))}
        </div>
      ) : (
        !panel.isOpen && <EmptyState text={t('noProducts')} actionText={t('createFirstProduct')} onAction={beginCreate} />
      )}
    </SectionShell>
  );
};

export default Products;
