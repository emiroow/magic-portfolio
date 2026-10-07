'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import Blog from '@/features/blog/dashboard/Blog';
import EducationExperience from '@/features/education/dashboard/Education';
import Profile from '@/features/profile/dashboard/Profile';
import Products from '@/features/products/dashboard/Products';
import Projects from '@/features/projects/dashboard/Projects';
import Skills from '@/features/skills/dashboard/Skills';
import Socials from '@/features/socials/dashboard/Socials';
import Support from '@/features/support/dashboard/Support';
import WorkExperience from '@/features/experience/dashboard/WorkExperience';

/**
 * Ordered dashboard sections.
 *
 * `tab` is what the URL carries, so a section can be linked to and survives a
 * refresh; `trans` is the key under `dashboard.menu`.
 */
const TABS = [
  { tab: 'profile', trans: 'Profile', component: Profile },
  { tab: 'work', trans: 'Work', component: WorkExperience },
  { tab: 'education', trans: 'Education', component: EducationExperience },
  { tab: 'skills', trans: 'Skills', component: Skills },
  { tab: 'projects', trans: 'Projects', component: Projects },
  { tab: 'products', trans: 'Products', component: Products },
  { tab: 'socials', trans: 'Socials', component: Socials },
  { tab: 'blog', trans: 'Blog', component: Blog },
  { tab: 'support', trans: 'Support', component: Support },
] as const;

/** `history.replaceState` is silent, so the store announces its own writes. */
const TAB_EVENT = 'dashboard:tab';

const readSlug = () => new URLSearchParams(window.location.search).get('tab') ?? TABS[0].tab;
const serverSlug = () => TABS[0].tab;

/**
 * Dashboard section switcher: a segmented pill control with full tablist semantics
 * (roving tabindex, arrow/Home/End keys, RTL-aware direction).
 *
 * The active section is read out of `?tab=` rather than out of local state, so a link
 * to one section opens that section and a refresh keeps the owner where they were.
 * Writes go through `history.replaceState` instead of the router: changing a section is
 * not a navigation, and nine pushed entries would make leaving the dashboard take nine
 * presses of Back. A server render has no URL to read, so it stands up the first
 * section and the client reconciles against the real one on hydration.
 */
const AdminTabs = () => {
  const t = useTranslations('dashboard.menu');
  const td = useTranslations('dashboard');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener(TAB_EVENT, onStoreChange);
    window.addEventListener('popstate', onStoreChange);
    return () => {
      window.removeEventListener(TAB_EVENT, onStoreChange);
      window.removeEventListener('popstate', onStoreChange);
    };
  }, []);

  const slug = useSyncExternalStore(subscribe, readSlug, serverSlug);
  const found = TABS.findIndex(item => item.tab === slug);
  // An unknown or absent slug is not an error worth surfacing: it falls back to the
  // first section, which is what a bare `/dashboard` link means anyway.
  const activeTab = found === -1 ? 0 : found;
  const Active = TABS[activeTab].component;

  // The strip scrolls sideways on narrow screens, so a tab picked from the far end has
  // to be brought back into view. `nearest` keeps the rest of the page still.
  useEffect(() => {
    tabRefs.current[activeTab]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeTab]);

  const registerTab = useCallback(
    (index: number) => (node: HTMLButtonElement | null) => {
      tabRefs.current[index] = node;
    },
    []
  );

  const selectTab = (index: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', TABS[index].tab);
    // The existing state is passed through: Next keeps its own bookkeeping there.
    window.history.replaceState(window.history.state, '', url);
    window.dispatchEvent(new Event(TAB_EVENT));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const handled = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!handled.includes(event.key)) return;

    event.preventDefault();
    // Arrows follow the visual order, so they invert in RTL.
    const direction = document.documentElement.dir === 'rtl' ? -1 : 1;
    const step = event.key === 'ArrowRight' ? direction : -direction;

    let next = activeTab;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    else next = (activeTab + step + TABS.length) % TABS.length;

    selectTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={td('tabsAria')}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className={cn(
          'flex w-full gap-1 overflow-x-auto rounded-full border bg-muted/40 p-1 sm:w-max sm:max-w-full',
          // The strip is a control, not a document: its own scrollbar only adds noise.
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        )}
      >
        {TABS.map((tab, index) => (
          <button
            key={tab.tab}
            id={`dashboard-tab-${tab.tab}`}
            ref={registerTab(index)}
            role="tab"
            type="button"
            aria-selected={index === activeTab}
            aria-controls={`dashboard-panel-${tab.tab}`}
            tabIndex={index === activeTab ? 0 : -1}
            onClick={() => selectTab(index)}
            className={cn(
              'whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors sm:text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              index === activeTab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t(tab.trans)}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`dashboard-panel-${TABS[activeTab].tab}`}
        aria-labelledby={`dashboard-tab-${TABS[activeTab].tab}`}
        tabIndex={0}
        className="w-full focus-visible:outline-none"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={TABS[activeTab].tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Active />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminTabs;
