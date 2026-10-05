import { cn } from '@/lib/utils';
import { nameDir } from '@/components/support/support-meta';
import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * The three surfaces every support item is built from — on the page, inside the
 * wizard and on the supporters wall — so one method card, one payment tile and one
 * supporter card are visibly the same object at three sizes.
 */

/** Framed icon. The only illustration a support item gets; colour would break the monochrome palette. */
export function IconTile({ icon: Icon, className, size = 'md' }: { icon: LucideIcon; className?: string; size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground',
        size === 'sm' ? 'size-7' : 'size-9',
        className
      )}
    >
      <Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} />
    </span>
  );
}

/** Small trailing label: a currency, a market, a count. */
export function Tag({ children, className, dir }: { children: ReactNode; className?: string; dir?: 'ltr' | 'rtl' | 'auto' }) {
  return (
    <span dir={dir ?? 'auto'} className={cn('inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] leading-tight text-muted-foreground', className)}>
      {children}
    </span>
  );
}

interface ChoiceTileProps {
  /** Name of the radio group this tile belongs to. */
  group: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  /** Quiet second line: what it holds, priced in which unit, for which market. */
  detail?: ReactNode;
  icon?: LucideIcon;
  /** Monogram instead of an icon, for a supporter's own card. */
  monogram?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * One selectable item, drawn the same way wherever it appears.
 *
 * A real radio under a styled surface: the arrow keys, the group semantics and the
 * focus ring come from the browser instead of a hand-written key handler, and the
 * layout needs no direction checks because every offset is logical.
 *
 * Nothing is clipped and nothing is stacked at the trailing edge: a destination has
 * to stay readable, because picking the wrong one sends money to the wrong place.
 */
export function ChoiceTile({ group, value, checked, onChange, label, detail, icon: Icon, monogram, disabled, className }: ChoiceTileProps) {
  return (
    <label
      className={cn(
        'relative block cursor-pointer rounded-lg border transition-colors',
        checked ? 'border-foreground bg-muted/40' : 'border-input bg-background hover:border-foreground/40 hover:bg-muted/20',
        disabled && 'cursor-not-allowed opacity-60 hover:border-input hover:bg-background',
        className
      )}
    >
      <input type="radio" name={group} value={value} checked={checked} disabled={disabled} onChange={() => onChange(value)} className="peer sr-only" />
      <span className="flex min-h-12 items-center gap-2.5 rounded-lg px-3 py-2.5 peer-focus-visible:ring-2 peer-focus-visible:ring-ring/50">
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
        {monogram && (
          <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-bold text-muted-foreground">
            {monogram}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          {/* The run keeps its own direction, the tile keeps the page's: a Latin host or
              name still lines up with the reading edge instead of drifting across it. */}
          <span className="break-words text-sm font-medium leading-snug">
            <bdi dir={nameDir(label)}>{label}</bdi>
          </span>
          {detail && (
            <span className="break-words text-[11px] leading-snug text-muted-foreground">
              <bdi dir="auto">{detail}</bdi>
            </span>
          )}
        </span>
        {/* The mark is drawn, not CSS-derived: a native radio already carries the state. */}
        {checked && <Check className="size-4 shrink-0" aria-hidden />}
      </span>
    </label>
  );
}
