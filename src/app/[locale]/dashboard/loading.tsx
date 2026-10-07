import { Skeleton } from '@/components/ui/skeleton';
import { getLocale, getTranslations } from 'next-intl/server';

/** The nine sections, in the order the switcher lists them. */
const TAB_WIDTHS = ['w-16', 'w-24', 'w-20', 'w-14', 'w-20', 'w-20', 'w-16', 'w-14', 'w-20'];

/**
 * Dashboard skeleton: page header, the section switcher and the first section.
 *
 * The layout awaits the admin session before it can render anything, so this is what
 * stands in for a cold visit. It holds the same widths the real chrome does, which is
 * what keeps the switcher from jumping when the session resolves.
 */
export default async function DashboardLoading() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  return (
    <main className="w-full" aria-busy="true" aria-label={t('loading')}>
      <div className="mb-7 space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-px w-full" />
      </div>

      <div className="flex w-full gap-1 overflow-hidden rounded-full border bg-muted/40 p-1 sm:w-max sm:max-w-full">
        {TAB_WIDTHS.map((width, index) => (
          <Skeleton key={index} className={`h-7 shrink-0 ${width} rounded-full`} />
        ))}
      </div>

      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="size-9 rounded-full" />
        </div>
        <Skeleton className="h-px w-full" />

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/5 max-w-52" />
                  <Skeleton className="h-3 w-1/4 max-w-32" />
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 4 }).map((__, slot) => (
                    <Skeleton key={slot} className="size-9 rounded-full" />
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-20 w-32 shrink-0 rounded-lg max-sm:hidden" />
                <div className="min-w-0 flex-1 space-y-2.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <div className="flex gap-1.5 pt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
