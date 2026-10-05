import { getBlogList } from '@/features/blog/queries';
import { getProfile } from '@/features/profile/queries';
import { site } from '@/lib/seo';
import type { AppLocale } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

/** Escape text for XML feed content. */
function escapeXml(unsafe: string) {
  return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** Feed labels per locale; drafts never reach this route. */
const COPY = {
  fa: { title: 'وبلاگ', description: 'آخرین نوشتارهای وبلاگ', author: 'نویسنده' },
  en: { title: 'Blog', description: 'Latest articles from the blog', author: 'Author' },
} as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'fa' && locale !== 'en') {
    return new NextResponse('Not Found', { status: 404 });
  }

  const lang = locale as AppLocale;
  const base = site ?? '';
  const [posts, profile] = await Promise.all([getBlogList(lang), getProfile(lang)]);
  const copy = COPY[lang];

  const author = profile?.fullName || profile?.name;
  const feedTitle = author ? `${author} — ${copy.title}` : copy.title;

  const items = posts
    .map(post => {
      const link = `${base}/${locale}/blog/${post.slug}`;
      const categories = (post.tags ?? []).map(tag => `        <category>${escapeXml(tag)}</category>`).join('\n');

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(post.createdAt ?? Date.now()).toUTCString()}</pubDate>
      ${author ? `<dc:creator>${escapeXml(author)}</dc:creator>` : ''}
      ${post.summary ? `<description><![CDATA[${post.summary}]]></description>` : ''}
${categories}
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${base}/${locale}/blog</link>
    <description>${escapeXml(copy.description)}</description>
    <language>${locale}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=600, stale-while-revalidate=3600',
    },
  });
}
