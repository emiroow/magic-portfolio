'use client';

import { buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { NavbarRoute } from '@/constants/global';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { PanelBottomOpen, PanelTopOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';

interface NavbarMenuProps {
  routes: readonly NavbarRoute[];
  /** True when the active route lives inside this menu, so the trigger lights up. */
  active: boolean;
}

/**
 * Compact dropdown that groups the content archives (products, projects, blog)
 * behind one trigger, so the floating dock stays narrow. It opens upward as a
 * vertical capsule of the dock's own controls: the same rounded-full pill, the
 * same translucent blurred surface, and the same icon-only ghost buttons with
 * tooltips — no text labels, exactly like the navbar items.
 *
 * Hand-rolled rather than pulled from a menu library to keep the dock free of
 * extra client JavaScript. It toggles on click and closes on Escape or any
 * outside pointer-down; the items are plain localized links, so Tab reaches them
 * the same way it reaches the dock's own buttons.
 */
export function NavbarMenu({ routes, active }: NavbarMenuProps) {
  const t = useTranslations('navbar');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  // The dock is rendered per page, so a route change remounts it and the menu
  // closes on its own; the item click handler below covers same-page picks.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const closeAndRefocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={t('menu')}
        onClick={() => setOpen(value => !value)}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'size-9 sm:size-10',
          (active || open) && 'bg-accent text-accent-foreground'
        )}
      >
        {open ? <PanelTopOpen className="size-4" /> : <PanelBottomOpen className="size-4" />}
      </button>

      {open && (
        // Centering lives on this wrapper; the slide/scale animation lives on the
        // pill itself, so it rises straight up instead of on a diagonal.
        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2">
          <div
            id={listId}
            role="group"
            aria-label={t('menu')}
            className="flex animate-in origin-bottom flex-col items-center gap-0.5 rounded-full border bg-background/85 p-1 shadow-sm backdrop-blur-md duration-200 fade-in-0 slide-in-from-bottom-4 zoom-in-95 sm:gap-1"
          >
            {routes.map(route => {
              const label = t(route.label);
              const itemActive = pathname.startsWith(route.href);
              const Icon = route.icon;

              return (
                <Tooltip key={route.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={route.href}
                      aria-current={itemActive ? 'page' : undefined}
                      onClick={closeAndRefocus}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                        'size-9 sm:size-10',
                        itemActive && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
