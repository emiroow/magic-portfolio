import type { ReactNode } from 'react';

/**
 * Dashed placeholder shared by every public listing, so an empty archive and
 * an empty search result read as the same component.
 */
export function EmptyPanel({ icon, text, actionLabel, onAction }: { icon: ReactNode; text: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full border" aria-hidden>
        {icon}
      </span>
      <p className="px-6 text-sm text-muted-foreground">{text}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-medium text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
