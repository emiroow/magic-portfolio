'use client';

import { ActionStep } from '@/components/support/steps/action-step';
import { ChooseStep } from '@/components/support/steps/choose-step';
import { DetailsStep } from '@/components/support/steps/details-step';
import { PaymentStep } from '@/components/support/steps/payment-step';
import { ErrorNote, Thanks } from '@/components/support/steps/step-parts';
import { StepRail } from '@/components/support/steps/step-rail';
import { clampStep, stepsFor, type Step } from '@/components/support/steps/flow';
import { supportApi, SupportApiError } from '@/components/support/support-api';
import { amountFits, carriableAmount, choiceCurrency, nameDir, spansMarkets, standingAmount, variantLabel } from '@/components/support/support-meta';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { handlesMoney, usableVariants } from '@/lib/support';
import { localizedCount } from '@/lib/utils';
import type { AppLocale, IDonation, SupportCheckoutResult, SupportVariant } from '@/types';
import { ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface SupportDialogProps {
  /** Every method the wizard can offer, in page order. */
  methods: IDonation[];
  /** The method the visitor came in on; `null` opens on the chooser. */
  option: IDonation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * An amount chosen before the dialog opened, through a shared link. When the
   * method accepts it, the wizard starts on the next step.
   */
  initialAmount?: number;
  /** Destination a shared link points at. */
  initialVariantKey?: string;
  /** The page owns the selection, so a switch inside the wizard is visible outside it. */
  onSelect: (option: IDonation, variantKey: string, amount: number) => void;
}

/**
 * The checkout wizard: a method, one of its destinations and an amount, the
 * supporter's details, then whatever the chosen method asks for.
 *
 * The flow belongs to the method, not to the wizard: a rail that moves money walks
 * `choose → details → payment`, a free gesture walks `choose → action` and never
 * reaches the checkout endpoint at all. Destinations are only ever read from the
 * method in `option`, so a supporter cannot be shown a page that belongs elsewhere.
 *
 * Steps move strictly top-to-bottom and the surface mirrors with CSS logical
 * utilities only, so the Persian layout needs no direction checks. Every money
 * decision belongs to the server: this component sends a candidate amount and
 * renders what comes back.
 */
export function SupportDialog({ methods, option, open, onOpenChange, initialAmount, initialVariantKey, onSelect }: SupportDialogProps) {
  const t = useTranslations('support');
  const td = useTranslations('support.dialog');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const [step, setStep] = useState<Step>('choose');
  const [amount, setAmount] = useState(0);
  const [variantKey, setVariantKey] = useState('');
  const [custom, setCustom] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [showOnWall, setShowOnWall] = useState(true);
  const [reference, setReference] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [result, setResult] = useState<SupportCheckoutResult | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Tells a fresh open apart from switching method inside an open dialog. */
  const opened = useRef(false);

  useEffect(() => () => void (copyTimer.current && clearTimeout(copyTimer.current)), []);

  const money = handlesMoney(option?.mode ?? 'platform');
  const flow = stepsFor(option?.mode);
  /** A method switch can land on a step the new flow does not have; fold it back. */
  const current = clampStep(step, flow);

  const destinations = useMemo(() => (option ? usableVariants(option) : []), [option]);

  /** The destination in view: the key the supporter picked, else the first one. */
  const variant: SupportVariant | undefined = useMemo(() => {
    if (!destinations.length) return undefined;
    return destinations.find(item => item.key === variantKey) ?? destinations[0];
  }, [destinations, variantKey]);

  const currency = option ? choiceCurrency({ option, variant }) : 'toman';

  /**
   * Every method has its own amount list and its own destinations, so a fresh open
   * starts on the right ones. Changing method while the wizard is open keeps what the
   * supporter typed: their name and note survive, the amount survives if the new
   * method accepts it in the same currency, and only the payment of the method they
   * left is dropped.
   */
  useEffect(() => {
    if (!open || !option) {
      opened.current = false;
      return;
    }

    const fresh = !opened.current;
    opened.current = true;

    const takesMoney = handlesMoney(option.mode);
    const list = usableVariants(option);
    const next = (fresh ? initialVariantKey : variantKey) || list[0]?.key || '';
    const picked = list.find(item => item.key === next) ?? list[0];
    const wanted = initialAmount && initialAmount > 0 ? initialAmount : standingAmount(option);
    const usable = takesMoney && amountFits(option, wanted);

    if (fresh) {
      setName('');
      setEmail('');
      setMessage('');
      setHoneypot('');
      setReference('');
      setAnonymous(false);
      setShowOnWall(true);
    }

    setVariantKey(picked?.key ?? '');
    setStep(fresh && usable && initialAmount ? 'details' : 'choose');
    setAmount(usable ? wanted : takesMoney ? standingAmount(option) : 0);
    setCustom(usable && initialAmount ? String(wanted) : '');
    setResult(null);
    setErrorCode(null);
    setBusy(false);
    setThanks(false);
    // `variantKey` is read only to survive a method switch; listing it would re-run
    // the sync on every pick and reset the step underneath the supporter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, option, initialAmount, initialVariantKey]);

  const quickAmounts = useMemo(() => {
    const values = option?.suggestedAmounts?.length ? option.suggestedAmounts : option && option.amount > 0 ? [option.amount] : [];
    return [...new Set(values.filter(value => value > 0))].sort((a, b) => a - b);
  }, [option]);

  /** Client-side mirror of the server's bounds; the server decides in the end. */
  const amountError = useMemo(() => {
    if (!option || !money) return null;
    if (amount <= 0) return td('amountRequired');
    if (option.minAmount > 0 && amount < option.minAmount) return td('errors.min');
    if (option.maxAmount > 0 && amount > option.maxAmount) return td('errors.max');
    if (!option.customAmount && !quickAmounts.includes(amount)) return td('errors.fixed');
    return null;
  }, [option, money, amount, quickAmounts, td]);

  /** The destination's own name, or the method's when it has no platform to name. */
  const destination = option ? variantLabel(variant, t) || t(`modes.${option.mode}`) : '';
  const ready = Boolean(option && variant && (!money || (amount > 0 && !amountError)));

  const copy = useCallback(
    async (key: string, value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopiedKey(key);
        if (copyTimer.current) clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopiedKey(null), 2000);
      } catch {
        // Insecure context or a denied permission: the text is still on screen.
        toast.error(td('copyFailed'));
      }
    },
    [td]
  );

  /** Moving to another method keeps the number only when the money still means the same. */
  const pickMethod = (next: IDonation) => {
    const list = usableVariants(next);
    const target = { option: next, variant: list[0] };
    // What the destination owes to the method being left, not the one being read:
    // a gesture has no number to carry, and a payment always starts somewhere.
    const kept = handlesMoney(next.mode) ? (option ? carriableAmount({ option, variant }, target, amount) : standingAmount(next)) : 0;

    setVariantKey(list[0]?.key ?? '');
    setAmount(kept);
    if (option) onSelect(next, list[0]?.key ?? '', kept);
  };

  const pickVariant = (next: SupportVariant) => {
    if (!option) return;
    const carried = money ? carriableAmount({ option, variant }, { option, variant: next }, amount) : 0;

    setVariantKey(next.key);
    setAmount(carried);
    onSelect(option, next.key, carried);
  };

  const startCheckout = async () => {
    if (!option?._id || !variant) return;
    setBusy(true);
    setErrorCode(null);

    try {
      const data = await supportApi.checkout(locale, {
        donationId: option._id,
        variantKey: variant.key,
        amount,
        name: anonymous ? '' : name.trim(),
        anonymous,
        email: email.trim(),
        message: message.trim(),
        showOnWall,
        company: honeypot,
      });

      setResult(data);
      setStep('method');

      // A gateway owns this one: hand the tab over and let it come back.
      if (data.kind === 'redirect') window.location.assign(data.url);
    } catch (error) {
      setErrorCode(error instanceof SupportApiError ? error.code : 'generic');
    } finally {
      setBusy(false);
    }
  };

  const declareSent = async () => {
    if (!result || result.kind !== 'instructions') return;
    setBusy(true);
    setErrorCode(null);

    try {
      await supportApi.confirm(locale, { orderId: result.orderId, reference: reference.trim() });
      setThanks(true);
    } catch (error) {
      setErrorCode(error instanceof SupportApiError ? error.code : 'generic');
    } finally {
      setBusy(false);
    }
  };

  const close = () => onOpenChange(false);
  const back = flow[flow.indexOf(current) - 1];

  return (
    <Dialog open={open} onOpenChange={next => (next ? onOpenChange(true) : close())}>
      {/* The wizard arrives from above and leaves the same way it came. */}
      <DialogContent className="sheet-from-top max-w-lg">
        {option && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-base">
                <span className="break-words" dir={nameDir(option.title)}>
                  {option.title}
                </span>
                {destination && destination !== t(`modes.${option.mode}`) && (
                  <span className="min-w-0 max-w-full truncate text-sm font-normal text-muted-foreground" dir={nameDir(destination)}>
                    {destination}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>
                {t(`modes.${option.mode}`)}
                <span aria-live="polite" className="sr-only">
                  {td('stepOf', { current: localizedCount(flow.indexOf(current) + 1, lang), total: localizedCount(flow.length, lang) })}
                </span>
              </DialogDescription>
            </DialogHeader>

            {/* Step rail: one mark per step of this method's flow, the reached ones solid. */}
            <StepRail steps={flow} current={current} />

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={thanks ? 'thanks' : `${current}-${result?.kind ?? 'form'}`}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-5"
              >
                {thanks ? (
                  <Thanks note={td('donePending')} onClose={close} />
                ) : current === 'choose' ? (
                  <ChooseStep
                    methods={methods}
                    option={option}
                    destinations={destinations}
                    variant={variant}
                    money={money}
                    mixedMarkets={spansMarkets(option)}
                    quickAmounts={quickAmounts}
                    amount={amount}
                    custom={custom}
                    showCustomField={Boolean(option.customAmount)}
                    currency={currency}
                    amountError={amountError}
                    onPickMethod={pickMethod}
                    onPickVariant={pickVariant}
                    onPickAmount={value => {
                      setAmount(value);
                      setCustom(value > 0 ? String(value) : '');
                    }}
                    onCustom={value => {
                      setCustom(value);
                      const parsed = Number(value.replace(/[^\d]/g, ''));
                      setAmount(Number.isFinite(parsed) ? parsed : 0);
                    }}
                  />
                ) : current === 'details' ? (
                  <DetailsStep
                    name={name}
                    onName={setName}
                    anonymous={anonymous}
                    onAnonymous={setAnonymous}
                    email={email}
                    onEmail={setEmail}
                    message={message}
                    onMessage={setMessage}
                    showOnWall={showOnWall}
                    onShowOnWall={setShowOnWall}
                    honeypot={honeypot}
                    onHoneypot={setHoneypot}
                    amount={amount}
                    currency={currency}
                    summary={{ method: option.title, destination }}
                  />
                ) : current === 'action' ? (
                  <ActionStep option={option} variant={variant} destination={destination} />
                ) : result ? (
                  <PaymentStep
                    variant={variant}
                    destination={destination}
                    result={result}
                    amount={amount}
                    currency={currency}
                    reference={reference}
                    onReference={setReference}
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                ) : null}

                {errorCode && !thanks && <ErrorNote message={td(`errors.${errorCode}`)} onRetry={() => setErrorCode(null)} />}
              </motion.div>
            </AnimatePresence>

            {/* Footer: the actions change with the step, the place never does. */}
            {!thanks && (
              <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between sm:pt-5">
                {current === 'method' && result?.kind === 'redirect' ? (
                  <span aria-hidden />
                ) : back ? (
                  <Button type="button" variant="ghost" onClick={() => setStep(back)} disabled={busy}>
                    {td('back')}
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" onClick={close}>
                    {td('close')}
                  </Button>
                )}

                {current === 'choose' && (
                  <Button type="button" onClick={() => setStep(money ? 'details' : 'action')} disabled={!ready} className="min-w-28">
                    {money ? td('continue') : td('seeSteps')}
                    <ArrowRight className="ms-2 size-4 rtl:-scale-x-100" aria-hidden />
                  </Button>
                )}

                {current === 'details' && (
                  <Button type="button" onClick={startCheckout} disabled={busy || !option._id || !variant} className="min-w-36">
                    {busy ? <Loader2 className="me-2 size-4 animate-spin" aria-hidden /> : null}
                    {/* The label follows the method: an on-site payment leaves this tab,
                        a transfer only needs the details to be shown. */}
                    {busy
                      ? td('sending')
                      : option.mode === 'card' || option.mode === 'crypto'
                        ? td('paymentDetails')
                        : td('leaveSite', { provider: destination })}
                  </Button>
                )}

                {current === 'method' && result?.kind === 'instructions' && (
                  <Button type="button" onClick={declareSent} disabled={busy}>
                    {busy ? <Loader2 className="me-2 size-4 animate-spin" aria-hidden /> : null}
                    {busy ? td('declaring') : td('declare')}
                  </Button>
                )}

                {current === 'method' && result?.kind === 'external' && (
                  // The only way out is the destination itself: an explicit link,
                  // opened by the supporter's own click, never a surprise popup.
                  <Button asChild className="min-w-36">
                    <a href={result.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="me-2 size-4" aria-hidden />
                      {td('leaveSite', { provider: destination })}
                    </a>
                  </Button>
                )}

                {current === 'action' && variant?.href && (
                  <Button asChild className="min-w-36">
                    <a href={variant.href} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="me-2 size-4" aria-hidden />
                      {td('openPage', { provider: destination })}
                    </a>
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
