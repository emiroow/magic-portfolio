'use client';

import { NavbarMenu } from '@/components/navbar-menu';
import { buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DockRoutes, MenuRoutes } from '@/constants/global';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import { ModeToggle } from '@/components/mode-toggle';
import ThemeToggle from '@/components/locale-toggle';

/**
 * Dashboard control bar. Mirrors the public navbar shell exactly so the two
 * surfaces feel like one component; it only swaps socials for sign-out.
 */
const Footer = () => {
  const t = useTranslations('navbar');
  const td = useTranslations('dashboard');
  const locale = useLocale();
  const pathname = usePathname();

  const itemClass = (active = false) =>
    cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-9 sm:size-10', active && 'bg-accent text-accent-foreground');

  const divider = <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-border sm:mx-1" />;

  // The grouped archives share one trigger; it lights up when any is active.
  const menuActive = MenuRoutes.some(route => pathname.startsWith(route.href));

  return (
    <nav
      aria-label={td('title')}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto flex max-w-full items-center gap-0.5 rounded-full border bg-background/85 p-1 shadow-sm backdrop-blur-md sm:gap-1">
        {DockRoutes.map(({ href, icon: Icon, label: key }) => {
          const label = t(key);
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <Link href={href} aria-label={label} aria-current={active ? 'page' : undefined} className={itemClass(active)}>
                  <Icon className="size-4" aria-hidden />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        <NavbarMenu routes={MenuRoutes} active={menuActive} />

        {divider}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={async () => {
                // Stay on the current origin: NextAuth would otherwise
                // honor NEXTAUTH_URL for the post-signout redirect.
                await signOut({ redirect: false });
                window.location.href = `/${locale}`;
              }}
              className={itemClass()}
              aria-label={td('logout')}
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{td('logout')}</p>
          </TooltipContent>
        </Tooltip>

        {divider}

        <Tooltip>
          <TooltipTrigger asChild>
            <ThemeToggle className={itemClass()} aria-label={t('language')} />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{t('language')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ModeToggle className={itemClass()} aria-label={t('theme')} />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{t('theme')}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </nav>
  );
};

export default Footer;
