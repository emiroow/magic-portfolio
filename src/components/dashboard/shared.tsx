'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { AlertTriangle, RotateCw, X } from 'lucide-react';
import { ReactNode, useEffect, useRef } from 'react';
import { useValidationMessage } from '@/hooks/useValidationMessage';

/** Shared dashboard building blocks: headers, empty/error/loading states and the form panel. */

/**
 * Section heading row with title, trailing actions and a hairline rule.
 * `anchorRef` marks the section so an opened edit panel can scroll it back into view.
 */
export function SectionShell({
  title,
  action,
  anchorRef,
  children,
}: {
  title: string;
  action?: ReactNode;
  anchorRef?: React.Ref<HTMLElement>;
  children: ReactNode;
}) {
  return (
    <section ref={anchorRef} className="mb-16">
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold leading-tight ltr:tracking-tight sm:text-xl">{title}</h2>
        {action}
      </div>
      <div aria-hidden className="rule-fade mt-4" />
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Centered empty state with an optional primary action. */
export function EmptyState({ text, actionText, onAction }: { text: string; actionText?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-14 text-center">
      <p className="max-w-sm px-6 text-sm leading-relaxed text-muted-foreground">{text}</p>
      {actionText && onAction && (
        <Button variant="outline" onClick={onAction} className="rounded-full">
          {actionText}
        </Button>
      )}
    </div>
  );
}

/** Query error state with a retry button. */
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const t = useTranslations('dashboard');

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-destructive/40 py-14 text-center">
      <span aria-hidden className="flex size-11 items-center justify-center rounded-full border border-destructive/40">
        <AlertTriangle className="size-4 text-destructive" />
      </span>
      <p className="max-w-sm px-6 text-sm leading-relaxed text-muted-foreground">{message || t('loadError')}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="rounded-full">
          <RotateCw className="me-2 size-3.5" aria-hidden />
          {t('retry')}
        </Button>
      )}
    </div>
  );
}

/** Loading skeleton mirroring the divided list surface. */
export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border" aria-busy="true">
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}

/**
 * Slide-in form panel with enter/exit animation and a close affordance.
 * Carries its own bottom margin so the list under it never sits flush
 * against an open panel; the margin unmounts with the panel.
 */
export function FormPanel({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const t = useTranslations('dashboard');
  const dismiss = useRef(onClose);

  useEffect(() => {
    dismiss.current = onClose;
  });

  // Escape closes the panel, unless a modal (confirm, cropper) owns the key right now.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.querySelector('[role="dialog"]')) return;
      dismiss.current();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key="form-panel"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="mb-6 rounded-xl border bg-card shadow-sm"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
            <h3 className="text-sm font-bold ltr:tracking-tight sm:text-base">{title}</h3>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={t('cancel')} className="size-8 shrink-0">
              <X className="size-4" aria-hidden />
            </Button>
          </div>
          {/* Hairline keeps the header separate from the field rhythm below. */}
          <div aria-hidden className="h-px w-full bg-border" />
          <div className="px-4 py-5 sm:px-5">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Label + control + inline error text.
 *
 * `optionalLabel` marks a field the form accepts empty, so an owner never has to
 * guess whether a blank limit is a mistake or a choice.
 */
export function Field({
  label,
  id,
  error,
  hint,
  optionalLabel,
  children,
  className,
}: {
  label: string;
  /** `id` of the control, so the label is programmatically attached. */
  id?: string;
  error?: string;
  /** Muted helper line under the control. */
  hint?: string;
  /** Word shown beside the label when the field may stay empty. */
  optionalLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  const tv = useValidationMessage();

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="flex flex-wrap items-baseline gap-x-2 text-xs font-medium text-muted-foreground">
        {label}
        {optionalLabel && !error && <span className="text-[10px] font-normal opacity-70">{optionalLabel}</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground/80">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {tv(error)}
        </p>
      )}
    </div>
  );
}

/**
 * Checkbox rendered as a control surface, so it keeps the same height and
 * alignment as the inputs sitting next to it in a form grid. A `hint` is bound
 * to the input with `aria-describedby`, which is what makes a disabled
 * checkbox explain itself instead of looking broken.
 */
export function CheckboxField({
  label,
  id,
  hint,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; hint?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        className={cn(
          'flex min-h-10 items-center gap-2.5 rounded-lg border border-input px-3 py-2 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring/40',
          props.disabled && 'opacity-60'
        )}
      >
        <input
          id={id}
          type="checkbox"
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="size-4 shrink-0 rounded border-input accent-primary"
          {...props}
        />
        <label htmlFor={id} className="cursor-pointer text-sm leading-none">
          {label}
        </label>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground/80">
          {hint}
        </p>
      )}
    </div>
  );
}
