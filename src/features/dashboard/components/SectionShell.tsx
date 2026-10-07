'use client';

import { cn } from '@/lib/utils';
import type { ReactNode, Ref } from 'react';

interface SectionShellProps {
  title: string;
  /** One quiet sentence saying what the section holds. */
  description?: string;
  /** Trailing control, hidden by the caller while its form panel is open. */
  action?: ReactNode;
  /** Marks the section so an opened panel can scroll it back into view. */
  anchorRef?: Ref<HTMLElement>;
  className?: string;
  children: ReactNode;
}

/**
 * The frame every dashboard section wears: heading row, trailing action, hairline,
 * content. One rhythm for all nine sections is what makes the switcher feel like
 * one surface rather than nine pages that happen to share a URL.
 */
export function SectionShell({ title, description, action, anchorRef, className, children }: SectionShellProps) {
  return (
    <section ref={anchorRef} className={cn('scroll-mt-6 mb-14', className)}>
      <div className="mt-8 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight ltr:tracking-tight sm:text-xl">{title}</h2>
          {description && <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      <div aria-hidden className="rule-fade mt-4" />
      <div className="mt-6">{children}</div>
    </section>
  );
}
