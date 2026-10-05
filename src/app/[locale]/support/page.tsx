import Navbar from '@/components/navbar';
import { JsonLd } from '@/components/JsonLd';
import { SectionHeader } from '@/components/sections/section-header';
import SupportBrowser, { type SupportReturnStatus } from '@/components/support/support-browser';
import { getDonations, getProfile, getSocials, getSupportStats, getSupporterCounts, getSupporters } from '@/lib/data';
import { PRODUCT_CURRENCY_CODES } from '@/constants/global';
import { handlesMoney } from '@/lib/support';
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

/** `?amount=` carries a number chosen on the home page; junk is ignored. */
function asAmount(value: string | string[] | undefined): number | undefined {
  const raw = firstValue(value);
  if (!raw) return undefined;

  const parsed = Number(raw.replace(/[^\d]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
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
  const initialAmount = asAmount(query.amount);

  const [t, methods, supporters, stats, socials] = await Promise.all([
    getTranslations({ locale, namespace: 'support' }),
    getDonations(lang),
    getSupporters(lang),
    getSupportStats(lang),
    getSocials(lang),
  ]);

  const counts = await getSupporterCounts(lang, methods);

  // `?option=` opens one method straight away, for a link shared from anywhere;
  // `?variant=` points at one destination of it and `?amount=` adds the number.
  const wanted = firstValue(query.option);
  const initialMethod = wanted ? methods.find(method => documentKey(method) === wanted) : undefined;
  const initialVariantKey = firstValue(query.variant) || undefined;

  /** A free gesture is not an offer: only the rails that take money are listed as one. */
  const priced = methods.filter(method => handlesMoney(method.mode));

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
            ...(priced.length
              ? {
                  potentialAction: {
                    '@type': 'DonateAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: localeUrl(locale, '/support'),
                      actionPlatform: 'http://schema.org/DesktopWebPlatform',
                    },
                    offers: priced.map(method => ({
                      '@type': 'Offer',
                      name: method.title,
                      price: method.amount > 0 ? method.amount : 0,
                      priceCurrency: PRODUCT_CURRENCY_CODES[method.currency],
                      availability: 'https://schema.org/InStock',
                    })),
                  },
                }
              : {}),
          }}
        />

        <SectionHeader
          as="h1"
          id="support-heading"
          label={t('eyebrow')}
          title={t('title')}
          description={t('description')}
          meta={methods.length ? t('count', { count: localizedCount(methods.length, lang) }) : undefined}
          delay={0.04}
        />

        <SupportBrowser
          methods={methods}
          supporters={supporters}
          stats={stats}
          counts={counts}
          initialMethod={initialMethod}
          initialVariantKey={initialVariantKey}
          initialAmount={initialMethod ? initialAmount : undefined}
          returnStatus={returnStatus}
        />

        <Navbar socials={socials} />
      </section>
    </main>
  );
}
