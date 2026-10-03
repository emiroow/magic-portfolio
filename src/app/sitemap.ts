import { getBlogList, getProducts, getProjects } from '@/lib/data';
import { documentKey } from '@/lib/utils';
import { routing } from '@/i18n/routing';
import type { AppLocale } from '@/types';
import type { MetadataRoute } from 'next';

/**
 * Localized sitemap: home + blog + catalogue pages per locale, plus every
 * blog post, project and product page.
 * Database-safe — content is simply omitted when the DB is unavailable.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (!baseUrl) {
    console.warn('sitemap: NEXT_PUBLIC_SITE_URL is not set; returning an empty sitemap.');
    return [];
  }

  const now = new Date();
  const url = (locale: string, path = '') => `${baseUrl}/${locale}${path}`;
  const alternates = (path: string, locales: readonly string[]) => ({
    languages: Object.fromEntries(locales.map(l => [l, url(l, path)])) as Record<string, string>,
  });

  const entries: MetadataRoute.Sitemap = [];

  // Home pages.
  for (const locale of routing.locales) {
    entries.push({
      url: url(locale),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: locale === routing.defaultLocale ? 1 : 0.9,
      alternates: alternates('', routing.locales),
    });
  }

  // Blog index.
  for (const locale of routing.locales) {
    entries.push({
      url: url(locale, '/blog'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: alternates('/blog', routing.locales),
    });
  }

  // Blog posts: slugs collected per locale; hreflang alternates are only
  // emitted when the same slug is translated in more than one locale.
  const postsByLocale = new Map<string, Map<string, string | undefined>>();
  for (const locale of routing.locales) {
    const posts = await getBlogList(locale as AppLocale);
    postsByLocale.set(locale, new Map(posts.map(p => [p.slug, p.updatedAt])));
  }

  for (const locale of routing.locales) {
    const posts = postsByLocale.get(locale);
    if (!posts) continue;

    for (const [slug, updatedAt] of posts) {
      const localizedIn = routing.locales.filter(l => postsByLocale.get(l)?.has(slug));
      entries.push({
        url: url(locale, `/blog/${slug}`),
        lastModified: updatedAt ? new Date(updatedAt) : now,
        changeFrequency: 'monthly',
        priority: 0.6,
        ...(localizedIn.length > 1 ? { alternates: alternates(`/blog/${slug}`, localizedIn) } : {}),
      });
    }
  }

  // Project archive.
  for (const locale of routing.locales) {
    entries.push({
      url: url(locale, '/projects'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: alternates('/projects', routing.locales),
    });
  }

  // Project pages, keyed by slug (or id when a record has no slug).
  const projectsByLocale = new Map<string, Map<string, string | undefined>>();
  for (const locale of routing.locales) {
    const projects = await getProjects(locale as AppLocale);
    projectsByLocale.set(
      locale,
      new Map(projects.map(p => [documentKey(p), undefined as string | undefined]))
    );
  }

  for (const locale of routing.locales) {
    const projects = projectsByLocale.get(locale);
    if (!projects) continue;

    for (const key of projects.keys()) {
      if (!key) continue;
      const localizedIn = routing.locales.filter(l => projectsByLocale.get(l)?.has(key));
      entries.push({
        url: url(locale, `/projects/${key}`),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
        ...(localizedIn.length > 1 ? { alternates: alternates(`/projects/${key}`, localizedIn) } : {}),
      });
    }
  }

  // Product catalogue.
  for (const locale of routing.locales) {
    entries.push({
      url: url(locale, '/products'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: alternates('/products', routing.locales),
    });
  }

  // Product pages, keyed by slug (or id when a record has no slug).
  const productsByLocale = new Map<string, Map<string, string | undefined>>();
  for (const locale of routing.locales) {
    const products = await getProducts(locale as AppLocale);
    productsByLocale.set(
      locale,
      new Map(products.map(p => [documentKey(p), p.updatedAt]))
    );
  }

  for (const locale of routing.locales) {
    const products = productsByLocale.get(locale);
    if (!products) continue;

    for (const [key, updatedAt] of products) {
      if (!key) continue;
      const localizedIn = routing.locales.filter(l => productsByLocale.get(l)?.has(key));
      entries.push({
        url: url(locale, `/products/${key}`),
        lastModified: updatedAt ? new Date(updatedAt) : now,
        changeFrequency: 'monthly',
        priority: 0.5,
        ...(localizedIn.length > 1 ? { alternates: alternates(`/products/${key}`, localizedIn) } : {}),
      });
    }
  }

  return entries;
}
