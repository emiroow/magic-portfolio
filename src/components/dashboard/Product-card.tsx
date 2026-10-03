'use client';

import { PriceTag } from '@/components/products/price-tag';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Loading from '@/components/ui/loading';
import type { IProduct } from '@/types';
import { cn, documentKey, isOptimizableImage, localizedCount } from '@/lib/utils';
import { ExternalLink, Eye, EyeOff, PackageCheck, PackageX, Pencil, Pin, Tag, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ProductRowProps {
  product: IProduct;
  onEdit: (product: IProduct) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  /** 1-based position on the home page, or 0 when the product is not picked. */
  homePosition: number;
  /** Every slot is taken by another product, so this one cannot be picked. */
  slotsFull: boolean;
  onToggleHome: (product: IProduct) => void;
  togglingHome: boolean;
  onToggleActive: (product: IProduct) => void;
  togglingActive: boolean;
  onToggleAvailable: (product: IProduct) => void;
  togglingAvailable: boolean;
}

/** Dashboard list item for a single product. */
const ProductCard = ({
  product,
  onEdit,
  onDelete,
  isDeleting,
  homePosition,
  slotsFull,
  onToggleHome,
  togglingHome,
  onToggleActive,
  togglingActive,
  onToggleAvailable,
  togglingAvailable,
}: ProductRowProps) => {
  const t = useTranslations('dashboard.products');
  const locale = useLocale();
  const lang = locale === 'fa' ? 'fa' : 'en';
  const [confirmOpen, setConfirmOpen] = useState(false);
  const key = documentKey(product);
  const available = product.available !== false;
  const published = product.active !== false;
  const featured = product.active && product.featured === true;

  // A dead control is worse than no control: say why it is unavailable.
  const homeBlock = !product.active ? t('featuredNeedsPublish') : slotsFull && !featured ? t('featuredFull') : '';

  return (
    <Card className="transition-colors hover:border-foreground/30">
      <CardHeader className="flex-row items-center justify-between space-y-0 p-4 sm:p-5">
        <div className="min-w-0 space-y-0.5">
          <h3 className="truncate text-sm font-semibold sm:text-base">{product.title}</h3>
          <p className="truncate text-[11px] text-muted-foreground">
            {product.category ? (
              <>
                <Tag className="me-1 inline-block size-3 align-[-2px]" aria-hidden />
                {product.category}
              </>
            ) : (
              t('noCategory')
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="ghost"
            className={cn('size-8', featured && 'text-foreground')}
            onClick={() => onToggleHome(product)}
            disabled={Boolean(homeBlock) || togglingHome}
            aria-pressed={featured}
            aria-label={featured ? t('removeFromHome') : t('addToHome')}
            title={homeBlock || (featured ? t('removeFromHome') : t('addToHome'))}
          >
            {togglingHome ? <Loading size="sm" /> : <Pin className={cn('size-4', featured && 'fill-current')} aria-hidden />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={cn('size-8', !available && 'text-muted-foreground')}
            onClick={() => onToggleAvailable(product)}
            disabled={togglingAvailable}
            aria-pressed={available}
            aria-label={available ? t('makeUnavailable') : t('makeAvailable')}
            title={available ? t('makeUnavailable') : t('makeAvailable')}
          >
            {togglingAvailable ? (
              <Loading size="sm" />
            ) : available ? (
              <PackageCheck className="size-4" aria-hidden />
            ) : (
              <PackageX className="size-4" aria-hidden />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => onToggleActive(product)}
            disabled={togglingActive}
            aria-pressed={published}
            aria-label={published ? t('unpublish') : t('publish')}
            title={published ? t('unpublish') : t('publish')}
          >
            {togglingActive ? <Loading size="sm" /> : published ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
          </Button>
          {published && key && (
            <Link
              href={`/${locale}/products/${key}`}
              target="_blank"
              aria-label={t('viewProduct')}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8')}
            >
              <ExternalLink className="size-4" aria-hidden />
            </Link>
          )}
          <Button size="icon" variant="ghost" className="size-8" onClick={() => onEdit(product)} aria-label={t('edit')}>
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            aria-label={t('delete')}
          >
            {isDeleting ? <Loading size="sm" /> : <Trash2 className="size-4" aria-hidden />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        <div className="flex flex-col gap-4 sm:flex-row">
          {product.image && (
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg border sm:h-20 sm:w-28 sm:aspect-auto">
              {isOptimizableImage(product.image) ? (
                <Image src={product.image} alt={product.title} fill sizes="(max-width: 640px) 100vw, 112px" className="object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image} alt={product.title} loading="lazy" decoding="async" className="size-full object-cover" />
              )}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-3">
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{product.description}</p>

            {product.features?.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {product.features.map((feature, index) => (
                  <li key={`${feature}-${index}`}>
                    <Badge variant="secondary" className="px-2 py-0 text-[10px] font-normal">
                      {feature}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <PriceTag amount={product.price} currency={product.currency} className="text-sm font-semibold" />

              <Badge variant={published ? 'default' : 'outline'} className="text-[10px]">
                {published ? t('active') : t('disabled')}
              </Badge>

              {featured && (
                <Badge variant="outline" className="text-[10px]">
                  {t('featuredBadge')}
                  {homePosition > 0 && (
                    <>
                      <span aria-hidden className="text-muted-foreground">
                        ·
                      </span>
                      <span className="tabular-nums text-muted-foreground">{localizedCount(homePosition, lang)}</span>
                    </>
                  )}
                </Badge>
              )}

              <Badge variant="outline" className="text-[10px]">
                {available ? t('availableBadge') : t('unavailableBadge')}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        itemName={product.title}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete(product._id!);
        }}
      />
    </Card>
  );
};

export default ProductCard;
