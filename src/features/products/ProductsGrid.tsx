'use client';

import BlurFade from '@/components/magicui/blur-fade';
import { EmptyPanel } from '@/components/empty-panel';
import { ProductCard } from '@/features/products/ProductCard';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/filter-chip';
import { ListingToolbar } from '@/components/ui/listing-toolbar';
import { documentKey, localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IProduct } from '@/features/products/types';
import { PackageSearch, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

/** Products rendered before the “load more” control appears: two rows of three. */
const PAGE_SIZE = 6;

/** Orderings the catalogue offers; each is a key under `productsPage.sort`. */
const SORTS = ['newest', 'priceLow', 'priceHigh'] as const;
type Sort = (typeof SORTS)[number];

/**
 * Price expressed on one scale. The rial/toman pair has a fixed ratio, so those
 * two can be compared directly; nothing else is guessed.
 */
const sortablePrice = (product: IProduct) => (product.currency === 'rial' ? product.price / 10 : product.price);

interface ProductsGridProps {
  products: IProduct[];
  categories: string[];
}

/**
 * Product catalogue: instant search, a category facet and a price ordering on
 * the shared listing chrome, over a grid of price-first cards.
 */
export default function ProductsGrid({ products, categories }: ProductsGridProps) {
  const t = useTranslations('productsPage');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('newest');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const matched = products.filter(product => {
      if (category && (product.category || '').toLowerCase() !== category.toLowerCase()) return false;
      if (!needle) return true;
      return (
        (product.title || '').toLowerCase().includes(needle) ||
        (product.description || '').toLowerCase().includes(needle) ||
        (product.category || '').toLowerCase().includes(needle) ||
        (product.features ?? []).some(feature => feature.toLowerCase().includes(needle))
      );
    });

    // `newest` is the order the server sends; the price sorts must never leave
    // equal prices fighting for the same slot, so the title breaks the tie.
    if (sort !== 'newest') {
      const direction = sort === 'priceLow' ? 1 : -1;
      matched.sort((a, b) => direction * (sortablePrice(a) - sortablePrice(b)) || a.title.localeCompare(b.title, lang));
    }

    return matched;
  }, [products, query, category, sort, lang]);

  const filtering = Boolean(query.trim() || category);
  const shown = filtered.slice(0, visible);

  /**
   * A price ordering only means something while the catalogue stays on one
   * scale: a single currency, or the rial/toman pair. Mixed hard currencies
   * would order by number rather than by value, so the control stays hidden.
   */
  const priceSortable = useMemo(() => {
    const used = new Set(products.map(product => product.currency));
    return used.size === 1 || [...used].every(currency => currency === 'toman' || currency === 'rial');
  }, [products]);

  // Categories arrive alphabetically from the database; the ones covering most
  // products lead, so the first row of chips is the one worth pressing.
  const facets = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach(product => {
      const key = (product.category || '').toLowerCase();
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const seen = new Set<string>();
    return categories
      .filter(item => {
        const key = item.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (counts.get(b.toLowerCase()) ?? 0) - (counts.get(a.toLowerCase()) ?? 0));
  }, [products, categories]);

  const pickCategory = (value: string | null) => {
    setCategory(value);
    setVisible(PAGE_SIZE);
  };

  const pickSort = (value: Sort) => {
    setSort(value);
    setVisible(PAGE_SIZE);
  };

  const clearAll = () => {
    setQuery('');
    pickCategory(null);
  };

  if (!products.length) {
    return <EmptyPanel icon={<PackageSearch className="size-5 text-muted-foreground" />} text={t('empty')} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <ListingToolbar
        query={query}
        onQueryChange={value => {
          setQuery(value);
          setVisible(PAGE_SIZE);
        }}
        searchLabel={t('searchPlaceholder')}
        clearSearchLabel={t('clearSearch')}
        options={facets}
        active={category}
        onPick={pickCategory}
        meta={filtering ? t('count', { count: localizedCount(filtered.length, lang) }) : undefined}
        clearLabel={t('clearFilters')}
        onClear={clearAll}
      />

      {priceSortable && (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('sortLabel')}>
          {SORTS.map(value => (
            <FilterChip key={value} active={sort === value} onClick={() => pickSort(value)}>
              {t(`sort.${value}`)}
            </FilterChip>
          ))}
        </div>
      )}

      {shown.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((product, id) => {
              const key = documentKey(product);
              return (
                <BlurFade key={product._id ?? `${product.title}-${id}`} inView className="h-full">
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
                    unavailableLabel={t('unavailable')}
                    headingLevel="h2"
                    priority={id < 3}
                    className="h-full"
                  />
                </BlurFade>
              );
            })}
          </div>

          {filtered.length > shown.length && (
            <div className="flex justify-center pt-1">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setVisible(value => value + PAGE_SIZE)}>
                {t('loadMore', { count: localizedCount(filtered.length - shown.length, lang) })}
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyPanel
          icon={<Search className="size-5 text-muted-foreground" />}
          text={t('noResults')}
          actionLabel={t('clearFilters')}
          onAction={clearAll}
        />
      )}
    </div>
  );
}
