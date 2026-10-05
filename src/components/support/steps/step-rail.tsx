'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Step } from '@/components/support/steps/flow';

/**
 * The progress rail of the wizard: one mark per step of the current flow, the
 * reached ones solid, the finished ones carrying a check.
 *
 * It is a real list with `aria-current` rather than a decorative strip, so a screen
 * reader says where in the flow the supporter is standing — the number of marks
 * changes with the method, and two steps is not a mistake of a broken three.
 */
export function StepRail({ steps, current }: { steps: Step[]; current: Step }) {
  const td = useTranslations('support.dialog');
  const reached = steps.indexOf(current);

  return (
    <ol aria-label={td('progress')} className="flex items-end gap-2">
      {steps.map((step, index) => {
        const done = index < reached;
        const active = index === reached;
        const state = done || active;

        return (
          <li key={step} aria-current={active ? 'step' : undefined} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span
              className={cn('h-0.5 rounded-full transition-colors duration-300', active ? 'bg-foreground' : done ? 'bg-foreground/60' : 'bg-border')}
            />
            <span
              className={cn(
                'flex items-center gap-1 truncate text-[10px] font-medium transition-colors duration-300',
                state ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {done && <Check className="size-3 shrink-0" aria-hidden />}
              {td(`steps.${step}`)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
