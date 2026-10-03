'use client';

import { iconDecider } from '@/components/icons';
import { NavbarMenu } from '@/components/navbar-menu';
import { buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DockRoutes, MenuRoutes } from '@/constants/global';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import type { ISocial } from '@/types';
import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { ModeToggle } from './mode-toggle';
import ThemeToggle from './theme-toggle';

interface NavbarProps {
  socials?: ISocial[];
}

/** Socials beyond this count only appear from `sm` up, so the bar never clips. */
const MOBILE_SOCIALS = 2;
const MAX_SOCIALS = 5;

/**
 * Floating navigation bar: Home, a compact menu that groups the content
 * archives (products, projects, blog), social profiles, language switch and
 * theme switch. The bar itself stays static — no magnification or springs; only
 * the active route, hover states and the group menu's open/close ever move.
 */
const Navbar: FC<NavbarProps> = ({ socials = [] }) => {
  const t = useTranslations('navbar');
  const pathname = usePathname();
  const links = socials.filter(social => Boolean(social.url)).slice(0, MAX_SOCIALS);

  const socialLabel = (icon: string, name: string) => {
    const key = icon?.toLowerCase();
    // Fall back to the stored display name for unknown icons.
    return key && t.has(`social.${key}`) ? t(`social.${key}`) : name;
  };

  const itemClass = (active = false) =>
    cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-9 sm:size-10', active && 'bg-accent text-accent-foreground');

  const divider = <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-border sm:mx-1" />;

  // The grouped archives share one trigger; it lights up when any is active.
  const menuActive = MenuRoutes.some(route => pathname.startsWith(route.href));

  return (
    <nav
      aria-label={t('label')}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto flex max-w-full items-center gap-0.5 rounded-full border bg-background/85 p-1 shadow-sm backdrop-blur-md sm:gap-1">
        {DockRoutes.map(({ href, icon: Icon, label: key }) => {
          const label = t(key);
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  className={itemClass(active)}
                >
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

        {links.length > 0 && divider}

        {links.map((item, index) => {
          const label = socialLabel(item.icon, item.name);

          return (
            <Tooltip key={item._id ?? `${item.name}-${index}`}>
              <TooltipTrigger asChild>
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={cn(itemClass(), index >= MOBILE_SOCIALS && 'hidden sm:inline-flex')}
                >
                  {iconDecider(item.icon, 'size-4')}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

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

export default Navbar;
