import { Skeleton } from '@/components/ui/skeleton';
import { getLocale, getTranslations } from 'next-intl/server';

/** Blog skeleton: page header, search field and divided post rows. */
export default async function BlogLoading() {
  const locale = await getLocale();
  const t = await getTranslations({ locale });

  return (
    <div className="space-y-7" aria-busy="true" aria-label={t('loading')}>
      <div className="space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-px w-full" />
      </div>

      {/* Toolbar: search field + tag chips */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-9 w-full rounded-lg sm:max-w-xs" />
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Featured card */}
      <div className="grid overflow-hidden rounded-xl border sm:grid-cols-2">
        <Skeleton className="aspect-[16/9] w-full rounded-none" />
        <div className="space-y-3 p-5 sm:p-6">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-start gap-4 p-4 sm:px-5 sm:py-5">
              <Skeleton className="size-14 shrink-0 rounded-lg sm:size-20" />
              <div className="grow space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
