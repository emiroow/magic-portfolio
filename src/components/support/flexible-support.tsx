'use client';

import { SupportMark } from '@/components/support/support-mark';
import { Tag } from '@/components/support/support-tile';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MODE_ICONS } from '@/components/support/support-meta';
import type { IDonation } from '@/types';
import { useTranslations } from 'next-intl';

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
 * one decision, and the wizard is where that decision is made — the same screen
 * that shows the currency, the limits and the payment details. What is listed here
 * is only which doors are open.
 */
export default function FlexibleSupport({ methods, onOpen, className }: FlexibleSupportProps) {
  const t = useTranslations('support');

  if (!methods.length) return null;

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

          {/* What can be chosen inside the wizard, not a control here. */}
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {methods.map(method => {
              const Icon = MODE_ICONS[method.mode];

              return (
                <li key={method._id ?? method.slug ?? method.title}>
                  <Tag>
                    <Icon className="size-3 shrink-0" aria-hidden />
                    {t(`modes.${method.mode}`)}
                  </Tag>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <Button onClick={onOpen} className="shrink-0 rounded-full px-5">
        {t('flexible.choose')}
      </Button>
    </section>
  );
}
