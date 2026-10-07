'use client';

import * as React from 'react';

import { useFieldContext } from '@/components/ui/field';
import { cn } from '@/lib/utils';

/**
 * Native select on the shared `.control` surface.
 *
 * The platform popup is kept on purpose: it is the one list a phone already knows
 * how to scroll, filter and dismiss. Only the closed face is styled, so it lines up
 * with `Input` beside it in a form grid.
 */
const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<'select'>>(({ className, ...props }, ref) => {
  const { describedBy, invalid } = useFieldContext();

  return <select aria-invalid={invalid || undefined} aria-describedby={describedBy} className={cn('control', className)} ref={ref} {...props} />;
});
Select.displayName = 'Select';

export { Select };
