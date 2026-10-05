import BlurFade from '@/components/magicui/blur-fade';
import { eyebrowClass } from '@/components/section-header';
import { Button } from '@/components/ui/button';
import { Compass, Home } from 'lucide-react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'NotFoundPage' });

  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, follow: false },
  };
}

/** Minimal monochrome 404 page shared by localized and unknown routes. */
export default async function NotFoundPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'NotFoundPage' });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-16 text-center">
      <BlurFade>
        <p className={eyebrowClass}>{t('eyebrow')}</p>
      </BlurFade>
      <BlurFade delay={0.08}>
        <h1 className="mt-3 text-3xl font-bold leading-tight ltr:tracking-tight sm:text-4xl">{t('title')}</h1>
      </BlurFade>
      <BlurFade delay={0.16}>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">{t('description')}</p>
      </BlurFade>
      <BlurFade delay={0.24}>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link href={`/${locale}`}>
              <Home className="me-2 size-4" aria-hidden />
              {t('goHome')}
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/${locale}/blog`}>
              <Compass className="me-2 size-4" aria-hidden />
              {t('browse')}
            </Link>
          </Button>
        </div>
      </BlurFade>
    </main>
  );
}
