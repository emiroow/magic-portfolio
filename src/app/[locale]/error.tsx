'use client'; // Error boundaries must be Client Components

import { eyebrowClass } from '@/components/section-header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Locale-level error boundary: catches render/data failures for every
 * page under `/{locale}` and offers retry + home actions.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('ErrorPage');
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || 'en';

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center px-5 py-16 text-center">
      <span aria-hidden className="flex size-12 items-center justify-center rounded-full border">
        <AlertTriangle className="size-5 text-muted-foreground" />
      </span>
      <p className={cn(eyebrowClass, 'mt-5')}>{t('eyebrow')}</p>
      <h1 className="mt-3 text-2xl font-bold leading-tight ltr:tracking-tight sm:text-3xl">{t('title')}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">{t('description')}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" onClick={reset} className="rounded-full">
          <RotateCw className="me-2 size-4" aria-hidden />
          {t('tryAgain')}
        </Button>
        <Button asChild className="rounded-full">
          <a href={`/${locale}`}>{t('goHome')}</a>
        </Button>
      </div>
    </main>
  );
}
