import { getSectionAvailability } from '@/features/portfolio/queries';
import { routing } from '@/i18n/routing';
import MainProvider from '@/providers/mainProvider';
import { SectionAvailabilityProvider } from '@/providers/sectionAvailability';
import { notFound } from 'next/navigation';

/**
 * Locale layout: validates `[locale]` and applies direction on a wrapper (updates
 * correctly on client-side locale switches, unlike `<html dir>`).
 *
 * The face itself lives on `<html>` — see `appProviders` — because dialogs and
 * other portals mount on `<body>`, outside this wrapper.
 *
 * It also settles which archives hold content, once, for the whole tree below: the dock
 * appears on every page of the locale, and an empty section has to be missing from all of
 * them or none. Admin writes revalidate this layout, so the first saved record brings its
 * archive back into the navigation without a redeploy.
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
  const availability = await getSectionAvailability(locale === 'fa' ? 'fa' : 'en');

  return (
    <div dir={direction} className="relative min-h-screen text-foreground antialiased">
      <SectionAvailabilityProvider value={availability}>
        <MainProvider locale={locale}>{children}</MainProvider>
      </SectionAvailabilityProvider>
    </div>
  );
}
