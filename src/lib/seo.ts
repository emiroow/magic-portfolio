import { routing } from '@/i18n/routing';
import type { AppLocale } from '@/types';
import type { IProfile } from '@/features/profile/types';

/** Shared SEO constants and helpers. */

/** Localized site suffix for brand titles. */
const SITE_SUFFIX: Record<AppLocale, string> = {
  en: 'Portfolio',
  fa: 'سایت شخصی',
};

/** Localized fallback meta descriptions. */
export const SITE_DESCRIPTION: Record<AppLocale, string> = {
  en: 'Personal developer portfolio: projects, experience, skills and blog.',
  fa: 'سایت شخصی توسعه‌دهنده: پروژه‌ها، تجربیات، مهارت‌ها و وبلاگ.',
};

/** Brand title `Name | Job Title | <suffix>` built from the profile (no env). */
export function brandedTitle(profile: IProfile | null, locale: AppLocale = 'en'): string {
  const name = profile?.fullName?.trim() || profile?.name?.trim();
  const job = profile?.jobTitle?.trim();

  return [name, job, SITE_SUFFIX[locale]].filter(Boolean).join(' | ');
}

const rawSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
// Fall back to localhost only in development so broken URLs can't ship.
const fallbackSite = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined;

/** Canonical site origin without a trailing slash. */
export const site = (rawSite || fallbackSite || '').replace(/\/$/, '') || undefined;

/** Twitter/X handle including the leading `@`. */
export const TWITTER_HANDLE = process.env.NEXT_PUBLIC_TWITTER_HANDLE || '';

/** Dynamic Open Graph image endpoint. */
export const OG_IMAGE_URL = site ? `${site}/api/og` : '/api/og';

/** Generated social card for a page title, rendered with the right profile. */
export function ogImageFor(title: string, locale: string) {
  return `${OG_IMAGE_URL}?title=${encodeURIComponent(title)}&lang=${locale === 'fa' ? 'fa' : 'en'}`;
}

/** Turn a relative path into an absolute site URL. */
export function absoluteUrl(path = '/') {
  const p = path.startsWith('/') ? path : `/${path}`;
  return site ? `${site}${p}` : p;
}

/** Canonical URL for a path within a locale. */
export function localeUrl(locale: string, path = '') {
  const p = path && !path.startsWith('/') ? `/${path}` : path;
  return absoluteUrl(`/${locale}${p}`);
}

/** hreflang alternates (en, fa, x-default) for a localized path. */
export function languageAlternates(path = '') {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = localeUrl(locale, path);
  }
  languages['x-default'] = localeUrl(routing.defaultLocale, path);
  return languages;
}
