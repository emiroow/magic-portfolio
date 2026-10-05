'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import Blog from './Blog';
import EducationExperience from './Education';
import Profile from './Profile';
import Products from './Products';
import Projects from './Projects';
import Skills from './Skills';
import Socials from './Socials';
import Support from './Support';
import WorkExperience from './WorkExperience';

/** Ordered dashboard sections; `trans` is a key under `dashboard.menu`. */
const TABS = [
  { trans: 'Profile', component: Profile },
  { trans: 'Work', component: WorkExperience },
  { trans: 'Education', component: EducationExperience },
  { trans: 'Skills', component: Skills },
  { trans: 'Projects', component: Projects },
  { trans: 'Products', component: Products },
  { trans: 'Socials', component: Socials },
  { trans: 'Blog', component: Blog },
  { trans: 'Support', component: Support },
] as const;

/**
 * Dashboard section switcher: a segmented pill control with full tablist
 * semantics (roving tabindex, arrow/Home/End keys, RTL-aware direction).
 */
const Tab = () => {
  const t = useTranslations('dashboard.menu');
  const td = useTranslations('dashboard');
  const [activeTab, setActiveTab] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const Active = TABS[activeTab].component;

  // The strip scrolls sideways on narrow screens, so a tab picked from the far
  // end has to be brought back into view. `nearest` keeps the page still.
  useEffect(() => {
    tabRefs.current[activeTab]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeTab]);

  const registerTab = useCallback(
    (index: number) => (node: HTMLButtonElement | null) => {
      tabRefs.current[index] = node;
    },
    []
  );

  const focusTab = (index: number) => {
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index]?.focus();
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

    setActiveTab(next);
    focusTab(next);
  };

  return (
    <div>
      <div
        ref={listRef}
        role="tablist"
        aria-label={td('tabsAria')}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className="flex w-full gap-1 overflow-x-auto rounded-full border bg-muted/40 p-1 sm:w-max sm:max-w-full"
      >
        {TABS.map((tab, index) => (
          <button
            key={tab.trans}
            id={`dashboard-tab-${index}`}
            ref={registerTab(index)}
            role="tab"
            type="button"
            aria-selected={index === activeTab}
            aria-controls={`dashboard-panel-${index}`}
            tabIndex={index === activeTab ? 0 : -1}
            onClick={() => setActiveTab(index)}
            className={cn(
              'whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors sm:text-sm',
              index === activeTab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t(tab.trans)}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`dashboard-panel-${activeTab}`}
        aria-labelledby={`dashboard-tab-${activeTab}`}
        tabIndex={0}
        className="w-full focus-visible:outline-none"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
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

export default Tab;
