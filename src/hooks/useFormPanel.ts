'use client';

import { useCallback, useRef, useState } from 'react';

/** Bring a dashboard section back into view; the floating navbar sits at the bottom, so the top edge is free. */
export function useSectionScroll() {
  const anchorRef = useRef<HTMLElement>(null);

  const scrollToSection = useCallback(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    anchorRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }, []);

  return { anchorRef, scrollToSection };
}

/**
 * Edit-panel state for a dashboard section.
 * `open` scrolls the section into view because the panel renders above the list
 * and would otherwise stay off-screen; the caller passes `close` as the save
 * mutation's success callback, so a rejected save leaves the values editable.
 */
export function useFormPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { anchorRef, scrollToSection } = useSectionScroll();

  const open = useCallback(() => {
    setIsOpen(true);
    scrollToSection();
  }, [scrollToSection]);

  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, open, close, anchorRef };
}
