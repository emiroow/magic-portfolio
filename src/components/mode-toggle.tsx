'use client';

import { Button } from '@/components/ui/button';
import { withThemeReveal } from '@/lib/theme-reveal';
import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { ComponentPropsWithoutRef } from 'react';

type ModeToggleProps = Omit<ComponentPropsWithoutRef<typeof Button>, 'variant' | 'size' | 'type'>;

/**
 * Light/dark switch. Both marks live in the DOM and are swapped by the `.dark`
 * class, so there is no transition, no layout shift and no hydration flash.
 *
 * The theme itself is still `next-themes`' business alone: this only hands the
 * press to the reveal, so the circle grows from the button that was actually
 * clicked and the switch falls back to a plain one wherever the API is missing.
 *
 * `onClick` is composed rather than overridden: Radix's tooltip trigger (used
 * by the navigation bar) injects its own click handler through `asChild`, and
 * dropping either one breaks the toggle or leaves the tooltip stuck open.
 */
export function ModeToggle({ className, onClick, ...props }: ModeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      type="button"
      size="icon"
      aria-label="Toggle theme"
      {...props}
      className={cn(className)}
      onClick={event => {
        onClick?.(event);
        if (event.defaultPrevented) return;

        const next = resolvedTheme === 'dark' ? 'light' : 'dark';
        withThemeReveal({ event, next, change: () => setTheme(next) });
      }}
    >
      <Sun className="size-[1.1rem] dark:hidden" aria-hidden />
      <Moon className="hidden size-[1.1rem] dark:block" aria-hidden />
    </Button>
  );
}
