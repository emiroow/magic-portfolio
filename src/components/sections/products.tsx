import BlurFade from '@/components/magicui/blur-fade';
import { ProductCard } from '@/components/products/ProductCard';
import { SectionHeader, type SectionHeadingProps } from '@/components/sections/section-header';
import { buttonVariants } from '@/components/ui/button';
import { HOME_PRODUCT_SLOTS } from '@/constants/global';
import { cn, documentKey } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { IProduct } from '@/types';

/**
 * Products the home section may show. The owner picks them in the dashboard
 * ("show on the home page", up to `HOME_PRODUCT_SLOTS` of them) and those picks
 * lead the row; any leftover slot is filled by the newest published product so
 * the section never renders half empty. Everything else lives on `/products`.
 */
const PREVIEW_COUNT = HOME_PRODUCT_SLOTS;

interface ProductsProps extends SectionHeadingProps {
  products: IProduct[];
  /** Active locale, used to build the localized product-page links. */
  locale: string;
  /** Label for the "not purchasable" badge on each card. */
  unavailableLabel: string;
  /** Label for the catalogue link. */
  viewAllLabel: string;
  delay?: number;
}

/** Grid of the active products, capped to a preview set. */
export function Products({
  index,
  label,
  title,
  description,
  meta,
  products,
  locale,
  unavailableLabel,
  viewAllLabel,
  delay = 0,
}: ProductsProps) {
  const active = products.filter(product => product.active);
  if (!active.length) return null;

  const chosen = active.filter(product => product.featured);
  const preview = [...chosen, ...active.filter(product => !product.featured)].slice(0, PREVIEW_COUNT);

  return (
    <section id="products" aria-labelledby="products-heading">
      <SectionHeader
        index={index}
        label={label}
        title={title}
        description={description}
        meta={meta}
        id="products-heading"
        delay={delay}
      />
      {/* Three fixed tracks from `lg` up, so one or two products keep the same
          measure they would have in a full row instead of stretching. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {preview.map((product, id) => {
          const key = documentKey(product);
          return (
            <BlurFade key={product._id ?? `${product.title}-${id}`} delay={delay + 0.06 + id * 0.05} inView className="h-full">
              <ProductCard
                title={product.title}
                description={product.description}
                price={product.price}
                currency={product.currency}
                available={product.available}
                category={product.category}
                image={product.image}
                features={product.features}
                detailHref={key ? `/${locale}/products/${key}` : undefined}
                unavailableLabel={unavailableLabel}
                priority={id < 3}
                className="h-full"
              />
            </BlurFade>
          );
        })}
      </div>

      {active.length > preview.length && (
        <BlurFade delay={delay + 0.1} inView>
          <div className="mt-6 flex justify-center">
            <Link href={`/${locale}/products`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}>
              {viewAllLabel}
              <ArrowRight className="ms-2 size-3.5 rtl:-scale-x-100" aria-hidden />
            </Link>
          </div>
        </BlurFade>
      )}
    </section>
  );
}
