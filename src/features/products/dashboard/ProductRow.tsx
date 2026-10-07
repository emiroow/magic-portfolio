'use client';

import { EntityCard, EntityThumb, HomeSlotChip, RowAction, StatusChip, TagChip } from '@/features/dashboard/components';
import { PriceTag } from '@/features/products/price-tag';
import type { IProduct } from '@/features/products/types';
import { documentKey } from '@/lib/utils';
import type { AppLocale } from '@/types';
import { ExternalLink, Eye, EyeOff, PackageCheck, PackageX, Pencil, Pin, Tag, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface ProductRowProps {
  product: IProduct;
  onEdit: (product: IProduct) => void;
  onDelete: (product: IProduct) => void;
  /** This record, and not another one, is busy. */
  deleting: boolean;
  togglingActive: boolean;
  togglingAvailable: boolean;
  togglingHome: boolean;
  /** 1-based position on the home page, or 0 when the product is not picked. */
  homePosition: number;
  /** Every slot is taken by another product, so this one cannot be picked. */
  slotsFull: boolean;
  onToggleHome: (product: IProduct) => void;
  onToggleActive: (product: IProduct) => void;
  onToggleAvailable: (product: IProduct) => void;
}

/** Dashboard list item for a single product. */
const ProductRow = ({
  product,
  onEdit,
  onDelete,
  deleting,
  togglingActive,
  togglingAvailable,
  togglingHome,
  homePosition,
  slotsFull,
  onToggleHome,
  onToggleActive,
  onToggleAvailable,
}: ProductRowProps) => {
  const t = useTranslations('dashboard.products');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const key = documentKey(product);
  const available = product.available !== false;
  const published = product.active !== false;
  const featured = product.active && product.featured === true;
  const features = product.features ?? [];

  // A dead control is worse than no control: say why it is unavailable.
  const homeBlock = !product.active ? t('featuredNeedsPublish') : slotsFull && !featured ? t('featuredFull') : undefined;

  return (
    <EntityCard
      title={product.title}
      meta={
        product.category ? (
          <>
            <Tag className="me-1 inline-block size-3 align-[-2px]" aria-hidden />
            {product.category}
          </>
        ) : (
          t('noCategory')
        )
      }
      actions={
        <>
          <RowAction
            label={featured ? t('removeFromHome') : t('addToHome')}
            icon={Pin}
            iconClassName={featured ? 'fill-current' : undefined}
            pressed={featured}
            blockedReason={homeBlock}
            pending={togglingHome}
            onClick={() => onToggleHome(product)}
          />
          <RowAction
            label={published ? t('unpublish') : t('publish')}
            icon={published ? Eye : EyeOff}
            pressed={published}
            pending={togglingActive}
            onClick={() => onToggleActive(product)}
          />
          <RowAction
            label={available ? t('makeUnavailable') : t('makeAvailable')}
            icon={available ? PackageCheck : PackageX}
            pressed={available}
            muted={!available}
            pending={togglingAvailable}
            onClick={() => onToggleAvailable(product)}
          />
          {published && key && <RowAction label={t('viewProduct')} icon={ExternalLink} href={`/${locale}/products/${key}`} />}
          <RowAction label={t('edit')} icon={Pencil} onClick={() => onEdit(product)} />
          <RowAction label={t('delete')} icon={Trash2} danger pending={deleting} onClick={() => onDelete(product)} />
        </>
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        {product.image && (
          <EntityThumb
            src={product.image}
            alt={product.title}
            className="aspect-[4/3] w-full sm:aspect-auto sm:h-20 sm:w-28"
            sizes="(max-width: 640px) 100vw, 112px"
          />
        )}

        <div className="min-w-0 flex-1 space-y-3">
          {product.description && <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{product.description}</p>}

          {features.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {features.map((feature, index) => (
                <li key={`${feature}-${index}`}>
                  <TagChip>{feature}</TagChip>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <PriceTag amount={product.price} currency={product.currency} className="text-sm font-semibold" />
            <StatusChip solid={published}>{published ? t('active') : t('disabled')}</StatusChip>
            {featured && <HomeSlotChip label={t('featuredBadge')} position={homePosition} lang={lang} />}
            <StatusChip>{available ? t('availableBadge') : t('unavailableBadge')}</StatusChip>
          </div>
        </div>
      </div>
    </EntityCard>
  );
};

export default ProductRow;
