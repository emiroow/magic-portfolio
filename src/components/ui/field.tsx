'use client';

import { cn } from '@/lib/utils';
import { useValidationMessage } from '@/hooks/useValidationMessage';
import { createContext, useContext, useId, type ReactNode } from 'react';

/**
 * What a control inherits from the `Field` wrapping it.
 *
 * The error text alone is not enough: without `aria-invalid` a screen reader keeps
 * announcing the field as fine, and without `aria-describedby` the reason is never
 * read when focus returns to it. The ids are minted here so a control only has to
 * consume the context instead of every caller wiring three attributes by hand.
 */
interface FieldContextValue {
  describedBy?: string;
  invalid: boolean;
}

const FieldContext = createContext<FieldContextValue>({ invalid: false });

/** Read by `Input`, `Textarea` and `Select`; safe to call outside a `Field`. */
export function useFieldContext() {
  return useContext(FieldContext);
}

interface FieldProps {
  label: string;
  /** Id of the control, so the label is programmatically attached. */
  id?: string;
  error?: string;
  /** Muted helper line under the control. */
  hint?: string;
  /** Word shown beside the label when the field may stay empty. */
  optionalLabel?: string;
  children: ReactNode;
  className?: string;
}

/** Label + control + hint + inline error, with the three wired to each other. */
export function Field({ label, id, error, hint, optionalLabel, children, className }: FieldProps) {
  const tv = useValidationMessage();
  const generated = useId();
  const controlId = id ?? generated;
  const message = tv(error);

  const describedBy = [hint && !message ? `${controlId}-hint` : null, message ? `${controlId}-error` : null].filter(Boolean).join(' ') || undefined;

  return (
    <FieldContext.Provider value={{ describedBy, invalid: Boolean(message) }}>
      <div className={cn('flex flex-col gap-2', className)}>
        <label htmlFor={controlId} className="flex flex-wrap items-baseline gap-x-2 text-xs font-medium text-muted-foreground">
          {label}
          {optionalLabel && !message && <span className="text-[10px] font-normal opacity-70">{optionalLabel}</span>}
        </label>
        {children}
        {hint && !message && (
          <p id={`${controlId}-hint`} className="text-xs leading-relaxed text-muted-foreground/80">
            {hint}
          </p>
        )}
        {message && (
          <p id={`${controlId}-error`} role="alert" className="text-xs text-destructive">
            {message}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

interface CheckboxFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  hint?: string;
}

/**
 * Checkbox rendered as a control surface, so it keeps the same height and alignment
 * as the inputs sitting next to it in a form grid. A `hint` is bound with
 * `aria-describedby`, which is what makes a disabled checkbox explain itself
 * instead of looking broken.
 */
export function CheckboxField({ label, id, hint, className, ...props }: CheckboxFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        className={cn(
          'flex min-h-10 items-center gap-2.5 rounded-lg border border-input bg-background px-3 py-2 shadow-sm transition-colors',
          'focus-within:ring-2 focus-within:ring-ring/40',
          props.disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <input
          id={id}
          type="checkbox"
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="size-4 shrink-0 rounded border-input accent-primary disabled:cursor-not-allowed"
          {...props}
        />
        <label htmlFor={id} className={cn('text-sm leading-snug', props.disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
          {label}
        </label>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted-foreground/80">
          {hint}
        </p>
      )}
    </div>
  );
}
