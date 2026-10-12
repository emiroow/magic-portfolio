'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';

/**
 * Placeholders that hold the shape of what they stand in for.
 *
 * A skeleton the wrong height is worse than a spinner: the list lands, the page jumps,
 * and whatever the owner was about to click moves out from under the pointer. So this
 * mirrors `EntityCard` block for block, and each section says which of the optional
 * blocks — a leading mark, a thumbnail, a body — its rows actually have.
 */

interface CardListSkeletonProps {
  rows?: number;
  /** Leading mark in the header: an icon tile or a monogram. */
  mark?: boolean;
  /** Thumbnail gutter in the body. */
  media?: boolean;
  /** Body under the header. Switch off for rows that are only a title and its meta. */
  body?: boolean;
  /** Width of the action cluster, so the header does not reflow when the rows land. */
  actions?: number;
}

/** Stands in for a list of `EntityCard` rows. */
export function CardListSkeleton({ rows = 3, mark = false, media = true, body = true, actions = 4 }: CardListSkeletonProps) {
  const t = useTranslations('dashboard');

  return (
    <div className="space-y-3" aria-busy="true" aria-label={t('loading')}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4 sm:p-5">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              {mark && <Skeleton className="size-9 shrink-0 rounded-lg" />}
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/5 max-w-52" />
                <Skeleton className="h-3 w-1/4 max-w-32" />
              </div>
            </div>
            {actions > 0 && (
              <div className="flex shrink-0 gap-1">
                {Array.from({ length: actions }).map((__, slot) => (
                  <Skeleton key={slot} className="size-9 rounded-full" />
                ))}
              </div>
            )}
          </div>

          {body && (
            <div className="flex flex-col gap-4 px-4 pb-4 sm:flex-row sm:px-5 sm:pb-5">
              {media && <Skeleton className="h-20 w-full shrink-0 rounded-lg sm:w-32" />}
              <div className="min-w-0 flex-1 space-y-2.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <div className="flex gap-1.5 pt-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Stands in for a bare form: an optional round mark, a column of controls, a body. */
export function FormSkeleton({ fields = 6, mark = false }: { fields?: number; mark?: boolean }) {
  const t = useTranslations('dashboard');

  return (
    <div className="space-y-5" aria-busy="true" aria-label={t('loading')}>
      {mark && (
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="size-24 shrink-0 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <Skeleton className="h-9 w-28 rounded-full" />
    </div>
  );
}
