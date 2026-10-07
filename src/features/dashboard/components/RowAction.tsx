'use client';

import Loading from '@/components/ui/loading';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface RowActionProps {
  /** Accessible name, and the hover title when nothing more specific is given. */
  label: string;
  /** Longer hover explanation, where the label alone does not say what the control does. */
  hint?: string;
  icon?: LucideIcon;
  /** Extra classes on the glyph, e.g. `fill-current` for a pinned state. */
  iconClassName?: string;
  onClick?: () => void;
  /** Renders an anchor that opens in a new tab instead of a button. */
  href?: string;
  /** Tints the hover red; reserved for the one destructive action in a cluster. */
  danger?: boolean;
  /** Replaces the glyph with a spinner and refuses a second press. */
  pending?: boolean;
  /** Carries an on/off state for assistive technology. */
  pressed?: boolean;
  /** Dims the control while its state is off. */
  muted?: boolean;
  disabled?: boolean;
  /** Why the control is unavailable. A dead button that cannot explain itself reads as a bug. */
  blockedReason?: string;
}

/**
 * One control in a row's action cluster.
 *
 * Every cluster in the dashboard is built from this, so an owner learns the grammar
 * once: the same 36px round target, the same hover, the same pencil for edit and the
 * same bin for delete in all nine sections. `blockedReason` is what keeps a disabled
 * control honest — it says why in the tooltip instead of leaving the owner to guess.
 */
export function RowAction({
  label,
  hint,
  icon: Icon,
  iconClassName,
  onClick,
  href,
  danger,
  pending,
  pressed,
  muted,
  disabled,
  blockedReason,
}: RowActionProps) {
  const className = cn(danger && 'hover:text-destructive', muted && 'text-muted-foreground');
  const glyph = pending ? <Loading size="sm" /> : Icon ? <Icon className={cn('size-4', iconClassName)} aria-hidden /> : null;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), className)}
      >
        {glyph}
      </a>
    );
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={className}
      onClick={onClick}
      disabled={disabled || pending || Boolean(blockedReason)}
      aria-pressed={pressed}
      aria-label={label}
      title={blockedReason || hint || label}
    >
      {glyph}
    </Button>
  );
}
