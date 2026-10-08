'use client';

import { ProgressProvider } from '@bprogress/next/app';
import { useLocale } from 'next-intl';

/**
 * The route progress bar: one hairline along the top edge while a navigation is
 * still in flight.
 *
 * Nothing at a call site has to opt in. The provider watches every link click in the
 * document, the router's own pushes and the browser's back/forward, so the dock, the
 * archive cards and a locale switch all report themselves the same way — which is the
 * point of putting it once, around the whole tree.
 *
 * Three choices here are deliberate, and they are the three this site would otherwise
 * get wrong:
 *
 * - `direction` follows the active locale. The library mirrors the fill by transform
 *   rather than by re-anchoring the bar, so a Persian page has to be told to grow the
 *   bar from the right; left to the default it would read backwards.
 * - `delay` keeps the bar off fast navigations. Most links are prefetched, and a bar
 *   that appears and vanishes inside a frame is noise rather than feedback. A stop
 *   cancels a pending start, so only a route that really keeps you waiting is drawn.
 * - `disableStyle` drops the library's own stylesheet — its blue, its glow, its skewed
 *   peg — so the bar is painted from the site's tokens in `globals.css` and inverts with
 *   the theme without any JavaScript. The spinner goes with it: one loading affordance
 *   per surface, and the route skeletons already own the page body.
 */
export default function RouteProgress({ children }: { children: React.ReactNode }) {
  const locale = useLocale();

  return (
    <ProgressProvider
      disableStyle
      delay={200}
      options={{
        direction: locale === 'fa' ? 'rtl' : 'ltr',
        showSpinner: false,
        // The same curve every reveal on the site moves with.
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </ProgressProvider>
  );
}
