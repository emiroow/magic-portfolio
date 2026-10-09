'use client';

import {
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
import ProductRow from '@/features/products/dashboard/ProductRow';
import { CheckboxField, Field } from '@/components/ui/field';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import MarkdownEditor from '@/components/ui/markdown-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PRODUCT_CURRENCIES } from '@/constants/global';
import { useConfirmDelete } from '@/features/dashboard/hooks/useConfirmDelete';
import { useFormPanel } from '@/hooks/useFormPanel';
import useProducts from '@/features/products/hooks/useProducts';
import { HOME_PRODUCT_SLOTS } from '@/features/products/constants';
import { MAX_GALLERY_IMAGES } from '@/constants/global';
import { localizedCount, slugify } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IProduct } from '@/features/products/types';
import { Package, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

/** Products section: cover, price, currency and the "what you get" bullets. */
const Products = () => {
  const t = useTranslations('dashboard.products');
  const td = useTranslations('dashboard');
  const tp = useTranslations('pricing');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    errors,
    products,
    isPending,
    isError,
    error,
    save,
    deleteProduct,
    deletingId,
    toggleActive,
    togglingActiveId,
    toggleAvailable,
    togglingAvailableId,
    toggleFeatured,
    togglingFeaturedId,
    gallery,
    resetForm,
    addFeature,
    removeFeature,
    startEdit,
    onSubmit,
    refetchProducts,
  } = useProducts();

  const panel = useFormPanel();
  const confirm = useConfirmDelete(deleteProduct);

  const title = watch('title');
  const details = watch('details');
  const editingId = watch('_id');
  const images = watch('images') ?? [];
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
    resetForm();
  };

  const beginCreate = () => {
    resetForm();
    panel.open();
  };

  const beginEdit = (product: IProduct) => {
    startEdit(product);
    panel.open();
  };

  return (
    <SectionShell
      title={t('title')}
      anchorRef={panel.anchorRef}
      action={
        !panel.isOpen && (
          <Button size="icon" variant="outline" onClick={beginCreate} aria-label={t('addProduct')}>
            <Plus className="size-4" aria-hidden />
          </Button>
        )
      }
    >
      <FormPanel open={panel.isOpen} title={editingId ? t('editProduct') : t('createProduct')} onClose={closeForm}>
        <form
          onSubmit={handleSubmit(data => onSubmit({ ...data, slug: autoSlug, featured: data.active && Boolean(data.featured) }, panel.close))}
          className="space-y-5"
        >
          <GalleryField
            label={t('productImages')}
            alt={title || t('productImages')}
            value={images}
            onChange={gallery.commit}
            upload={gallery.upload}
            error={errors.images?.message}
            hint={td('gallery.hint')}
            max={MAX_GALLERY_IMAGES}
            frameClassName="h-24 w-32 rounded-lg"
            aspect={4 / 3}
            outputSize={1600}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('productTitle')} id="product-title" error={errors.title?.message}>
              <Input id="product-title" {...register('title')} placeholder={t('productTitlePlaceholder')} autoComplete="off" />
            </Field>
            <Field label={t('productSlug')} id="product-slug" error={errors.slug?.message} hint={t('productSlugHint')}>
              <Input
                id="product-slug"
                dir="ltr"
                value={autoSlug}
                onChange={event => setValue('slug', event.target.value, { shouldValidate: true, shouldDirty: true })}
                placeholder={t('productSlugPlaceholder')}
                autoComplete="off"
              />
            </Field>
            <Field label={t('productCategory')} id="product-category" error={errors.category?.message} hint={t('productCategoryHint')}>
              <Input id="product-category" {...register('category')} placeholder={t('productCategoryPlaceholder')} autoComplete="off" />
            </Field>
            <Field label={t('productUrl')} id="product-href" error={errors.href?.message} hint={t('productUrlHint')}>
              <Input id="product-href" type="url" dir="ltr" {...register('href')} placeholder={t('productUrlPlaceholder')} autoComplete="off" />
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
              <Select id="product-currency" {...register('currency')}>
                {PRODUCT_CURRENCIES.map(code => (
                  <option key={code} value={code}>
                    {tp(code)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label={t('productDescription')} id="product-description" error={errors.description?.message} hint={t('productDescriptionHint')}>
            <Textarea id="product-description" rows={3} {...register('description')} placeholder={t('productDescriptionPlaceholder')} />
          </Field>

          <ChipInput
            label={t('features')}
            hint={t('featuresHint')}
            error={errors.features?.message}
            items={features}
            onAdd={addFeature}
            onRemove={removeFeature}
            placeholder={t('featurePlaceholder')}
            addLabel={td('add')}
            maxLength={40}
          />

          {/* Long-form body shown on the product page */}
          <Field label={t('productDetails')} error={errors.details?.message} hint={t('productDetailsHint')}>
            <MarkdownEditor
              value={details ?? ''}
              onChange={value => setValue('details', value, { shouldValidate: true, shouldDirty: true })}
              placeholder={td('markdown.placeholder')}
              height={320}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          <FormActions
            submitLabel={editingId ? t('update') : t('create')}
            cancelLabel={td('cancel')}
            submitting={save.isPending}
            onCancel={closeForm}
          />
        </form>
      </FormPanel>

      {isPending ? (
        <CardListSkeleton actions={6} />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchProducts()} />
      ) : products && products.length > 0 ? (
        <>
          <p aria-live="polite" className="mb-3 text-xs text-muted-foreground">
            {t('homeSlots', { used: localizedCount(homePicks.length, lang), total: localizedCount(HOME_PRODUCT_SLOTS, lang) })}
          </p>
          <EntityList>
            {products.map(product => (
              <ProductRow
                key={product._id}
                product={product}
                onEdit={beginEdit}
                onDelete={item => confirm.request(item._id, item.title)}
                deleting={deletingId === product._id}
                togglingActive={togglingActiveId === product._id}
                togglingAvailable={togglingAvailableId === product._id}
                togglingHome={togglingFeaturedId === product._id}
                homePosition={homePosition(product._id)}
                slotsFull={homePicks.length >= HOME_PRODUCT_SLOTS}
                onToggleHome={item => toggleFeatured(item)}
                onToggleActive={item => toggleActive(item)}
                onToggleAvailable={item => toggleAvailable(item)}
              />
            ))}
          </EntityList>
        </>
      ) : (
        !panel.isOpen && <EmptyState icon={Package} text={t('noProducts')} actionText={t('createFirstProduct')} onAction={beginCreate} />
      )}

      <ConfirmDialog {...confirm.dialogProps} />
    </SectionShell>
  );
};

export default Products;
