'use client';

import type { MouseEvent } from 'react';
import { flushSync } from 'react-dom';

/**
 * Circular reveal for the light/dark switch.
 *
 * The drawing is CSS: `globals.css` grows a `clip-path` circle over the incoming snapshot
 * while the outgoing one holds still. What lives here is the aiming — the point the circle
 * starts from, the radius that reaches the farthest corner, and the one thing a stylesheet
 * cannot know: whether the new theme has actually reached the page by the time the browser
 * takes its picture of it.
 */

/** Geometry the keyframes read, written before the transition so its very first frame is aimed. */
const GEOMETRY = { x: '--theme-reveal-x', y: '--theme-reveal-y', r: '--theme-reveal-r' } as const;

/**
 * Tasks the snapshot waits on `next-themes` to write its attribute. Bounded, so a change that
 * never lands delays the reveal by a few frames rather than hanging it — and deliberately
 * timers instead of `requestAnimationFrame`, because the browser holds its frames while a
 * transition is still waiting for the callback to return.
 */
const SETTLE_LIMIT = 4;

/** The reveal in flight, if any: only the newest one owns the geometry. */
let running: ViewTransition | null = null;

type Reveal = {
  /** The press that asked for the change; the circle grows from where it happened. */
  event: MouseEvent<HTMLElement>;
  /** Theme about to become active, spelled the way `ThemeProvider attribute="class"` writes it. */
  next: string;
  /** The change itself — `next-themes`' `setTheme`. */
  change: () => void;
};

/** Whether `<html>` already carries the theme. */
const applied = (theme: string) => document.documentElement.classList.contains(theme);

const task = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });

/**
 * Distance to the farthest of the four corners. Each axis is measured to its own extreme
 * before the diagonal is taken, so a toggle in the top-left of a wide screen still closes the
 * circle over the bottom-right instead of leaving the corner in the old theme.
 */
function radius(x: number, y: number) {
  return Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)));
}

/**
 * Where the circle starts: the real click, in viewport coordinates — which is also the space
 * the root snapshot is painted in, so no scroll offset has to be corrected for.
 *
 * A press made by the keyboard reports no position at all (`detail` 0, coordinates `0,0`), so
 * Enter on a focused toggle is aimed at the control itself; otherwise the reveal would grow
 * out of the corner of the screen and say nothing about where it came from.
 */
function origin(event: MouseEvent<HTMLElement>) {
  const { clientX: x, clientY: y, nativeEvent } = event;
  if (nativeEvent.detail > 0 && (x !== 0 || y !== 0)) return { x, y };

  const box = event.currentTarget.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

/**
 * Switch the theme behind a circle that expands from `event`.
 *
 * Engines without the API (Firefox, Safari before 18.2) and visitors who asked for reduced
 * motion get the plain switch instead — the same call, so persistence and the system theme
 * keep working through `next-themes` either way.
 */
export function withThemeReveal({ event, next, change }: Reveal) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof document.startViewTransition !== 'function') {
    change();
    return;
  }

  const { x, y } = origin(event);
  const style = document.documentElement.style;
  style.setProperty(GEOMETRY.x, `${x}px`);
  style.setProperty(GEOMETRY.y, `${y}px`);
  style.setProperty(GEOMETRY.r, `${radius(x, y)}px`);

  const transition = document.startViewTransition(async () => {
    // `setTheme` is React state and the attribute lands in the provider's effect. Without a
    // synchronous commit this callback would return while the page still showed the old theme,
    // the incoming snapshot would be a picture of that old theme, and the reveal would animate
    // nothing but a duplicate of what was already on screen.
    flushSync(change);

    // Even a committed tree is not proof the effect has run, so the snapshot waits for the
    // theme itself rather than for a guessed number of frames.
    for (let attempt = 0; attempt < SETTLE_LIMIT && !applied(next); attempt++) await task();
  });

  running = transition;

  /**
   * A second reveal started while one is running makes the browser cut the first short and
   * keep the newest, so the geometry may only be released by whoever is still last: clearing
   * it any earlier would drop an in-flight reveal back onto its centred fallback halfway
   * through. (Pointer presses seldom arrive inside that window — see the note on its length
   * in `globals.css` — but a keyboard activation can.)
   */
  const release = () => {
    if (running !== transition) return;
    running = null;
    Object.values(GEOMETRY).forEach(name => style.removeProperty(name));
  };

  // `finished` rejects only when the callback throws or a navigation overtakes the reveal;
  // the theme is applied in both cases, so each branch simply tidies up.
  transition.finished.then(release, release);
}
