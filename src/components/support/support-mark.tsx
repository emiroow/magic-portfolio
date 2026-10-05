import { cn } from '@/lib/utils';

/**
 * The support section's own mark: a heart held in an open cradle, drawn with
 * `currentColor` so it stays inside the monochrome palette in both themes.
 *
 * Support is the point of the section, so the mark says "backing the work"
 * rather than naming one particular way of doing it.
 */
export function SupportMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('size-10', className)}
    >
      {/* The heart, sitting in what holds it up */}
      <path d="M24 31.5 22.1 29.7c-4.4-3.9-7.4-6.5-7.4-9.8 0-2.7 2.1-4.7 4.7-4.7 1.5 0 3 .7 4 2 1-1.3 2.5-2 4-2 2.6 0 4.7 2 4.7 4.7 0 3.3-3 5.9-7.4 9.8z" />
      <path d="M9 26.5c0 8.3 6.7 15 15 15s15-6.7 15-15" />
      <path d="M9 26.5v-4.5M39 26.5v-4.5" opacity={0.55} />
    </svg>
  );
}
