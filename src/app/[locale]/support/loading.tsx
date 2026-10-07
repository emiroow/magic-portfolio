import { Skeleton } from '@/components/ui/skeleton';
import { getLocale, getTranslations } from 'next-intl/server';

/** One method row, shaped like the row it stands in for so nothing jumps when it fills. */
function RowSkeleton() {
  return (
    <div className="space-y-3.5 rounded-xl border p-5">
      <div className="flex items-start gap-3.5">
        <Skeleton className="size-9 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
    </div>
  );
}

/** Support skeleton: the header, the two-column shell (door, rails, claims) and the wall. */
export default async function SupportLoading() {
  const locale = await getLocale();
  const t = await getTranslations({ locale });

  return (
    <div className="space-y-10" aria-busy="true" aria-label={t('loading')}>
      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-px w-full" />
      </div>

      <div className="grid max-w-2xl grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-[minmax(0,1fr)_17rem] lg:grid-rows-[auto_1fr] lg:gap-x-8">
        {/* The “your own amount” door: the rail's head on a wide screen, first on a narrow one. */}
        <div className="flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:gap-6 lg:flex-col lg:items-stretch lg:gap-4 lg:p-5 lg:col-start-2 lg:row-start-1">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-full sm:w-44 lg:w-full" />
        </div>

        <div className="space-y-7 lg:col-start-1 lg:row-start-1 lg:row-span-2">
          <div className="space-y-3">
            <RowSkeleton />
            <RowSkeleton />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-px flex-1" />
              </div>
              <Skeleton className="h-3 w-full max-w-md" />
            </div>
            <RowSkeleton />
          </div>
        </div>

        {/* The rail's claims: the figures, then the promises under them. */}
        <div className="lg:col-start-2 lg:row-start-2">
          <div className="space-y-4 rounded-xl border bg-card p-5">
            <div className="flex gap-8">
              <div className="space-y-2">
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-3 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-px flex-1" />
          </div>
          <Skeleton className="h-3 w-full max-w-md" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
