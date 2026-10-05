import { routing } from '@/i18n/routing';
import MainProvider from '@/providers/mainProvider';
import { notFound } from 'next/navigation';

/**
 * Locale layout: validates `[locale]` and applies direction on a wrapper (updates
 * correctly on client-side locale switches, unlike `<html dir>`).
 *
 * The face itself lives on `<html>` — see `appProviders` — because dialogs and
 * other portals mount on `<body>`, outside this wrapper.
 */
export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const direction = locale === 'fa' ? 'rtl' : 'ltr';

  return (
    <div dir={direction} className="relative min-h-screen text-foreground antialiased">
      <MainProvider locale={locale}>{children}</MainProvider>
    </div>
  );
}
