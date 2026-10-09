import { JsonLd } from '@/components/JsonLd';
import BlurFade from '@/components/magicui/blur-fade';
import PostShare from '@/features/blog/post-share';
import { MarkdownBody } from '@/components/markdown-body';
import { ImageGallery } from '@/components/image-gallery';
import Navbar from '@/components/navbar';
import { eyebrowClass } from '@/components/section-header';
import { Badge } from '@/components/ui/badge';
import { getBlogBySlug, getBlogList, getRelatedPosts } from '@/features/blog/queries';
import { getProfile } from '@/features/profile/queries';
import { getSocials } from '@/features/socials/queries';
import { languageAlternates, localeUrl, ogImageFor } from '@/lib/seo';
import { cn, formatYearMonthLocal, galleryUrls, localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IBlog } from '@/features/blog/types';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

/** Revalidate articles every 5 minutes, like the listing. */
export const revalidate = 300;

type Props = { params: Promise<{ locale: string; slug: string }> };

function asLocale(locale: string): AppLocale {
  return locale === 'fa' ? 'fa' : 'en';
}

/** Resolve params once; reuse for metadata and rendering. */
async function loadPost(params: Props['params']) {
  const { locale, slug } = await params;
  const post = await getBlogBySlug(asLocale(locale), decodeURIComponent(slug));
  return { locale, post };
}

