'use client';

import { ActionStep } from '@/features/support/steps/action-step';
import { ChooseStep } from '@/features/support/steps/choose-step';
import { DetailsStep } from '@/features/support/steps/details-step';
import { DialogActions } from '@/features/support/steps/dialog-actions';
import { PaymentStep } from '@/features/support/steps/payment-step';
import { ErrorNote, Thanks } from '@/features/support/steps/step-parts';
import { StepRail } from '@/features/support/steps/step-rail';
import type { Step } from '@/features/support/steps/flow';
import { useSupportWizard } from '@/features/support/use-support-wizard';
import { choiceRegion, nameDir, spansMarkets } from '@/features/support/support-meta';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IDonation } from '@/features/support/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';

interface SupportDialogProps {
  /**
   * The methods this window offers a choice between. One card on `/support` passes
   * none — its window belongs to that card alone and shows only its own payment
   * destinations. Only the “your own amount” box hands over a list to pick from.
   */
  choices: IDonation[];
  /** The heading of the box the window was opened from, when it is not one method. */
  heading?: { title: string; description: string };
  /** The method the visitor came in on; `null` keeps the window closed. */
  option: IDonation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * An amount chosen before the window opened, through a shared link. When the
   * method accepts it, the wizard starts on the next step.
   */
  initialAmount?: number;
  /** Destination a shared link points at. */
  initialVariantKey?: string;
  /** The page owns the selection, so a switch inside the wizard is visible outside it. */
  onSelect: (option: IDonation, variantKey: string, amount: number) => void;
}

/**
 * The support window: one item, the payment destinations that item carries, and
 * whatever its own conditions ask for.
 *
 * This file is only the surface. The decision itself — step, destination, amount,
 * details, what the server handed back — lives in `useSupportWizard`, and the wording
 * of the footer follows from it, so no two places can disagree about what a supporter
 * can do at this moment.
 */
export function SupportDialog({ choices, heading, option, open, onOpenChange, initialAmount, initialVariantKey, onSelect }: SupportDialogProps) {
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={next => (next ? onOpenChange(true) : close())}>
      {/*
       * The wizard rises from below and sinks back down on its way out (`wizard-rise`).
       * Its own scroll happens inside the step body: the heading, the progress rail and
       * the action row stay put, so the button a supporter is looking for is never
       * below the fold on a phone — which is exactly what happened when the whole
       * window scrolled.
       */}
      <DialogContent className="wizard-rise grid-rows-[auto_auto_minmax(0,1fr)_auto] max-w-lg overflow-hidden">
        {/* Keyed on the method alone, not on `open`: the window is still on screen while
            it sinks away, and dropping the content the moment `open` flipped left an empty
            frame collapsing instead of a wizard sliding down. */}
        {option ? (
          <SupportWizard
            option={option}
            choices={choices}
            heading={heading}
            initialAmount={initialAmount}
            initialVariantKey={initialVariantKey}
            onSelect={onSelect}
            onClose={close}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** The inside of the window, mounted per method so its state cannot leak between them. */
function SupportWizard({
  option,
  choices,
  heading,
  initialAmount,
  initialVariantKey,
  onSelect,
  onClose,
}: Omit<SupportDialogProps, 'open' | 'onOpenChange' | 'option'> & { option: IDonation; onClose: () => void }) {
  const t = useTranslations('support');
  const td = useTranslations('support.dialog');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';
  const wizard = useSupportWizard({ option, onSelect, initialAmount, initialVariantKey });

  /** Only the box that asks for a choice shows a heading of its own. */
  const picking = choices.length > 1;
  const modeLabel = t(`modes.${option.mode}`);
  const title = picking ? (heading?.title ?? option.title) : option.title;
  /** The name beside the title: the method in view inside the box, the destination on a card. */
  const subtitle = picking ? option.title : wizard.destination !== modeLabel ? wizard.destination : '';
  /** The first step is named for what it actually asks on this item. */
  const firstStepTitle = picking
    ? td('steps.choose')
    : !wizard.money
      ? td('actionWhere')
      : wizard.destinations.length > 1
        ? td('steps.destination')
        : td('steps.amount');
  const stepTitle = (item: Step) => (item === 'choose' ? firstStepTitle : td(`steps.${item}`));

  return (
    <>
      {/* `pe-10` keeps the title clear of the close mark, which sits over this corner. */}
      <DialogHeader className="pe-10">
        <DialogTitle className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-base">
          <span className="break-words" dir={nameDir(title)}>
            {title}
          </span>
          {subtitle && (
            <span className="min-w-0 max-w-full truncate text-sm font-normal text-muted-foreground" dir={nameDir(subtitle)}>
              {subtitle}
            </span>
          )}
        </DialogTitle>
        <DialogDescription>
          {picking ? (heading?.description ?? modeLabel) : modeLabel}
          <span aria-live="polite" className="sr-only">
            {td('stepOf', {
              current: localizedCount(wizard.flow.indexOf(wizard.step) + 1, lang),
              total: localizedCount(wizard.flow.length, lang),
            })}
          </span>
        </DialogDescription>
      </DialogHeader>

      {/* Step rail: one mark per step of this item's flow, the reached ones solid. */}
      <StepRail steps={wizard.flow} current={wizard.step} titleFor={stepTitle} />

      {/* The step body is the only part that scrolls, and a step enters from below —
          the same direction the window itself travels in. The negative trailing margin
          puts the scrollbar in the window's own padding instead of over the content. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={wizard.thanks ? 'thanks' : `${wizard.step}-${wizard.result?.kind ?? 'form'}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="-me-2 min-h-0 space-y-5 overflow-y-auto overscroll-contain pe-2 pb-1"
        >
          {wizard.thanks ? (
            <Thanks note={td('donePending')} onClose={onClose} />
          ) : wizard.step === 'choose' ? (
            <ChooseStep
              choices={choices}
              option={option}
              destinations={wizard.destinations}
              variant={wizard.variant}
              money={wizard.money}
              mixedMarkets={spansMarkets(option)}
              quickAmounts={wizard.quickAmounts}
              amount={wizard.amount}
              custom={wizard.custom}
              showCustomField={Boolean(wizard.variant?.customAmount)}
              currency={wizard.currency}
              amountError={wizard.amountError}
              onPickMethod={wizard.pickMethod}
              onPickVariant={wizard.pickVariant}
              onPickAmount={wizard.pickAmount}
              onCustom={wizard.typeAmount}
            />
          ) : wizard.step === 'details' ? (
            <DetailsStep
              details={wizard.details}
              onChange={wizard.setDetail}
              amount={wizard.amount}
              currency={wizard.currency}
              summary={{ method: option.title, destination: wizard.destination }}
            />
          ) : wizard.step === 'action' ? (
            <ActionStep option={option} variant={wizard.variant} destination={wizard.destination} />
          ) : wizard.result ? (
            <PaymentStep
              destination={wizard.destination}
              result={wizard.result}
              amount={wizard.amount}
              currency={wizard.currency}
              market={choiceRegion({ option, variant: wizard.variant })}
              reference={wizard.details.reference}
              onReference={value => wizard.setDetail('reference', value)}
              copiedKey={wizard.copiedKey}
              onCopy={wizard.copy}
            />
          ) : null}

          {wizard.errorCode && !wizard.thanks && <ErrorNote message={td(`errors.${wizard.errorCode}`)} onRetry={wizard.dismissError} />}
        </motion.div>
      </AnimatePresence>

      <DialogActions wizard={wizard} onClose={onClose} />
    </>
  );
}
