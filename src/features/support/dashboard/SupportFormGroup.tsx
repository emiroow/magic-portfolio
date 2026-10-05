'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

interface SupportFormGroupProps {
  /** Id of the step's first control, so the error summary can jump the owner to it. */
  id: string;
  index: number;
  title: string;
  description: string;
  /** Whether this step still holds a mistake. */
  broken: boolean;
  children: ReactNode;
}

/**
 * One numbered step of the support-method form.
 *
 * The method form asks in the order a method is decided, so each step is a fieldset
 * with its own heading, its own number and its own marker when something in it is
 * still wrong. A screen reader gets the step count from the sr-only line, which the
 * visible number alone cannot carry.
 */
const SupportFormGroup = ({ id, index, title, description, broken, children }: SupportFormGroupProps) => {
  const t = useTranslations('dashboard.support.options');

  return (
    <fieldset id={id} className="space-y-4 border-0 p-0">
      <legend className="mb-1 flex items-center gap-2.5">
        <span
          aria-hidden
          className={
            broken
              ? 'flex size-6 items-center justify-center rounded-full border border-destructive text-[11px] font-bold tabular-nums text-destructive'
              : 'flex size-6 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums text-muted-foreground'
          }
        >
          {index}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold leading-tight">{title}</span>
          <span className="block text-xs leading-relaxed text-muted-foreground">{description}</span>
        </span>
        <span className="sr-only">{t('stepOfFields', { current: index, title })}</span>
      </legend>
      <div className="space-y-4 sm:ps-8">{children}</div>
    </fieldset>
  );
};

export default SupportFormGroup;