/** Social card: the post cover when there is one, otherwise the generated title card. */
function postImage(post: IBlog, locale: string) {
  return post.image || ogImageFor(post.title, locale);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, post } = await loadPost(params);

  if (!post) {
    // Localized titles without a DB round-trip on missing posts.
    const t = await getTranslations({ locale, namespace: 'blogPost' });
    return { title: t('notFound'), robots: { index: false, follow: false } };
  }

  const t = await getTranslations({ locale, namespace: 'blogPost' });
  const url = localeUrl(locale, `/blog/${post.slug}`);
  const description = post.summary || t('defaultDescription');
  const image = postImage(post, locale);

  return {
    title: post.title,
    description,
    keywords: post.tags,
    alternates: { canonical: url, languages: languageAlternates(`/blog/${post.slug}`) },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url,
      locale: locale === 'fa' ? 'fa_IR' : 'en_US',
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt || post.createdAt,
      tags: post.tags,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, post } = await loadPost(params);
  if (!post) notFound();

  const lang = asLocale(locale);
  const [t, tBlog, profile, all, related, socials] = await Promise.all([
    getTranslations({ locale, namespace: 'blogPost' }),
    getTranslations({ locale, namespace: 'blogPage' }),
    getProfile(lang),
    getBlogList(lang),
    getRelatedPosts(lang, post),
    getSocials(lang),
  ]);

  // Previous/next computed from the recency-sorted list.
  const index = all.findIndex(p => p.slug === post.slug);
  const prev = index > 0 ? all[index - 1] : undefined;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : undefined;

  const url = localeUrl(locale, `/blog/${post.slug}`);
  const rawMinutes = post.readingMinutes ?? 0;
  const minutes = localizedCount(rawMinutes, lang);
  const author = profile?.fullName || profile?.name;
  const gallery = galleryUrls(post);

  return (
    <main>
      <article>
        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            mainEntityOfPage: { '@type': 'WebPage', '@id': url },
            headline: post.title,
            description: post.summary || undefined,
            image: gallery.length > 0 ? gallery : undefined,
            keywords: post.tags?.join(', ') || undefined,
            datePublished: post.createdAt,
            dateModified: post.updatedAt || post.createdAt,
            inLanguage: locale,
            author: {
              '@type': 'Person',
              name: author || undefined,
              url: localeUrl(locale),
            },
          }}
        />
        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: tBlog('title'), item: localeUrl(locale, '/blog') },
              { '@type': 'ListItem', position: 2, name: post.title, item: url },
            ],
          }}
        />

        <BlurFade delay={0.04}>
          <Link
            href={`/${locale}/blog`}
            className="-ms-1 mb-6 inline-flex items-center gap-1.5 rounded-full px-1 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5 rtl:-scale-x-100" aria-hidden />
            {t('backToBlog')}
          </Link>
        </BlurFade>

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            <time dateTime={post.createdAt} className={eyebrowClass}>
              {formatYearMonthLocal(post.createdAt, lang)}
            </time>
            {rawMinutes > 0 && (
              <>
                <span aria-hidden className="text-border">
                  ·
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] tabular-nums">
                  <Clock className="size-3" aria-hidden />
                  {t('readingTime', { minutes })}
                </span>
              </>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-bold leading-tight ltr:tracking-tight sm:text-3xl md:text-4xl">{post.title}</h1>

          {post.summary && (
            <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground rtl:leading-[1.9] sm:text-base">{post.summary}</p>
          )}

          {Boolean(post.tags?.length) && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {post.tags?.map(tag => (
                <li key={tag}>
                  <Link href={`/${locale}/blog?tag=${encodeURIComponent(tag)}`}>
                    <Badge
                      variant="secondary"
                      className="px-2 py-0.5 text-[11px] font-normal transition-colors hover:bg-foreground hover:text-background"
                    >
                      {tag}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div aria-hidden className="rule-fade mt-6" />
        </header>

        {gallery.length > 0 && (
          <BlurFade delay={0.08} className="mb-9">
            <ImageGallery images={gallery} alt={post.title} sizes="(max-width: 768px) 100vw, 768px" />
          </BlurFade>
        )}

        <BlurFade delay={0.1}>
          <MarkdownBody content={post.content} />
        </BlurFade>

        <BlurFade delay={0.14}>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
            <PostShare title={post.title} url={url} />
            {post.updatedAt && post.updatedAt !== post.createdAt && (
              <p className="text-[11px] text-muted-foreground">{t('updatedOn', { date: formatYearMonthLocal(post.updatedAt, lang) })}</p>
            )}
          </div>
        </BlurFade>

        {author && (
          <BlurFade delay={0.16} inView>
            <section aria-label={t('author')} className="mt-8 flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
              <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-muted/40 text-sm font-bold">
                {author.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{author}</p>
                {profile?.jobTitle && <p className="mt-0.5 text-xs text-muted-foreground">{profile.jobTitle}</p>}
                {profile?.summary && (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">{profile.summary}</p>
                )}
              </div>
            </section>
          </BlurFade>
        )}

        {(prev || next) && (
          <nav aria-label={t('pagination')} className="mt-10 grid gap-3 sm:grid-cols-2">
            {prev && (
              <Link
                href={`/${locale}/blog/${prev.slug}`}
                className="group flex items-center gap-3 rounded-xl border bg-card p-4 text-sm shadow-sm transition-colors hover:border-foreground/40"
              >
                <ArrowLeft
                  className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground rtl:-scale-x-100"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className={cn(eyebrowClass, 'block')}>{t('previous')}</span>
                  <span className="mt-1 line-clamp-1 block font-medium">{prev.title}</span>
                </span>
              </Link>
            )}
            {next && (
              <Link
                href={`/${locale}/blog/${next.slug}`}
                className={cn(
                  'group flex items-center justify-end gap-3 rounded-xl border bg-card p-4 text-end text-sm shadow-sm transition-colors hover:border-foreground/40',
                  !prev && 'sm:col-start-2'
                )}
              >
                <span className="min-w-0">
                  <span className={cn(eyebrowClass, 'block')}>{t('next')}</span>
                  <span className="mt-1 line-clamp-1 block font-medium">{next.title}</span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground rtl:-scale-x-100"
                  aria-hidden
                />
              </Link>
            )}
          </nav>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-12">
            <h2 id="related-heading" className={cn(eyebrowClass, 'mb-4')}>
              {t('related')}
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border bg-card shadow-sm">
              {related.map(item => (
                <li key={item.slug}>
                  <Link
                    href={`/${locale}/blog/${item.slug}`}
                    className="group flex items-baseline justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:px-5"
                  >
                    <span className="min-w-0 text-sm font-medium leading-snug transition-colors group-hover:underline">{item.title}</span>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{formatYearMonthLocal(item.createdAt, lang)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Navbar socials={socials} />
      </article>
    </main>
  );
}
