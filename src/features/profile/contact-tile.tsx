import { eyebrowClass } from '@/components/section-header';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * Shared surface for every contact entry (email, phone, social) so the grid
 * reads as one family. Interactive elements apply this class themselves; the
 * content component only fills them.
 */
export const contactTileClass =
  'group flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-start shadow-sm transition-colors hover:border-foreground/40 sm:gap-4 sm:p-5';

interface ContactTileContentProps {
  /** Leading mark, rendered inside the inverting icon well. */
  icon: ReactNode;
  /** Platform or channel name. */
  label: string;
  /** Address, handle or number — always shown as an LTR run. */
  value: string;
  /** Trailing affordance (arrow, copy state). */
  trailing?: ReactNode;
  className?: string;
}

/** Icon well + label/value pair + trailing affordance. */
export function ContactTileContent({ icon, label, value, trailing, className }: ContactTileContentProps) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background transition-colors group-hover:border-foreground group-hover:bg-foreground group-hover:text-background',
          className
        )}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className={cn(eyebrowClass, 'block truncate')}>{label}</span>
        {/*
         * The value is an LTR run inside a possibly RTL box: making it an
         * inline-block with its own truncation keeps the ellipsis on the end
         * of the Latin text instead of biting off its first characters.
         */}
        <span className="mt-1 block text-start text-sm font-medium">
          <bdi dir="ltr" className="inline-block max-w-full truncate align-bottom">
            {value}
          </bdi>
        </span>
      </span>

      {trailing && (
        <span aria-hidden className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">
          {trailing}
        </span>
      )}
    </>
  );
}
