import type { MetadataRoute } from 'next';

/**
 * Crawler policy:
 * - Preview/development: disallow everything so staging never ranks.
 * - Production: block the JSON API, which is data rather than content. The
 *   dashboard and sign-in pages are left crawlable on purpose — each already
 *   emits `robots: noindex`, and a page blocked here could never be fetched for
 *   that directive to be seen, so it could linger in the index as a bare URL.
 *   (Paths are localized — `/en/dashboard` — so a literal `/dashboard` rule
 *   would never have matched them anyway.)
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');

  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api'],
      },
    ],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
    host: base,
  };
}
