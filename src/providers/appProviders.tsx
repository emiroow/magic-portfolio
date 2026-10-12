'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { estedad, fontVariables, roboto } from '@/lib/fonts';
import { queryClient } from '@/lib/queryClient';
import RouteProgress from '@/providers/routeProgress';
import { MotionConfig } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider, useLocale, type Messages } from 'next-intl';
import { ThemeProvider, useTheme } from 'next-themes';
import { useEffect } from 'react';
import { Toaster } from 'sonner';

/** The face each locale reads with, keyed by locale. */
const LOCALE_FACES = { fa: estedad.className, en: roboto.className } as const;

/** `next/font` hands back space-separated hashed class names, and `classList` refuses an empty or spaced token. */
const classTokens = (value: string) => value.split(' ').filter(Boolean);

/** The single client provider tree (progress, session, theme, react-query, tooltips, toasts). */
export default function AppProviders({ children, locale, messages }: { children: React.ReactNode; locale: string; messages: Messages }) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      {/* Outside the session and the theme on purpose: the bar belongs to navigation, and
          it reads the locale only to know which way the page runs. */}
      <RouteProgress>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                {/* framer-motion writes transforms from JavaScript, so the CSS guard in
                    globals.css cannot reach it: reduced motion has to be honoured here. */}
                <MotionConfig reducedMotion="user">
                  <HtmlTypography />
                  {children}
                  <ThemedToaster />
                </MotionConfig>
              </TooltipProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </SessionProvider>
      </RouteProgress>
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
 *
 * Only the reading face is swapped. The variable classes go on once and stay, so
 * the face of the language that is *not* active remains reachable for the one
 * control that spells itself in that language (see `locale-toggle`).
 */
function HtmlTypography() {
  const locale = useLocale();
  const active = locale === 'fa' ? 'fa' : 'en';

  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir = active === 'fa' ? 'rtl' : 'ltr';

    // Only the reading face swaps; the variable classes are never removed.
    classTokens(fontVariables).forEach(name => html.classList.add(name));
    (Object.keys(LOCALE_FACES) as (keyof typeof LOCALE_FACES)[]).forEach(key => {
      classTokens(LOCALE_FACES[key]).forEach(name => html.classList.toggle(name, key === active));
    });
  }, [locale, active]);

  return null;
}
