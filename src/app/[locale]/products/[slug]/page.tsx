import Navbar from '@/components/navbar';
import PostShare from '@/components/blog/post-share';
import { PriceTag } from '@/components/products/price-tag';
import { ProductCard } from '@/components/products/ProductCard';
import { JsonLd } from '@/components/JsonLd';
import { MarkdownBody } from '@/components/markdown-body';
import { eyebrowClass } from '@/components/sections/section-header';
import BlurFade from '@/components/magicui/blur-fade';
import { buttonVariants } from '@/components/ui/button';
import { PRODUCT_CURRENCY_CODES } from '@/constants/global';
import { getProfile, getProductByKey, getProducts, getSocials } from '@/lib/data';
import { languageAlternates, localeUrl, ogImageFor } from '@/lib/seo';
import { cn, documentKey, formatYearMonthLocal, isOptimizableImage, localizedCount } from '@/lib/utils';
import type { AppLocale, IProduct } from '@/types';
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, ShoppingBag, Tag } from 'lucide-react';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

/** Product pages refresh hourly; admin writes revalidate immediately. */
export const revalidate = 3600;

type Props = { params: Promise<{ locale: string; slug: string }> };

function asLocale(locale: string): AppLocale {
  return locale === 'fa' ? 'fa' : 'en';
}

/** Resolve params once; reuse for metadata and rendering. */
async function loadProduct(params: Props['params']) {
  const { locale, slug } = await params;
  const product = await getProductByKey(asLocale(locale), decodeURIComponent(slug));
  return { locale, product };
}

