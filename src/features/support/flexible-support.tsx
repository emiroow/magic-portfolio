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
 * It asks for nothing on the page: the method, the destination and the number are
 * one decision, made in the window this door opens — and that window is the only
 * place a choice between methods is offered. What is named here is the set of
 * methods this door leads to, so the box reads as its own thing rather than as a
 * copy of the cards below it.
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
      className={cn('flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5', className)}
    >
      <div className="flex min-w-0 items-start gap-4">
        {/* The section's own mark, held at the same scale as a card's icon tile. */}
        <SupportMark className="size-9 shrink-0 text-muted-foreground" />
        <div className="min-w-0 space-y-1.5">
          <h2 id="flexible-support-heading" className="text-base font-bold leading-tight ltr:tracking-tight">
            {t('anyAmountTitle')}
          </h2>
          <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">{t('anyAmountDescription')}</p>

          {/* Which methods the window offers to choose between, not a control here. */}
          <ul className="flex flex-wrap items-center gap-1.5 pt-1" aria-label={t('flexible.offers')}>
            {named.map(method => {
              const Icon = MODE_ICONS[method.mode];

              return (
                <li key={method._id ?? method.slug ?? method.title}>
                  <Tag className="max-w-44">
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
      </div>

      <Button onClick={onOpen} className="shrink-0 rounded-full px-5">
        {t('flexible.choose')}
      </Button>
    </section>
  );
}
