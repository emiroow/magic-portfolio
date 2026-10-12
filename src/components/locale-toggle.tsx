'use client';

import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import React from 'react';

type LanguageToggleProps = Omit<React.ComponentPropsWithoutRef<typeof Link>, 'href'>;

/**
 * Switches to the same page in the other locale, preserving the current path.
 * The button is labelled in the language it leads to (`فا` / `EN`), which is
 * readable even for visitors who cannot read the current UI language.
 * (Named `ThemeToggle` historically; it controls language.)
 *
 * The label carries the face of the language it is written in, not of the page:
 * Roboto ships Latin only, so a Persian `فا` left on the English face would drop
 * to a crushed system fallback and come out unreadable on the navbar's switch.
 */
const ThemeToggle = React.forwardRef<HTMLAnchorElement, LanguageToggleProps>(({ className, ...props }, ref) => {
  const { locale } = useParams<{ locale: string }>();
  const pathname = usePathname();
  const targetLocale = locale === 'fa' ? 'en' : 'fa';

  // Strip the current locale prefix so the target Link re-adds its own.
  const pathWithoutLocale = pathname.replace(/^\/(fa|en)/, '');
  const href = pathWithoutLocale === '' ? '/' : pathWithoutLocale;

  return (
    <Link
      ref={ref}
      href={href}
      locale={targetLocale}
      className={cn('inline-flex items-center justify-center', className)}
      aria-label={`Switch to ${targetLocale.toUpperCase()}`}
      {...props}
    >
      <span aria-hidden className={cn('text-xs font-semibold leading-none', targetLocale === 'fa' ? 'font-fa' : 'font-en')}>
        {targetLocale === 'fa' ? 'فا' : 'EN'}
      </span>
    </Link>
  );
});

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;
