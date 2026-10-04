import Navbar from '@/components/navbar';
import { JsonLd } from '@/components/JsonLd';
import { SectionHeader } from '@/components/sections/section-header';
import SupportBrowser, { type SupportReturnStatus } from '@/components/support/support-browser';
import { getDonationProgress, getDonations, getProfile, getSocials, getSupportStats, getSupporters } from '@/lib/data';
import { PRODUCT_CURRENCY_CODES } from '@/constants/global';
import { brandedTitle, languageAlternates, localeUrl, ogImageFor } from '@/lib/seo';
import { documentKey, localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/** The wall changes when a gift is confirmed; admin writes revalidate sooner. */
export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Only the four return states the callback can produce. */
const RETURN_STATUSES = ['success', 'cancelled', 'failed', 'error'] as const;

function asLocale(locale: string): AppLocale {
  return locale === 'fa' ? 'fa' : 'en';
}

function asReturnStatus(value: string | string[] | undefined): SupportReturnStatus | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return RETURN_STATUSES.includes(raw as (typeof RETURN_STATUSES)[number]) ? (raw as SupportReturnStatus) : undefined;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = asLocale(locale);
  const [t, profile] = await Promise.all([getTranslations({ locale, namespace: 'support' }), getProfile(lang)]);

  const title = t('title');
  const description = t('description');
  const url = localeUrl(locale, '/support');
  const brand = brandedTitle(profile, lang);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates('/support'),
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

export default async function SupportPage({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const lang = asLocale(locale);
  const returnStatus = asReturnStatus(query.status);

  const [t, options, supporters, stats, socials] = await Promise.all([
    getTranslations({ locale, namespace: 'support' }),
    getDonations(lang),
    getSupporters(lang),
    getSupportStats(lang),
    getSocials(lang),
  ]);

  const progress = await getDonationProgress(lang, options);

  // `?option=` opens one dialog straight away, for a link shared from anywhere.
  const wanted = firstValue(query.option);
  const initialOption = wanted ? options.find(option => documentKey(option) === wanted) : undefined;

  return (
    <main>
      <section aria-labelledby="support-heading">
        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: t('title'),
            description: t('description'),
            url: localeUrl(locale, '/support'),
            inLanguage: locale,
            potentialAction: {
              '@type': 'DonateAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: localeUrl(locale, '/support'),
                actionPlatform: 'http://schema.org/DesktopWebPlatform',
              },
              offers: options.map(option => ({
                '@type': 'Offer',
                name: option.title,
                price: option.amount > 0 ? option.amount : 0,
                priceCurrency: PRODUCT_CURRENCY_CODES[option.currency],
                availability: 'https://schema.org/InStock',
              })),
            },
          }}
        />

        <SectionHeader
          as="h1"
          id="support-heading"
          label={t('eyebrow')}
          title={t('title')}
          description={t('description')}
          meta={options.length ? t('count', { count: localizedCount(options.length, lang) }) : undefined}
          delay={0.04}
        />

        <SupportBrowser
          options={options}
          supporters={supporters}
          stats={stats}
          progress={progress}
          initialOption={initialOption}
          returnStatus={returnStatus}
        />

        <Navbar socials={socials} />
      </section>
    </main>
  );
}
