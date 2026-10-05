'use client';

import type { Wizard } from '@/features/support/use-support-wizard';
import { Button } from '@/components/ui/button';
import { ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * The footer of the support window: one place that changes, one place that goes back.
 *
 * It draws whatever the wizard says can be done right now rather than testing which
 * step it is on, so a method's own conditions — a link out, a transfer to declare, a
 * gateway that has already taken the tab — cannot disagree with the button beside it.
 * The secondary action always sits at the reading start, so nothing jumps around.
 */
export function DialogActions({ wizard, onClose }: { wizard: Wizard; onClose: () => void }) {
  const td = useTranslations('support.dialog');
  const { primary, busy, back, money } = wizard;

  if (wizard.thanks) return null;

  const spinner = busy ? <Loader2 className="me-2 size-4 animate-spin" aria-hidden /> : null;

  return (
    <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between sm:pt-5">
      {primary.kind === 'wait' ? (
        <span aria-hidden />
      ) : back ? (
        <Button type="button" variant="ghost" onClick={() => wizard.go(back)} disabled={busy}>
          {td('back')}
        </Button>
      ) : (
        <Button type="button" variant="ghost" onClick={onClose}>
          {td('close')}
        </Button>
      )}

      {primary.kind === 'next' && (
        <Button type="button" onClick={wizard.next} disabled={busy} className="min-w-28">
          {money ? td('continue') : td('seeSteps')}
          <ArrowRight className="ms-2 size-4 rtl:-scale-x-100" aria-hidden />
        </Button>
      )}

      {/* The label follows the method: an on-site payment leaves this tab,
          a transfer only needs its details to be shown. */}
      {primary.kind === 'checkout' && (
        <Button type="button" onClick={wizard.startCheckout} disabled={busy || !wizard.variant} className="min-w-36">
          {spinner}
          {primary.label}
        </Button>
      )}

      {primary.kind === 'declare' && (
        <Button type="button" onClick={wizard.declareSent} disabled={busy}>
          {spinner}
          {busy ? td('declaring') : td('declare')}
        </Button>
      )}

      {primary.kind === 'link' && (
        // The only way out is the destination itself: an explicit link, opened by the
        // supporter's own click, never a surprise popup.
        <Button asChild className="min-w-36">
          <a href={primary.href} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="me-2 size-4" aria-hidden />
            {primary.label}
          </a>
        </Button>
      )}
    </div>
  );
}
