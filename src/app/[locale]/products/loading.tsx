import { Skeleton } from '@/components/ui/skeleton';
import { getLocale, getTranslations } from 'next-intl/server';

/** Products skeleton: page header, toolbar, sort row and the card grid. */
export default async function ProductsLoading() {
  const locale = await getLocale();
  const t = await getTranslations({ locale });

  return (
    <div className="space-y-7" aria-busy="true" aria-label={t('loading')}>
      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-px w-full" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-full rounded-lg sm:max-w-xs" />
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-3 p-4 sm:p-5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex items-center justify-between gap-2 border-t pt-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
