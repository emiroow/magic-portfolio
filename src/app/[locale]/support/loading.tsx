import { Skeleton } from '@/components/ui/skeleton';
import { getLocale, getTranslations } from 'next-intl/server';

/** Support skeleton: page header, the numbers band, the option grid and the wall. */
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

      <div className="flex flex-wrap gap-6 border-y py-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-5 w-28" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border">
            <div className="flex items-start justify-between gap-3 border-b px-4 py-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3.5 w-16" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-3 p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex items-center justify-between gap-2 border-t pt-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-full max-w-lg" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
