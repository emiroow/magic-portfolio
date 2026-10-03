import ProductsGrid from '@/components/products/ProductsGrid';
import Navbar from '@/components/navbar';
import { JsonLd } from '@/components/JsonLd';
import { SectionHeader } from '@/components/sections/section-header';
import { getProfile, getProductCategories, getProducts, getSocials } from '@/lib/data';
import { brandedTitle, languageAlternates, localeUrl, ogImageFor } from '@/lib/seo';
import { localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/** The catalogue refreshes every hour, like the archive it sits beside. */
export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

function asLocale(locale: string): AppLocale {
  return locale === 'fa' ? 'fa' : 'en';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = asLocale(locale);
  const [t, profile] = await Promise.all([getTranslations({ locale, namespace: 'productsPage' }), getProfile(lang)]);

  const title = t('title');
  const description = t('description');
  const url = localeUrl(locale, '/products');
  const brand = brandedTitle(profile, lang);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates('/products'),
    },
    openGraph: {
      type: 'website',
      title: `${title} | ${brand}`,
      description,
      url,
      locale: locale === 'fa' ? 'fa_IR' : 'en_US',
      images: [{ url: ogImageFor(title, locale), width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params;
  const lang = asLocale(locale);

  const [t, products, categories, socials] = await Promise.all([
    getTranslations({ locale, namespace: 'productsPage' }),
    getProducts(lang),
    getProductCategories(lang),
    getSocials(lang),
  ]);

  return (
    <main>
      <section aria-labelledby="products-heading">
        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: t('title'),
            description: t('description'),
            url: localeUrl(locale, '/products'),
            inLanguage: locale,
          }}
        />

        <SectionHeader
          as="h1"
          id="products-heading"
          label={t('eyebrow')}
          title={t('title')}
          description={t('description')}
          meta={products.length ? t('count', { count: localizedCount(products.length, lang) }) : undefined}
          delay={0.04}
        />

        <ProductsGrid products={products} categories={categories} />

        <Navbar socials={socials} />
      </section>
    </main>
  );
}
