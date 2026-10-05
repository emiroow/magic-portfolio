'use client';

import { EmptyPanel } from '@/components/empty-panel';
import BlurFade from '@/components/magicui/blur-fade';
import { eyebrowClass } from '@/components/section-header';
import { Stack } from '@/components/stack';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListingToolbar } from '@/components/ui/listing-toolbar';
import { cn, formatYearMonthLocal, isOptimizableImage, localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IBlog } from '@/features/blog/types';
import { Clock, FileText, Search } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo, useState } from 'react';

/** Posts rendered before the “load more” control appears. */
const PAGE_SIZE = 6;

interface BlogListClientProps {
  posts: IBlog[];
  tags: string[];
  /** Pre-selected tag, e.g. from `/blog?tag=nextjs`. */
  initialTag?: string;
}

/** Cover image or a deterministic monogram, used by the featured card and rows. */
function Cover({ post, className, sizes }: { post: IBlog; className?: string; sizes: string }) {
  const monogram = (post.title || '?').trim().charAt(0);
  const src = post.image;

  return (
    <div className={cn('relative shrink-0 overflow-hidden bg-muted/40', className)}>
      {src && isOptimizableImage(src) ? (
        <Image
          src={src}
          alt={post.title}
          fill
          sizes={sizes}
          className="object-cover object-top grayscale transition-[filter] duration-500 group-hover:grayscale-0"
        />
      ) : src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={post.title} className="size-full object-cover grayscale" loading="lazy" decoding="async" />
      ) : (
        <span aria-hidden className="flex size-full items-center justify-center text-xl font-bold text-muted-foreground/40">
          {monogram}
        </span>
      )}
    </div>
  );
}

/** Meta line shared by every card: date · reading time. */
function PostMeta({ post, lang, className }: { post: IBlog; lang: AppLocale; className?: string }) {
  const t = useTranslations('blogPage');

  return (
    <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground sm:text-xs', className)}>
      <time dateTime={post.createdAt}>{formatYearMonthLocal(post.createdAt, lang)}</time>
      {Boolean(post.readingMinutes) && (
        <>
          <span aria-hidden className="text-border">
            ·
          </span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock className="size-3" aria-hidden />
            {t('readingTime', { minutes: localizedCount(post.readingMinutes ?? 0, lang) })}
          </span>
        </>
      )}
      {post.updatedAt && post.updatedAt !== post.createdAt && (
        <>
          <span aria-hidden className="text-border">
            ·
          </span>
          <span>{t('updated', { date: formatYearMonthLocal(post.updatedAt, lang) })}</span>
        </>
      )}
    </div>
  );
}

/**
 * Blog listing: instant search, tag filter, a featured post and a divided
 * list that reveals the rest on demand. Rows share the surface language of
 * the home page timelines.
 */
export default function BlogListClient({ posts, tags, initialTag }: BlogListClientProps) {
  const t = useTranslations('blogPage');
  const currentLocale = useLocale();
  const lang: AppLocale = currentLocale === 'fa' ? 'fa' : 'en';

  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(initialTag || null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return posts.filter(post => {
      if (activeTag && !(post.tags ?? []).includes(activeTag)) return false;
      if (!needle) return true;
      return (
        (post.title || '').toLowerCase().includes(needle) ||
        (post.summary || '').toLowerCase().includes(needle) ||
        (post.tags ?? []).some(tag => tag.toLowerCase().includes(needle))
      );
    });
  }, [posts, query, activeTag]);

  const filtering = Boolean(query.trim() || activeTag);
  const [featured, ...rest] = filtered;
  const listed = filtering ? filtered : rest;
  const shown = listed.slice(0, visible);

  const resetPaging = (next: string) => {
    setQuery(next);
    setVisible(PAGE_SIZE);
  };

  const pickTag = (tag: string | null) => {
    setActiveTag(tag);
    setVisible(PAGE_SIZE);
  };

  const clearAll = () => {
    resetPaging('');
    pickTag(null);
  };

  if (!posts.length) {
    return <EmptyPanel icon={<FileText className="size-5 text-muted-foreground" />} text={t('empty')} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <ListingToolbar
        query={query}
        onQueryChange={resetPaging}
        searchLabel={t('searchPlaceholder')}
        clearSearchLabel={t('clearSearch')}
        options={tags}
        active={activeTag}
        onPick={pickTag}
        meta={filtering ? t('count', { count: localizedCount(filtered.length, lang) }) : undefined}
        clearLabel={t('clearFilters')}
        onClear={clearAll}
      />

      {filtered.length === 0 ? (
        <EmptyPanel
          icon={<Search className="size-5 text-muted-foreground" />}
          text={t('noResults')}
          actionLabel={t('clearFilters')}
          onAction={clearAll}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Featured post: only on the unfiltered listing. */}
          {featured && !filtering && (
            <BlurFade inView>
              <Link
                href={`/${currentLocale}/blog/${featured.slug}`}
                className="group grid overflow-hidden rounded-xl border bg-card shadow-sm transition-colors hover:border-foreground/30 sm:grid-cols-2"
              >
                <Cover post={featured} className="aspect-[16/9] sm:aspect-auto sm:min-h-[220px]" sizes="(max-width: 640px) 100vw, 376px" />
                <div className="flex flex-col p-5 sm:p-6">
                  <p className={eyebrowClass}>{t('featured')}</p>
                  <h2 className="mt-2 text-lg font-bold leading-snug ltr:tracking-tight sm:text-xl">{featured.title}</h2>
                  {featured.summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{featured.summary}</p>}
                  <PostMeta post={featured} lang={lang} className="mt-auto pt-4" />
                </div>
              </Link>
            </BlurFade>
          )}

          {shown.length > 0 && (
            <Stack>
              {shown.map(post => (
                <BlurFade key={post.slug} inView>
                  <Link
                    href={`/${currentLocale}/blog/${post.slug}`}
                    className="group flex items-start gap-4 px-4 py-4 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 sm:px-5"
                  >
                    <Cover post={post} className="mt-0.5 size-14 rounded-lg border sm:size-20" sizes="80px" />
                    <div className="min-w-0 grow">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <h2 className="min-w-0 text-sm font-semibold leading-snug transition-colors group-hover:underline sm:text-base">
                          {post.title}
                        </h2>
                        <PostMeta post={post} lang={lang} className="shrink-0 justify-end" />
                      </div>
                      {post.summary && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{post.summary}</p>}
                      {Boolean(post.tags?.length) && (
                        <ul className="mt-2.5 flex flex-wrap gap-1.5">
                          {post.tags?.slice(0, 4).map(tag => (
                            <li key={tag}>
                              <Badge variant="secondary" className="px-2 py-0 text-[10px] font-normal">
                                {tag}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Link>
                </BlurFade>
              ))}
            </Stack>
          )}

          {listed.length > shown.length && (
            <div className="flex justify-center pt-1">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setVisible(value => value + PAGE_SIZE)}>
                {t('loadMore', { count: localizedCount(listed.length - shown.length, lang) })}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
