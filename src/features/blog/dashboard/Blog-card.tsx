'use client';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Loading from '@/components/ui/loading';
import type { IBlog } from '@/features/blog/types';
import { cn, formatYearMonthLocal, isOptimizableImage, localizedCount, readingTime } from '@/lib/utils';
import { ExternalLink, Eye, EyeOff, Pencil, Pin, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface BlogRowProps {
  post: IBlog;
  onEdit: (post: IBlog) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  /** 1-based position on the home page, or 0 when the post is not picked. */
  homePosition: number;
  /** Every slot is taken by another post, so this one cannot be picked. */
  slotsFull: boolean;
  onToggleHome: (post: IBlog) => void;
  togglingHome: boolean;
  onTogglePublished: (post: IBlog) => void;
  togglingPublished: boolean;
}

/**
 * Dashboard list item for a single blog post. It mirrors the project and
 * product rows exactly — a card header with the title, slug/date meta and the
 * action cluster (pin, open, publish, edit, delete), then a body with the cover
 * thumbnail, summary, tags and status badges — so switching between the three
 * panels feels like one surface.
 */
const BlogRow = ({
  post,
  onEdit,
  onDelete,
  isDeleting,
  homePosition,
  slotsFull,
  onToggleHome,
  togglingHome,
  onTogglePublished,
  togglingPublished,
}: BlogRowProps) => {
  const t = useTranslations('dashboard.blog');
  const tDash = useTranslations('dashboard');
  const locale = useLocale();
  const lang = locale === 'fa' ? 'fa' : 'en';
  const [confirmOpen, setConfirmOpen] = useState(false);

  const draft = post.published === false;
  const featured = !draft && post.featured === true;
  // The admin endpoint returns full documents, so the estimate is derived here.
  const minutes = readingTime(post.content);

  // A dead control is worse than no control: say why it is unavailable.
  const homeBlock = draft ? t('featuredNeedsPublish') : slotsFull && !featured ? t('featuredFull') : '';

  return (
    <Card className="transition-colors hover:border-foreground/30">
      <CardHeader className="flex-row items-center justify-between space-y-0 p-4 sm:p-5">
        <div className="min-w-0 space-y-0.5">
          <h3 className="truncate text-sm font-semibold sm:text-base">{post.title}</h3>
          <p className="truncate text-[11px] text-muted-foreground">
            <bdi dir="ltr">/{post.slug}</bdi> · {formatYearMonthLocal(post.createdAt, lang)}
            {minutes > 0 && ` · ${t('readingTime', { minutes: localizedCount(minutes, lang) })}`}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="ghost"
            className={cn('size-8', featured && 'text-foreground')}
            onClick={() => onToggleHome(post)}
            disabled={Boolean(homeBlock) || togglingHome}
            aria-pressed={featured}
            aria-label={featured ? t('removeFromHome') : t('addToHome')}
            title={homeBlock || (featured ? t('removeFromHome') : t('addToHome'))}
          >
            {togglingHome ? <Loading size="sm" /> : <Pin className={cn('size-4', featured && 'fill-current')} aria-hidden />}
          </Button>
          {!draft && (
            <Link
              href={`/${locale}/blog/${post.slug}`}
              target="_blank"
              aria-label={t('openPost')}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8')}
            >
              <ExternalLink className="size-4" aria-hidden />
            </Link>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => onTogglePublished(post)}
            disabled={togglingPublished}
            aria-pressed={!draft}
            aria-label={draft ? t('publish') : t('unpublish')}
            title={draft ? t('publish') : t('unpublish')}
          >
            {togglingPublished ? <Loading size="sm" /> : draft ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
          </Button>
          <Button size="icon" variant="ghost" className="size-8" onClick={() => onEdit(post)} aria-label={t('edit')}>
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            aria-label={tDash('delete')}
          >
            {isDeleting ? <Loading size="sm" /> : <Trash2 className="size-4" aria-hidden />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        <div className="flex flex-col gap-4 sm:flex-row">
          {post.image && (
            <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-lg border sm:h-20 sm:w-32 sm:aspect-auto">
              {isOptimizableImage(post.image) ? (
                <Image src={post.image} alt={post.title} fill sizes="(max-width: 640px) 100vw, 128px" className="object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.image} alt={post.title} loading="lazy" decoding="async" className="size-full object-cover" />
              )}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-3">
            {post.summary && <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{post.summary}</p>}

            {(post.tags?.length ?? 0) > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {post.tags?.map((tag, index) => (
                  <li key={`${tag}-${index}`}>
                    <Badge variant="secondary" className="px-2 py-0 text-[10px] font-normal">
                      {tag}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={draft ? 'outline' : 'default'} className="text-[10px]">
                {draft ? t('draft') : t('published')}
              </Badge>

              {featured && (
                <Badge variant="outline" className="text-[10px]">
                  {t('featuredBadge')}
                  {homePosition > 0 && (
                    <>
                      <span aria-hidden className="text-muted-foreground">
                        ·
                      </span>
                      <span className="tabular-nums text-muted-foreground">{localizedCount(homePosition, lang)}</span>
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        itemName={post.title}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete(post._id!);
        }}
      />
    </Card>
  );
};

export default BlogRow;
