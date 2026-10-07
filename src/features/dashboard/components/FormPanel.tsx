'use client';

import Loading from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, type ReactNode } from 'react';

interface FormPanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The slide-in create/edit surface every archive shares.
 *
 * It renders above the list rather than in a modal, so an owner can still read the
 * row they are editing while changing it. Focus moves in once the entrance settles,
 * because the panel is the only thing that matters at that moment, and Escape leaves
 * through the same door the close button does — unless a dialog (confirm, cropper)
 * owns the key. The bottom margin unmounts with the panel, so the list never sits
 * flush against an open form.
 */
export function FormPanel({ open, title, onClose, children }: FormPanelProps) {
  const t = useTranslations('dashboard');
  const dismiss = useRef(onClose);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dismiss.current = onClose;
  });

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
          // Focus lands on the heading rather than the first field: that field is
          // often a crop or a pick, and dropping straight into it would skip the
          // line that says where the owner just arrived.
          onAnimationComplete={() => headerRef.current?.focus({ preventScroll: true })}
          className="mb-6 rounded-xl border bg-card shadow-sm"
        >
          <div
            ref={headerRef}
            role="region"
            aria-label={title}
            tabIndex={-1}
            className="flex items-center justify-between gap-3 rounded-t-xl px-4 py-3.5 focus-visible:outline-none sm:px-5"
          >
            <h3 className="text-sm font-bold ltr:tracking-tight sm:text-base">{title}</h3>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={t('close')} className="size-8 shrink-0">
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

interface FormActionsProps {
  submitLabel: string;
  cancelLabel: string;
  submitting?: boolean;
  onCancel: () => void;
  /** Quiet line at the trailing edge, e.g. which fields are actually required. */
  hint?: string;
  /** Separates the row from the long form above it. */
  bordered?: boolean;
}

/**
 * Submit row of a panel form: the primary action first in reading direction, then the
 * way out. Both go full width under `sm`, because a thumb on a phone should not have
 * to hit a 96px target beside an equally small one.
 */
export function FormActions({ submitLabel, cancelLabel, submitting, onCancel, hint, bordered }: FormActionsProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between', bordered && 'border-t pt-5')}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={submitting} className="w-full rounded-full sm:w-auto">
          {submitting && <Loading size="sm" className="me-2" />}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="w-full rounded-full sm:w-auto">
          {cancelLabel}
        </Button>
      </div>
      {hint && <p className="text-xs text-muted-foreground/80">{hint}</p>}
    </div>
  );
}
