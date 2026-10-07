'use client';

import { FilterChip } from '@/components/ui/filter-chip';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

export interface AdminToolbarChip {
  value: string;
  label: ReactNode;
}

interface AdminToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  /** Doubles as the placeholder and the accessible name of the search field. */
  searchLabel: string;
  clearSearchLabel: string;
  chips?: AdminToolbarChip[];
  active?: string | null;
  onPick?: (value: string) => void;
  chipsLabel?: string;
  /** Trailing line aligned to the end of the search row, e.g. a pending count. */
  meta?: ReactNode;
}

/**
 * The only chrome an archive list gets: one quiet search field and one row of chips.
 *
 * Blog and supporters had each grown their own version — one a bare square input, the
 * other a pill with a leading glyph and a clear button — so filtering felt like a
 * different product from one tab to the next. The pill is the one that survives: the
 * glyph says what the field is before anything is typed, and the clear button means a
 * stuck filter is one tap away instead of a selection and a backspace.
 */
export function AdminToolbar({ query, onQueryChange, searchLabel, clearSearchLabel, chips, active, onPick, chipsLabel, meta }: AdminToolbarProps) {
  return (
    <div className="mb-5 space-y-3" role="search">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={event => onQueryChange(event.target.value)}
            placeholder={searchLabel}
            aria-label={searchLabel}
            className="h-9 rounded-full border-transparent bg-muted/50 ps-8 pe-8 text-sm shadow-none transition-colors hover:bg-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label={clearSearchLabel}
              className="absolute end-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>

        {meta && (
          <p aria-live="polite" className="ms-auto shrink-0 text-xs tabular-nums text-muted-foreground">
            {meta}
          </p>
        )}
      </div>

      {chips && chips.length > 0 && onPick && (
        <div
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
          role="group"
          aria-label={chipsLabel}
        >
          {chips.map(chip => (
            <FilterChip key={chip.value} active={active === chip.value} onClick={() => onPick(chip.value)}>
              {chip.label}
            </FilterChip>
          ))}
        </div>
      )}
    </div>
  );
}
