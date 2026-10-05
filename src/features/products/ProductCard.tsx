import { PriceTag } from '@/features/products/price-tag';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn, isOptimizableImage } from '@/lib/utils';
import type { ProductCurrency } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  title: string;
  description: string;
  price: number;
  currency: ProductCurrency;
  available: boolean;
  /** In-app product page; when present the whole card is clickable. */
  detailHref?: string;
  category?: string;
  image?: string;
  features?: readonly string[];
  /** Number of feature bullets folded onto the card. */
  featureCount?: number;
  /** Label for the "not purchasable" badge. */
  unavailableLabel: string;
  className?: string;
  /** Cover is the LCP element of the first cards on the page. */
  priority?: boolean;
  /** Layout width of one card, so the browser never downloads a wider
   * variant than the grid can show. */
  sizes?: string;
  /** Heading level of the title; the archive uses `h2` under its own `h1`. */
  headingLevel?: 'h2' | 'h3';
}

/**
 * Catalogue product card: cover, name, summary and the price pinned to the
 * bottom edge, so a three-column grid stays even whatever the copy length.
 *
 * Covers render in grayscale to protect the monochrome palette and regain
 * colour on hover, and the title carries a stretched link so the whole surface
 * is clickable without trapping the reader away from the product page.
 */
export function ProductCard({
  title,
  description,
  price,
  currency,
  available,
  detailHref,
  category,
  image,
  features = [],
  featureCount = 3,
  unavailableLabel,
  className,
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1023px) 46vw, 300px',
  headingLevel: Heading = 'h3',
}: ProductCardProps) {
  const cover = image && isOptimizableImage(image) ? image : undefined;
  const shownFeatures = features.slice(0, featureCount);

  return (
    <Card className={cn('group relative flex h-full flex-col overflow-hidden p-0 transition-colors hover:border-foreground/30', className)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden border-b bg-muted">
        {cover ? (
          <Image
            src={cover}
            alt={title}
            fill
            priority={priority}
            sizes={sizes}
            className="object-cover object-top grayscale transition-[filter] duration-500 group-hover:grayscale-0"
          />
        ) : image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={title} loading="lazy" decoding="async" className="size-full object-cover grayscale" />
        ) : (
          // Deterministic monogram keeps the grid aligned without an image.
          <span aria-hidden className="flex size-full items-center justify-center text-3xl font-bold text-muted-foreground/40">
            {title.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex grow flex-col p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <Heading className="min-w-0 text-sm font-semibold leading-snug">
            {detailHref ? (
              <Link
                href={detailHref}
                className="decoration-muted-foreground/50 underline-offset-2 transition-colors after:absolute after:inset-0 after:content-[''] hover:underline"
              >
                {title}
              </Link>
            ) : (
              title
            )}
          </Heading>
          {category && (
            <span className="shrink-0 text-[11px] text-muted-foreground" dir="auto">
              {category}
            </span>
          )}
        </div>

        <p className="mt-2 line-clamp-3 text-pretty text-xs leading-relaxed text-muted-foreground">{description}</p>

        {shownFeatures.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {shownFeatures.map(feature => (
              <li key={feature}>
                <Badge variant="secondary" className="px-2 py-0 text-[10px] font-normal">
                  {feature}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        {/* Price pinned to the bottom, so cards of different text length still
            land their prices on the same line. */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <PriceTag amount={price} currency={currency} className="text-sm font-semibold" />
          {!available && (
            <Badge variant="outline" className="text-[10px]">
              {unavailableLabel}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
