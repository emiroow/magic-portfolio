import { Skeleton } from '@/components/ui/skeleton';
import { getLocale, getTranslations } from 'next-intl/server';

/** Home skeleton mirroring the real section rhythm, so nothing jumps on load. */
export default async function HomeLoading() {
  const locale = await getLocale();
  const t = await getTranslations({ locale });

  return (
    <main className="flex min-h-[100dvh] flex-col gap-12 sm:gap-16" aria-busy="true" aria-label={t('loading')}>
      {/* Hero */}
      <div className="flex flex-col-reverse items-start gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="w-full flex-1 space-y-3.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-2/3 sm:h-9" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-4/5 max-w-md" />
          <Skeleton className="h-8 w-36 rounded-full" />
        </div>
        <Skeleton className="size-20 shrink-0 rounded-full sm:size-24" />
      </div>

      {/* Header + divided rows (experience / education) */}
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-px w-full" />
          </div>
          <div className="overflow-hidden rounded-xl border">
            <div className="divide-y divide-border">
              <Skeleton className="h-[76px] w-full rounded-none" />
              <Skeleton className="h-[76px] w-full rounded-none" />
              <Skeleton className="h-[76px] w-full rounded-none" />
            </div>
          </div>
        </div>
      ))}

      {/* Header + project cards */}
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-px w-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-xl border">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="space-y-3 p-4 sm:p-5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <div className="flex gap-1.5 pt-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