function productUrl(locale: string, product: IProduct) {
  return localeUrl(locale, `/products/${documentKey(product)}`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, product } = await loadProduct(params);
  const t = await getTranslations({ locale, namespace: 'productPage' });

  if (!product) {
    return { title: t('notFound'), robots: { index: false, follow: false } };
  }

  const url = productUrl(locale, product);
  const description = product.description || t('defaultDescription');
  const image = product.image || ogImageFor(product.title, locale);

  return {
    title: product.title,
    description,
    keywords: product.features,
    alternates: { canonical: url, languages: languageAlternates(`/products/${documentKey(product)}`) },
    openGraph: {
      type: 'website',
      title: product.title,
      description,
      url,
      locale: locale === 'fa' ? 'fa_IR' : 'en_US',
      images: [{ url: image, width: 1200, height: 630, alt: product.title }],
    },
    twitter: { card: 'summary_large_image', title: product.title, description, images: [image] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, product } = await loadProduct(params);
  if (!product) notFound();

  const lang = asLocale(locale);
  const [t, tProducts, profile, all, socials] = await Promise.all([
    getTranslations({ locale, namespace: 'productPage' }),
    getTranslations({ locale, namespace: 'productsPage' }),
    getProfile(lang),
    getProducts(lang),
    getSocials(lang),
  ]);

  const more = all.filter(item => item._id !== product._id).slice(0, 3);
  const url = productUrl(locale, product);
  const author = profile?.fullName || profile?.name;
  const cover = product.image;
  const purchasable = product.available && Boolean(product.href);

  return (
    <main>
      <article>
        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: product.description || undefined,
            url,
            inLanguage: locale,
            image: cover || undefined,
            category: product.category || undefined,
            brand: author ? { '@type': 'Brand', name: author } : undefined,
            offers: {
              '@type': 'Offer',
              url: product.href || url,
              price: product.price,
              priceCurrency: PRODUCT_CURRENCY_CODES[product.currency],
              availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            },
          }}
        />
        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: tProducts('title'), item: localeUrl(locale, '/products') },
              { '@type': 'ListItem', position: 2, name: product.title, item: url },
            ],
          }}
        />

        <BlurFade delay={0.04}>
          <Link
            href={`/${locale}/products`}
            className="-ms-1 mb-6 inline-flex items-center gap-1.5 rounded-full px-1 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5 rtl:-scale-x-100" aria-hidden />
            {t('backToProducts')}
          </Link>
        </BlurFade>

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className={eyebrowClass}>{t('eyebrow')}</p>
            {product.category && (
              <>
                <span aria-hidden className="text-border">
                  ·
                </span>
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground" dir="auto">
                  <Tag className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{product.category}</span>
                </span>
              </>
            )}
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                product.available ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <span aria-hidden className={cn('size-1.5 rounded-full', product.available ? 'bg-foreground' : 'bg-muted-foreground/40')} />
              {product.available ? t('inStock') : t('unavailable')}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold leading-tight ltr:tracking-tight sm:text-3xl md:text-4xl">{product.title}</h1>

          {product.description && (
            <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground rtl:leading-[1.9] sm:text-base">
              {product.description}
            </p>
          )}

          <div aria-hidden className="rule-fade mt-6" />
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-10">
          {/* Price and purchase lead on mobile, then move to the side rail. */}
          <aside className="order-first self-start lg:sticky lg:top-10 lg:order-last">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="p-5">
                <p className={eyebrowClass}>{t('price')}</p>
                <PriceTag amount={product.price} currency={product.currency} className="mt-2 text-3xl font-bold leading-none" />
              </div>

              <div className="space-y-4 border-t bg-muted/30 p-5">
                {purchasable ? (
                  <a
                    href={product.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ size: 'lg' }), 'w-full rounded-xl')}
                  >
                    <ShoppingBag className="me-2 size-4" aria-hidden />
                    {t('buy')}
                    <ArrowUpRight className="ms-2 size-3.5 opacity-70 rtl:-scale-x-100" aria-hidden />
                  </a>
                ) : product.available ? (
                  <Link href={`/${locale}#contact`} className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full rounded-xl')}>
                    {t('enquire')}
                  </Link>
                ) : (
                  <p className="rounded-xl border border-dashed px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">{t('unavailableNote')}</p>
                )}

                <dl className="space-y-2.5 border-t pt-4 text-xs">
                  {product.category && (
                    <div className="flex items-center gap-2">
                      <dt className="flex items-center gap-2 text-muted-foreground">
                        <Tag className="size-3.5 shrink-0" aria-hidden />
                        {t('category')}
                      </dt>
                      <dd className="ms-auto truncate font-medium" dir="auto">
                        {product.category}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                      {t('updated')}
                    </dt>
                    <dd className="ms-auto shrink-0 font-medium tabular-nums">{formatYearMonthLocal(product.updatedAt || product.createdAt, lang)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-8">
            {cover && (
              <BlurFade delay={0.08}>
                <figure className="overflow-hidden rounded-xl border bg-card shadow-sm">
                  {isOptimizableImage(cover) ? (
                    <Image
                      src={cover}
                      alt={product.title}
                      width={1600}
                      height={1200}
                      priority
                      sizes="(max-width: 1023px) 100vw, 620px"
                      className="aspect-[4/3] w-full object-cover object-top"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={product.title} className="aspect-[4/3] w-full object-cover" decoding="async" />
                  )}
                </figure>
              </BlurFade>
            )}

            {product.features.length > 0 && (
              <BlurFade delay={0.1}>
                <section aria-labelledby="product-features-heading">
                  <div className="mb-4 flex items-center gap-2">
                    <h2 id="product-features-heading" className={eyebrowClass}>
                      {t('features')}
                    </h2>
                    <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                      {localizedCount(product.features.length, lang)}
                    </span>
                  </div>
                  <ul className="grid gap-x-6 gap-y-3 rounded-2xl border bg-card p-5 shadow-sm sm:grid-cols-2">
                    {product.features.map(feature => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <span aria-hidden className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full border text-muted-foreground">
                          <Check className="size-3" aria-hidden />
                        </span>
                        <span className="min-w-0" dir="auto">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              </BlurFade>
            )}

            {product.details && (
              <BlurFade delay={0.12}>
                <MarkdownBody content={product.details} />
              </BlurFade>
            )}

            <BlurFade delay={0.14}>
              <div className="border-t pt-6">
                <PostShare title={product.title} url={url} />
              </div>
            </BlurFade>
          </div>
        </div>

        {more.length > 0 && (
          <section aria-labelledby="more-products-heading" className="mt-12">
            <h2 id="more-products-heading" className={cn(eyebrowClass, 'mb-4')}>
              {t('more')}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {more.map(item => (
                <ProductCard
                  key={item._id}
                  title={item.title}
                  description={item.description}
                  price={item.price}
                  currency={item.currency}
                  available={item.available}
                  category={item.category}
                  image={item.image}
                  features={item.features}
                  detailHref={`/${locale}/products/${documentKey(item)}`}
                  unavailableLabel={t('unavailable')}
                  className="h-full"
                />
              ))}
            </div>
          </section>
        )}

        <Navbar socials={socials} />
      </article>
    </main>
  );
}
