'use client';

import { Dot, EntityCard, EntityThumb, HomeSlotChip, RowAction, StatusChip, TagChip } from '@/features/dashboard/components';
import type { IBlog } from '@/features/blog/types';
import { formatYearMonthLocal, localizedCount, readingTime } from '@/lib/utils';
import type { AppLocale } from '@/types';
import { ExternalLink, Eye, EyeOff, Pencil, Pin, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface BlogRowProps {
  post: IBlog;
  onEdit: (post: IBlog) => void;
  onDelete: (post: IBlog) => void;
  /** This record, and not another one, is busy. */
  deleting: boolean;
  togglingPublished: boolean;
  togglingHome: boolean;
  /** 1-based position on the home page, or 0 when the post is not picked. */
  homePosition: number;
  /** Every slot is taken by another post, so this one cannot be picked. */
  slotsFull: boolean;
  onToggleHome: (post: IBlog) => void;
  onTogglePublished: (post: IBlog) => void;
}

/**
 * Dashboard list item for a single post. It carries the same header, action cluster
 * and body rhythm as the project and product rows, so moving between the three
 * archives does not mean learning three layouts.
 */
const BlogRow = ({
  post,
  onEdit,
  onDelete,
  deleting,
  togglingPublished,
  togglingHome,
  homePosition,
  slotsFull,
  onToggleHome,
  onTogglePublished,
}: BlogRowProps) => {
  const t = useTranslations('dashboard.blog');
  const td = useTranslations('dashboard');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const draft = post.published === false;
  const featured = !draft && post.featured === true;
  const tags = post.tags ?? [];
  // The admin endpoint returns full documents, so the estimate is derived here.
  const minutes = readingTime(post.content);

  // A dead control is worse than no control: say why it is unavailable.
  const homeBlock = draft ? t('featuredNeedsPublish') : slotsFull && !featured ? t('featuredFull') : undefined;

  return (
    <EntityCard
      title={post.title}
      meta={
        <>
          <bdi dir="ltr">/{post.slug}</bdi>
          <Dot className="mx-1.5" />
          <span className="tabular-nums">{formatYearMonthLocal(post.createdAt, lang)}</span>
          {minutes > 0 && (
            <>
              <Dot className="mx-1.5" />
              <span className="tabular-nums">{t('readingTime', { minutes: localizedCount(minutes, lang) })}</span>
            </>
          )}
        </>
      }
      actions={
        <>
          <RowAction
            label={featured ? t('removeFromHome') : t('addToHome')}
            icon={Pin}
            iconClassName={featured ? 'fill-current' : undefined}
            pressed={featured}
            blockedReason={homeBlock}
            pending={togglingHome}
            onClick={() => onToggleHome(post)}
          />
          <RowAction
            label={draft ? t('publish') : t('unpublish')}
            icon={draft ? Eye : EyeOff}
            pressed={!draft}
            pending={togglingPublished}
            onClick={() => onTogglePublished(post)}
          />
          {!draft && <RowAction label={t('openPost')} icon={ExternalLink} href={`/${locale}/blog/${post.slug}`} />}
          <RowAction label={t('edit')} icon={Pencil} onClick={() => onEdit(post)} />
          <RowAction label={td('delete')} icon={Trash2} danger pending={deleting} onClick={() => onDelete(post)} />
        </>
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        {post.image && <EntityThumb src={post.image} alt={post.title} className="aspect-video w-full sm:aspect-auto sm:h-20 sm:w-32" />}

        <div className="min-w-0 flex-1 space-y-3">
          {post.summary && <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{post.summary}</p>}

          {tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {tags.map((tag, index) => (
                <li key={`${tag}-${index}`}>
                  <TagChip>{tag}</TagChip>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <StatusChip solid={!draft}>{draft ? t('draft') : t('published')}</StatusChip>
            {featured && <HomeSlotChip label={t('featuredBadge')} position={homePosition} lang={lang} />}
          </div>
        </div>
      </div>
    </EntityCard>
  );
};

export default BlogRow;
