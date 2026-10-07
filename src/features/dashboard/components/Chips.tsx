'use client';

import { Badge } from '@/components/ui/badge';
import { cn, localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { ReactNode } from 'react';

/**
 * The small marks a dashboard row carries.
 *
 * Two weights, no more: a quiet tag for what a record contains, and a pill for what
 * state it is in. Every card had been restating the same `text-[10px]` and the same
 * border overrides by hand, which is how three sections ended up with four slightly
 * different "published" badges.
 */

/** Hairline separator between segments of a meta line. */
export function Dot({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('text-muted-foreground/60', className)}>
      ·
    </span>
  );
}

/** Quiet tag: a technology, a feature, a post tag. */
export function TagChip({ children }: { children: ReactNode }) {
  return (
    <Badge variant="secondary" className="px-2 py-0 text-[10px] font-normal">
      {children}
    </Badge>
  );
}

/** State pill: published or hidden, in stock or sold out, a warning. */
export function StatusChip({ solid, alert, children }: { solid?: boolean; alert?: boolean; children: ReactNode }) {
  return (
    <Badge variant={solid ? 'default' : 'outline'} className={cn('text-[10px]', alert && 'border-destructive/40 text-destructive')}>
      {children}
    </Badge>
  );
}

/** The home-page pick, with the slot number the record actually occupies. */
export function HomeSlotChip({ label, position, lang }: { label: string; position: number; lang: AppLocale }) {
  return (
    <StatusChip>
      {label}
      {position > 0 && (
        <>
          <Dot className="mx-0.5" />
          <span className="tabular-nums text-muted-foreground">{localizedCount(position, lang)}</span>
        </>
      )}
    </StatusChip>
  );
}
