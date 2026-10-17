import { Skeleton } from '@/components/ui/skeleton';
import { getLocale, getTranslations } from 'next-intl/server';

/**
 * Résumé skeleton: the control bar and one sheet filling with a header band over two
 * columns. It mirrors the document's own shape rather than a generic page, because the
 * wait here is a composed document and the reader should see that much straight away.
 */
export default async function ResumeLoading() {
  const locale = await getLocale();
  const t = await getTranslations({ locale });

  return (
    <div className="min-h-screen bg-muted/20 pb-16" aria-busy="true" aria-label={t('loading')}>
      <div className="flex flex-wrap items-center gap-3 border-b bg-background/85 px-4 py-2.5 backdrop-blur sm:px-5">
        <Skeleton className="h-4 w-28" />
        {/* The bar's three tiers, at the heights the real controls take, so the swap costs
            no shift: the outlined cluster, the quiet way back, and the filled way out. */}
        <div className="ms-auto flex items-center gap-2">
          <Skeleton className="h-10 w-[108px] rounded-full sm:h-9" />
          <Skeleton className="h-10 w-20 rounded-full sm:h-9" />
          <Skeleton className="h-10 w-24 rounded-full bg-primary/15 sm:h-9" />
        </div>
      </div>

      <div className="mx-auto mt-7 w-full max-w-[640px] space-y-7 rounded-xl border bg-background p-6 shadow-sm sm:p-10">
        <div className="space-y-3">
          <Skeleton className="h-9 w-60" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {[0, 1].map(column => (
            <div key={column} className="space-y-5">
              {[0, 1, 2].map(block => (
                <div key={block} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
