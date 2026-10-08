'use client';

import { SupportMark } from '@/features/support/support-mark';
import { MODE_ICONS } from '@/features/support/support-meta';
import { Tag } from '@/features/support/support-tile';
import { Button } from '@/components/ui/button';
import { cn, localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IDonation } from '@/features/support/types';
import { useLocale, useTranslations } from 'next-intl';

/** Methods named on the door before the count of the ones left behind takes over. */
const SHOWN_METHODS = 4;

interface FlexibleSupportProps {
  /** Methods that accept an amount the owner did not pre-set. */
  methods: IDonation[];
  /** Opens the wizard with nothing chosen yet. */
  onOpen: () => void;
  className?: string;
}

/**
 * The door to supporting at an amount of the visitor's own choosing.
 *
 * It is the one place on the page where the supporter picks the method, so it is the
 * only surface on the page framed in the full-weight border and the only button that
 * is set solid and across the whole column. Everything below it is a specific rail;
 * this is the general one.
 *
 * It asks for nothing on the page itself: the method, the destination and the number
 * are one decision, made in the window this door opens — and that window is the only
 * place a choice between methods is offered. What is named here is the set of methods
 * this door leads to, so the panel reads as its own thing rather than as a copy of
 * the rows beside it.
 */
export default function FlexibleSupport({ methods, onOpen, className }: FlexibleSupportProps) {
  const t = useTranslations('support');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  if (!methods.length) return null;

  const named = methods.slice(0, SHOWN_METHODS);
  const hidden = methods.length - named.length;

  return (
    <section
      aria-labelledby="flexible-support-heading"
      className={cn(
        'group flex flex-col gap-4 rounded-xl border border-foreground/40 bg-card p-5 transition-colors hover:border-foreground',
        // Across the middle widths this block is as wide as the page, so it reads as a
        // banner; only in the rail, where it is a column of its own, does it stack.
        'sm:flex-row sm:items-center sm:gap-6 sm:p-6 lg:flex-col lg:items-stretch lg:gap-4 lg:p-5',
        className
      )}
    >

      <div className="min-w-0 flex-1 space-y-2">
        <h2 id="flexible-support-heading" className="text-base font-bold leading-tight ltr:tracking-tight">
          {t('anyAmountTitle')}
        </h2>
        <p className="text-pretty text-xs leading-relaxed text-muted-foreground">{t('anyAmountDescription')}</p>

        {/* Which methods the window offers to choose between, not a control here. */}
        <ul className="flex flex-wrap gap-1.5 pt-0.5" aria-label={t('flexible.offers')}>
          {named.map(method => {
            const Icon = MODE_ICONS[method.mode];

            return (
              <li key={method._id ?? method.slug ?? method.title}>
                <Tag className="max-w-full">
                  <Icon className="size-3 shrink-0" aria-hidden />
                  <span className="min-w-0 truncate" dir="auto">
                    {method.title}
                  </span>
                </Tag>
              </li>
            );
          })}
          {hidden > 0 && (
            <li>
              <Tag>{t('flexible.more', { count: localizedCount(hidden, lang) })}</Tag>
            </li>
          )}
        </ul>
      </div>

      <Button onClick={onOpen} size="lg" className="w-full rounded-full sm:w-auto sm:shrink-0 lg:w-full">
        {t('flexible.choose')}
      </Button>
    </section>
  );
}
