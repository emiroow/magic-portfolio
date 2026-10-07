'use client';

import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** Section glyph, so an empty archive says what is missing before it is read. */
  icon?: LucideIcon;
  text: string;
  actionText?: string;
  onAction?: () => void;
  /** Extra line under the action, e.g. why the list is empty. */
  footer?: ReactNode;
}

/** Dashed placeholder shown when a section holds nothing, or nothing matches. */
export function EmptyState({ icon: Icon, text, actionText, onAction, footer }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-14 text-center">
      {Icon && (
        <span aria-hidden className="flex size-11 items-center justify-center rounded-full border text-muted-foreground">
          <Icon className="size-4" />
        </span>
      )}
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{text}</p>
      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="rounded-full">
          {actionText}
        </Button>
      )}
      {footer}
    </div>
  );
}
