import { cn } from '@/lib/utils';

/**
 * The support section's own mark: a cup with three lines of steam, drawn with
 * `currentColor` so it stays inside the monochrome palette in both themes.
 *
 * The steam breathes with Tailwind's built-in pulse and staggered delays — no
 * animation runtime is shipped, and `prefers-reduced-motion` already freezes it
 * globally in `globals.css`.
 */
export function CoffeeMark({ className, steam = true }: { className?: string; steam?: boolean }) {
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
      {/* Steam */}
      <g className={steam ? 'animate-pulse' : undefined} opacity={0.55}>
        <path d="M17 6c-1.6 2.4-1.6 4.6 0 7" style={steam ? { animationDelay: '0ms' } : undefined} />
        <path d="M24 4c-1.6 2.4-1.6 4.6 0 7" style={steam ? { animationDelay: '320ms' } : undefined} />
        <path d="M31 6c-1.6 2.4-1.6 4.6 0 7" style={steam ? { animationDelay: '640ms' } : undefined} />
      </g>

      {/* Cup, handle and saucer */}
      <path d="M11 17h22v9a9 9 0 0 1-9 9h-4a9 9 0 0 1-9-9z" />
      <path d="M33 20h2.5a3.5 3.5 0 0 1 0 7H33" />
      <path d="M8 41h32" />
    </svg>
  );
}

/**
 * A row of cups, one per coffee the option represents. Capped so a “twelve
 * coffees” option stays on one line inside a narrow card.
 */
export function CupRow({ count, className }: { count: number; className?: string }) {
  const shown = Math.min(Math.max(count, 1), 6);

  return (
    <span aria-hidden className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: shown }).map((_, index) => (
        <svg key={index} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" className="size-3.5 opacity-70">
          <path d="M3 6h8v3.5A3.5 3.5 0 0 1 7.5 13h-1A3.5 3.5 0 0 1 3 9.5z" />
          <path d="M11 7h1.5a1.75 1.75 0 0 1 0 3.5H11" />
        </svg>
      ))}
      {count > shown && <span className="text-[10px] tabular-nums opacity-70">+{count - shown}</span>}
    </span>
  );
}
