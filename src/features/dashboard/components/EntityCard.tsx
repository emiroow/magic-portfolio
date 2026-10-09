'use client';

import { Card } from '@/components/ui/card';
import { cn, isOptimizableImage, localizedCount } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import type { ReactNode } from 'react';

interface EntityCardProps {
  title: string;
  /** Direction of the title run: a Latin name on the Persian dashboard stays LTR. */
  titleDir?: 'ltr' | 'rtl' | 'auto';
  /** Second line: slug, dates, market, category. */
  meta?: ReactNode;
  /** Leading mark — a thumbnail, an icon tile or a monogram. */
  leading?: ReactNode;
  /** `RowAction` cluster. */
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * The one row surface every archive lists in.
 *
 * Projects, products, posts, support methods, supporters, schools, jobs and social
 * links all read the same way: a title with its meta, the actions at the trailing
 * edge, then the body. Under `sm` the action cluster drops to a full-width bar of
 * its own below a hairline — six 36px buttons beside a title is not a layout, it is
 * a squeeze, and the bar gives each one room a thumb can actually land on.
 */
export function EntityCard({ title, titleDir, meta, leading, actions, children, className }: EntityCardProps) {
  return (
    <Card className={cn('transition-colors hover:border-foreground/30', className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4 sm:p-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {leading}
          <div className="min-w-0 space-y-0.5">
            <h3 dir={titleDir} title={title} className="truncate text-sm font-semibold sm:text-base">
              {title}
            </h3>
            {meta && <div className="truncate text-[11px] leading-snug text-muted-foreground sm:text-xs">{meta}</div>}
          </div>
        </div>

        {actions && <div className="flex w-full shrink-0 flex-wrap items-center gap-1 border-t pt-3 sm:w-auto sm:border-0 sm:pt-0">{actions}</div>}
      </div>

      {children && <div className="px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>}
    </Card>
  );
}

/** Vertical rhythm of a card list. Kept here so no section invents its own gap. */
export function EntityList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-3', className)}>{children}</div>;
}

interface EntityThumbProps {
  src: string;
  alt: string;
  /** Responsive box, e.g. `aspect-video w-full sm:aspect-auto sm:h-20 sm:w-32`. */
  className?: string;
  sizes?: string;
  /** How many pictures the record carries; a pill says so when there is more than the cover. */
  count?: number;
}

/**
 * A row's cover thumbnail.
 *
 * Only a same-origin, optimizable URL goes through `next/image`; a pasted external
 * one would need a domain allowlisted at build time, so it falls back to a plain
 * `img` rather than throwing at runtime on a record the owner just saved.
 */
export function EntityThumb({ src, alt, className, sizes = '(max-width: 640px) 100vw, 128px', count = 1 }: EntityThumbProps) {
  const t = useTranslations('dashboard.gallery');
  const locale = useLocale();
  const lang: 'fa' | 'en' = locale === 'fa' ? 'fa' : 'en';

  return (
    <div className={cn('relative shrink-0 overflow-hidden rounded-lg border', className)}>
      {isOptimizableImage(src) ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" decoding="async" className="size-full object-cover" />
      )}

      {count > 1 && (
        <span
          title={t('stored', { count: localizedCount(count, lang) })}
          className="absolute bottom-1 end-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-medium tabular-nums shadow-sm"
        >
          {localizedCount(count, lang)}
        </span>
      )}
    </div>
  );
}
