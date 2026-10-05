import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn, formatYearMonthLocal, isOptimizableImage, localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IBlog } from '@/features/blog/types';
import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

interface BlogCardProps {
  post: IBlog;
  /** Active locale, used to build the localized post-page link. */
  locale: string;
  lang: AppLocale;
  className?: string;
  /** Cover is the LCP element of the first cards on the page. */
  priority?: boolean;
  /** Heading level of the title; the home grid uses `h3`. */
  headingLevel?: 'h2' | 'h3';
}

/**
 * Home-grid blog card. It borrows the portfolio/product card measure — a cover,
 * a clamped summary and the meta pinned to the bottom — so a three-column row
 * stays even whatever the copy length. Covers render in grayscale to protect the
 * monochrome palette and regain colour on hover, and the title carries a
 * stretched link so the whole surface is clickable.
 */
export function BlogCard({ post, locale, lang, className, priority = false, headingLevel: Heading = 'h3' }: BlogCardProps) {
  const t = useTranslations('blogPage');
  const src = post.image;
  const cover = src && isOptimizableImage(src) ? src : undefined;
  const tags = post.tags ?? [];

  return (
    <Card className={cn('group relative flex h-full flex-col overflow-hidden p-0 transition-colors hover:border-foreground/30', className)}>
      <div className="relative aspect-[16/9] w-full overflow-hidden border-b bg-muted">
        {cover ? (
          <Image
            src={cover}
            alt={post.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1023px) 46vw, 300px"
            className="object-cover object-top grayscale transition-[filter] duration-500 group-hover:grayscale-0"
          />
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={post.title} loading="lazy" decoding="async" className="size-full object-cover grayscale" />
        ) : (
          // Deterministic monogram keeps the grid aligned without an image.
          <span aria-hidden className="flex size-full items-center justify-center text-3xl font-bold text-muted-foreground/40">
            {(post.title || '?').trim().charAt(0)}
          </span>
        )}
      </div>

      <div className="flex grow flex-col p-4">
        <Heading className="min-w-0 text-sm font-semibold leading-snug">
          <Link
            href={`/${locale}/blog/${post.slug}`}
            className="decoration-muted-foreground/50 underline-offset-2 transition-colors after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            {post.title}
          </Link>
        </Heading>

        {post.summary && <p className="mt-2 line-clamp-3 text-pretty text-xs leading-relaxed text-muted-foreground">{post.summary}</p>}

        {/* One block pinned to the bottom, so cards of different text length
            still land their tags and meta on the same line. */}
        <div className="mt-auto flex flex-col gap-2.5 pt-4">
          {tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {tags.slice(0, 4).map(tag => (
                <li key={tag}>
                  <Badge variant="secondary" className="px-2 py-0 text-[10px] font-normal">
                    {tag}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          <div className="relative z-10 flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-3 text-[11px] text-muted-foreground sm:text-xs">
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
          </div>
        </div>
      </div>
    </Card>
  );
}
