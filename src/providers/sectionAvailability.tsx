'use client';

import { createContext, useContext } from 'react';
import type { SectionAvailability } from '@/constants/global';

/**
 * The server's answer about which archives hold content, carried down to the dock.
 *
 * The locale layout asks the question once for the whole page tree (see
 * `getSectionAvailability`), so every surface answers with the same list: an empty archive
 * hides itself on the home page and on a post page alike, without either page having to
 * load counts of its own or pass them through to the bar.
 */
const SectionAvailabilityContext = createContext<SectionAvailability | null>(null);

export function SectionAvailabilityProvider({ value, children }: { value: SectionAvailability; children: React.ReactNode }) {
  return <SectionAvailabilityContext.Provider value={value}>{children}</SectionAvailabilityContext.Provider>;
}

/**
 * `null` when nothing was decided — a surface outside the locale layout, or one rendered
 * without server data. The dock reads that as "show everything", so a missing answer can
 * never blank the navigation; only a real empty section hides one.
 */
export function useSectionAvailability(): SectionAvailability | null {
  return useContext(SectionAvailabilityContext);
}
