'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { estedad, roboto } from '@/lib/fonts';
import { queryClient } from '@/lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider, useLocale, type Messages } from 'next-intl';
import { ThemeProvider, useTheme } from 'next-themes';
import { useEffect } from 'react';
import { Toaster } from 'sonner';

/** Fonts a locale can be rendered with, in the face the site reads with. */
const LOCALE_FONTS = { fa: estedad, en: roboto } as const;

/** The single client provider tree (session, theme, react-query, tooltips, toasts). */
export default function AppProviders({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: string;
  messages: Messages;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <HtmlTypography />
              {children}
              <ThemedToaster />
            </TooltipProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}

/** Sonner toaster that follows the active theme and text direction. */
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const locale = useLocale();

  return <Toaster theme={resolvedTheme as 'light' | 'dark' | undefined} dir={locale === 'fa' ? 'rtl' : 'ltr'} position="top-center" />;
}

/**
 * Keeps `<html lang/dir>` and the typeface in sync after a client-side locale
 * switch, which never re-renders the root layout.
 *
 * The face belongs on the root element and not on a content wrapper: dialogs,
 * toasts and dropdowns are portaled into `<body>`, i.e. outside every styled
 * wrapper, so a wrapper-level font leaves them reading with whichever locale
 * first rendered — Persian inside a Latin-only face.
 */
function HtmlTypography() {
  const locale = useLocale();
  const active = locale === 'fa' ? 'fa' : 'en';

  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir = active === 'fa' ? 'rtl' : 'ltr';

    // `next/font` hands back space-separated hashed class names, and
    // `classList.toggle` refuses a token with a space in it.
    (Object.keys(LOCALE_FONTS) as (keyof typeof LOCALE_FONTS)[]).forEach(key => {
      LOCALE_FONTS[key].className.split(' ').forEach(name => html.classList.toggle(name, key === active));
    });
  }, [locale, active]);

  return null;
}
