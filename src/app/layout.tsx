import { getProfile } from '@/features/profile/queries';
import { estedad, fontVariables, roboto } from '@/lib/fonts';
import { brandedTitle, site, SITE_DESCRIPTION } from '@/lib/seo';
import '@/app/globals.css';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { getLocale } from 'next-intl/server';
import GoogleAnalytics from '@/app/analytics';

/** Root metadata: brand comes from the profile (never env); sub-pages inherit `%s | Brand`. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const lang = locale === 'fa' ? 'fa' : 'en';

  // Localized profile first; fall back to the other locale (never env).
  const profile = (await getProfile(lang)) ?? (await getProfile(lang === 'fa' ? 'en' : 'fa'));
  const brand = brandedTitle(profile, lang);

  return {
    metadataBase: site ? new URL(site) : undefined,
    title: {
      default: brand,
      // Sub-pages render as `Page | Name | Job Title | <suffix>`.
      template: `%s | ${brand}`,
    },
    description: profile?.summary || profile?.description || SITE_DESCRIPTION[lang],
    applicationName: brand,
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Use the active locale to set correct html lang, direction and font.
  const locale = await getLocale();
  const dir = locale === 'fa' ? 'rtl' : 'ltr';
  const face = locale === 'fa' ? estedad : roboto;

  return (
    <html lang={locale} dir={dir} data-scroll-behavior="smooth" className={`${face.className} ${fontVariables}`} suppressHydrationWarning>
      <body className="relative bg-background text-foreground antialiased">
        {/* Static hairline grid backdrop; content is layered above it. */}
        <div aria-hidden className="surface-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-64" />
        {children}
        <GoogleAnalytics />
        {/* Only Vercel serves the insights script, and only in a production build;
            elsewhere the include just fails a request on every navigation. `VERCEL_ENV`
            is the build host speaking — the same gate `robots` already reads. */}
        {process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV && <Analytics />}
      </body>
    </html>
  );
}
