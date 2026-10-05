'use client';

import { MODE_ICONS, amountFits, carriableAmount, choiceCurrency, choiceRegion, groupCardNumber, groupIban, nameDir, shortenAddress, spansMarkets, standingAmount, variantDetail, variantLabel } from '@/components/support/support-meta';
import { ChoiceTile } from '@/components/support/support-tile';
import { supportApi, SupportApiError } from '@/components/support/support-api';
import { PriceTag } from '@/components/products/price-tag';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SUPPORTER_MESSAGE_LIMIT } from '@/constants/global';
import { cn, documentKey, formatPrice } from '@/lib/utils';
import { usableVariants, variantCurrency } from '@/lib/support';
import type { AppLocale, CryptoNetwork, IDonation, SupportCheckoutResult, SupportVariant } from '@/types';
import { AlertTriangle, ArrowRight, Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
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

/** The three stops of the flow; the last one renders whatever the method needs. */
type Step = 'choose' | 'details' | 'method';

const STEPS: Step[] = ['choose', 'details', 'method'];

/**
 * The checkout wizard: a method, a destination and an amount, a note, then whatever
 * the chosen method asks for.
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

  const destinations = useMemo(() => (option ? usableVariants(option) : []), [option]);

  /** The destination in view: the key the supporter picked, else the first one. */
  const variant: SupportVariant | undefined = useMemo(() => {
    if (!destinations.length) return undefined;
    return destinations.find(item => item.key === variantKey) ?? destinations[0];
  }, [destinations, variantKey]);

  const currency = option ? choiceCurrency({ option, variant }) : 'toman';

  /**
   * Every method has its own amount list, so a fresh dialog starts on the right
   * one. Changing method while the dialog is open keeps what the supporter typed:
   * their name and note survive, the amount survives if the new method accepts it
   * in the same currency, and only the payment of the method they left is dropped.
   */
  useEffect(() => {
    if (!open || !option) {
      opened.current = false;
      return;
    }

    const fresh = !opened.current;
    opened.current = true;

    const list = usableVariants(option);
    const next = (fresh ? initialVariantKey : variantKey) || list[0]?.key || '';
    const picked = list.find(item => item.key === next) ?? list[0];
    const wanted = initialAmount && initialAmount > 0 ? initialAmount : standingAmount(option);
    const usable = amountFits(option, wanted);

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
    setAmount(usable ? wanted : standingAmount(option));
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

  const canPickAmount = Boolean(option?.customAmount);

  /** Client-side mirror of the server's bounds; the server decides in the end. */
  const amountError = useMemo(() => {
    if (!option) return td('methodRequired');
    if (amount <= 0) return td('amountRequired');
    if (option.minAmount > 0 && amount < option.minAmount) return td('errors.min');
    if (option.maxAmount > 0 && amount > option.maxAmount) return td('errors.max');
    if (!option.customAmount && !quickAmounts.includes(amount)) return td('errors.fixed');
    return null;
  }, [option, amount, quickAmounts, td]);

  /** The destination's own name, or the method's when it has no platform to name. */
  const destination = option ? variantLabel(variant, t) || t(`modes.${option.mode}`) : '';
  const ready = Boolean(option && variant && amount > 0 && !amountError);

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
    const kept = option ? carriableAmount({ option, variant }, target, amount) : standingAmount(next);

    setVariantKey(list[0]?.key ?? '');
    setAmount(kept);
    if (option) onSelect(next, list[0]?.key ?? '', kept);
  };

  const pickVariant = (next: SupportVariant) => {
    if (!option) return;
    const carried = carriableAmount({ option, variant }, { option, variant: next }, amount);

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

  return (
    <Dialog open={open} onOpenChange={next => (next ? onOpenChange(true) : close())}>
      {/* The wizard arrives from above and leaves the same way it came. */}
      <DialogContent className="sheet-from-top max-w-md">
        {option && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-base">
                <span className="break-words" dir={nameDir(option.title)}>
                  {option.title}
                </span>
                {destination && destination !== t(`modes.${option.mode}`) && (
                  <span className="min-w-0 truncate text-sm font-normal text-muted-foreground" dir={nameDir(destination)}>
                    {destination}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>
                {t(`modes.${option.mode}`)}
                <span aria-live="polite" className="sr-only">
                  {td('stepOf', { current: STEPS.indexOf(step) + 1, total: STEPS.length })}
                </span>
              </DialogDescription>
            </DialogHeader>

            {/* Step rail: three marks with their names, the reached ones solid. */}
            <ol aria-hidden className="flex items-end gap-2">
              {STEPS.map((item, index) => {
                const reached = STEPS.indexOf(step) >= index;

                return (
                  <li key={item} className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className={cn('h-0.5 rounded-full transition-colors', reached ? 'bg-foreground' : 'bg-border')} />
                    <span className={cn('truncate text-[10px] font-medium transition-colors', reached ? 'text-foreground' : 'text-muted-foreground')}>
                      {td(`steps.${item}`)}
                    </span>
                  </li>
                );
              })}
            </ol>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={thanks ? 'thanks' : `${step}-${result?.kind ?? 'form'}`}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-5"
              >
                {thanks ? (
                  <Thanks onClose={close} />
                ) : step === 'choose' ? (
                  <ChooseStep
                    methods={methods}
                    option={option}
                    destinations={destinations}
                    variant={variant}
                    mixedMarkets={spansMarkets(option)}
                    onPickMethod={pickMethod}
                    onPickVariant={pickVariant}
                    quickAmounts={quickAmounts}
                    amount={amount}
                    onPick={value => {
                      setAmount(value);
                      setCustom(value > 0 ? String(value) : '');
                    }}
                    custom={custom}
                    onCustom={value => {
                      setCustom(value);
                      const parsed = Number(value.replace(/[^\d]/g, ''));
                      setAmount(Number.isFinite(parsed) ? parsed : 0);
                    }}
                    showCustomField={canPickAmount}
                    currency={currency}
                    amountError={amountError}
                  />
                ) : step === 'details' ? (
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
                  />
                ) : result ? (
                  <MethodStep
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
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                {result?.kind === 'redirect' ? (
                  <span aria-hidden />
                ) : step === 'method' || step === 'details' ? (
                  <Button type="button" variant="ghost" onClick={() => setStep(step === 'method' ? 'details' : 'choose')} disabled={busy}>
                    {td('back')}
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" onClick={close}>
                    {td('close')}
                  </Button>
                )}

                {step === 'choose' && (
                  <Button type="button" onClick={() => setStep('details')} disabled={!ready} className="min-w-28">
                    {td('continue')}
                    <ArrowRight className="ms-2 size-4 rtl:-scale-x-100" aria-hidden />
                  </Button>
                )}

                {step === 'details' && (
                  <Button type="button" onClick={startCheckout} disabled={busy || !option._id || !variant} className="min-w-36">
                    {busy ? <Loader2 className="me-2 size-4 animate-spin" aria-hidden /> : null}
                    {/* The label follows the method: an on-site payment leaves this tab,
                        a transfer only needs the details to be shown. */}
                    {busy ? td('sending') : option.mode === 'card' || option.mode === 'crypto' ? td('paymentDetails') : td('leaveSite', { provider: destination })}
                  </Button>
                )}

                {step === 'method' && result?.kind === 'instructions' && (
                  <Button type="button" onClick={declareSent} disabled={busy}>
                    {busy ? <Loader2 className="me-2 size-4 animate-spin" aria-hidden /> : null}
                    {busy ? td('declaring') : td('declare')}
                  </Button>
                )}

                {step === 'method' && result?.kind === 'external' && (
                  // The only way out is the destination itself: an explicit link,
                  // opened by the supporter's own click, never a surprise popup.
                  <Button asChild className="min-w-36">
                    <a href={result.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="me-2 size-4" aria-hidden />
                      {td('leaveSite', { provider: destination })}
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

/* --------------------------------- steps ---------------------------------- */

function ChooseStep({
  methods,
  option,
  destinations,
  variant,
  mixedMarkets,
  onPickMethod,
  onPickVariant,
  quickAmounts,
  amount,
  onPick,
  custom,
  onCustom,
  showCustomField,
  currency,
  amountError,
}: {
  methods: IDonation[];
  option: IDonation;
  destinations: SupportVariant[];
  variant?: SupportVariant;
  /** The destinations span both markets, so each tile has to say which is whose. */
  mixedMarkets: boolean;
  onPickMethod: (option: IDonation) => void;
  onPickVariant: (variant: SupportVariant) => void;
  quickAmounts: number[];
  amount: number;
  onPick: (value: number) => void;
  custom: string;
  onCustom: (value: string) => void;
  showCustomField: boolean;
  currency: IDonation['currency'];
  amountError: string | null;
}) {
  const t = useTranslations('support');
  const td = useTranslations('support.dialog');
  const tp = useTranslations('pricing');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  /** The words that follow a name: what it holds, in which unit, in which market. */
  const join = (parts: (string | undefined)[]) => parts.filter(Boolean).join(' · ');

  return (
    <div className="space-y-5">
      {/* 1 — the way the money travels. Hidden when there is only one to choose from. */}
      {methods.length > 1 && (
        <fieldset className="space-y-2.5 border-0 p-0">
          <legend className="mb-2.5 text-xs font-medium text-muted-foreground">{td('chooseMethod')}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {methods.map(method => {
              const Icon = MODE_ICONS[method.mode];
              const modeLabel = t(`modes.${method.mode}`);
              // A method named after its own kind needs no second line saying so.
              const detail = join([method.title.trim() === modeLabel ? '' : modeLabel, tp(method.currency)]);

              return (
                <ChoiceTile
                  key={method._id ?? method.slug ?? method.title}
                  group="support-method"
                  value={documentKey(method)}
                  label={method.title}
                  detail={detail}
                  icon={Icon}
                  checked={method._id === option._id}
                  onChange={() => onPickMethod(method)}
                />
              );
            })}
          </div>
        </fieldset>
      )}

      {/* 2 — where it lands. A method with one destination simply says so. */}
      {destinations.length > 1 && (
        <fieldset className="space-y-2.5 border-0 p-0">
          <legend className="mb-2.5 text-xs font-medium text-muted-foreground">{td('chooseDestination')}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {destinations.map(item => {
              const detail = variantDetail(item);
              // The digits or the host become the name when the owner gave none.
              const label = variantLabel(item, t) || detail || item.key;
              const region = mixedMarkets ? t(`regions.${choiceRegion({ option, variant: item })}`) : '';

              return (
                <ChoiceTile
                  key={item.key}
                  group="support-destination"
                  value={item.key}
                  label={label}
                  detail={join([label === detail ? '' : detail, tp(variantCurrency(option, item)), region])}
                  checked={item.key === variant?.key}
                  onChange={() => onPickVariant(item)}
                />
              );
            })}
          </div>
        </fieldset>
      )}

      {destinations.length === 1 && (
        <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
          <span className="font-medium">{td('destination')}</span>
          <span className="text-foreground" dir={nameDir(variantLabel(variant, t) || variantDetail(variant) || option.title)}>
            {variantLabel(variant, t) || variantDetail(variant) || option.title}
          </span>
          <span className="opacity-80">{tp(variantCurrency(option, variant))}</span>
        </p>
      )}

      {/* 3 — how much. */}
      <div className="space-y-4 border-t pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">{td('total')}</p>
          <PriceTag amount={amount} currency={currency} className="text-lg font-bold" />
        </div>

        {quickAmounts.length > 0 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={td('quickPick')}>
            {quickAmounts.map(value => (
              <button
                key={value}
                type="button"
                aria-pressed={amount === value}
                onClick={() => onPick(value)}
                className={cn(
                  'inline-flex shrink-0 items-baseline gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  amount === value ? 'border-foreground bg-foreground text-background' : 'text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                )}
              >
                <bdi dir="ltr">{formatPrice(value, lang)}</bdi>
                <span className="text-[0.75em] opacity-70">{tp(currency)}</span>
              </button>
            ))}
          </div>
        )}

        {showCustomField && (
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">{td('customAmount')}</span>
            <span className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                dir="ltr"
                className="tabular-nums"
                placeholder={t('flexible.customPlaceholder')}
                value={custom}
                onChange={event => onCustom(event.target.value)}
                aria-invalid={Boolean(amountError)}
              />
              <span className="shrink-0 text-xs text-muted-foreground">{tp(currency)}</span>
            </span>
          </label>
        )}

        {(option.minAmount > 0 || option.maxAmount > 0) && (
          <p className="text-xs text-muted-foreground/80">
            {option.minAmount > 0 && td('min', { amount: `${formatPrice(option.minAmount, lang)} ${tp(currency)}` })}
            {option.minAmount > 0 && option.maxAmount > 0 && ' · '}
            {option.maxAmount > 0 && td('max', { amount: `${formatPrice(option.maxAmount, lang)} ${tp(currency)}` })}
          </p>
        )}

        {amountError && (
          <p role="alert" className="text-xs text-destructive">
            {amountError}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailsStep({
  name,
  onName,
  anonymous,
  onAnonymous,
  email,
  onEmail,
  message,
  onMessage,
  showOnWall,
  onShowOnWall,
  honeypot,
  onHoneypot,
  amount,
  currency,
}: {
  name: string;
  onName: (value: string) => void;
  anonymous: boolean;
  onAnonymous: (value: boolean) => void;
  email: string;
  onEmail: (value: string) => void;
  message: string;
  onMessage: (value: string) => void;
  showOnWall: boolean;
  onShowOnWall: (value: boolean) => void;
  honeypot: string;
  onHoneypot: (value: string) => void;
  amount: number;
  currency: IDonation['currency'];
}) {
  const td = useTranslations('support.dialog');

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 border-b pb-3">
        <p className="text-xs font-medium text-muted-foreground">{td('total')}</p>
        <PriceTag amount={amount} currency={currency} className="text-sm font-semibold" />
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">{td('nameLabel')}</span>
        <Input value={name} onChange={event => onName(event.target.value)} placeholder={td('namePlaceholder')} maxLength={60} disabled={anonymous} dir="auto" />
      </label>

      <Toggle
        label={td('anonymous')}
        checked={anonymous}
        onChange={value => {
          onAnonymous(value);
          if (value) onName('');
        }}
      />

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">{td('emailLabel')}</span>
        <Input type="email" value={email} onChange={event => onEmail(event.target.value)} placeholder={td('emailPlaceholder')} dir="ltr" autoComplete="email" />
        <span className="text-xs text-muted-foreground/80">{td('emailHint')}</span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="flex items-baseline justify-between gap-2 text-xs font-medium text-muted-foreground">
          {td('messageLabel')}
          <span className="tabular-nums opacity-70">{td('messageCount', { count: message.length, max: SUPPORTER_MESSAGE_LIMIT })}</span>
        </span>
        <Textarea
          rows={3}
          value={message}
          onChange={event => onMessage(event.target.value.slice(0, SUPPORTER_MESSAGE_LIMIT))}
          placeholder={td('messagePlaceholder')}
          dir="auto"
        />
      </label>

      <div className="space-y-1">
        <Toggle label={td('wallLabel')} checked={showOnWall} onChange={onShowOnWall} />
        <p className="text-xs text-muted-foreground/80">{td('wallHint')}</p>
      </div>

      {/* Honeypot: hidden from people, tempting for scripts. Filled fields are
          dropped by the server without telling the caller. */}
      <input type="text" value={honeypot} onChange={event => onHoneypot(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="sr-only size-px" />
    </div>
  );
}

function MethodStep({
  variant,
  destination,
  result,
  amount,
  currency,
  reference,
  onReference,
  copiedKey,
  onCopy,
}: {
  variant?: SupportVariant;
  /** Name of what the supporter is paying into, spoken in the page's language. */
  destination: string;
  result: SupportCheckoutResult;
  amount: number;
  currency: IDonation['currency'];
  reference: string;
  onReference: (value: string) => void;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
}) {
  const t = useTranslations('support');
  const td = useTranslations('support.dialog');

  if (result.kind === 'redirect') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">{td('doneRedirect', { provider: destination })}</p>
        <p className="text-xs text-muted-foreground">{t('modeNotes.gateway', { provider: destination })}</p>
      </div>
    );
  }

  if (result.kind === 'external') {
    return (
      <div className="space-y-4">
        <SummaryLine label={td('total')} amount={amount} currency={currency} />
        <p className="text-sm leading-relaxed text-muted-foreground">{t('modeNotes.platform', { provider: destination })}</p>
        <p className="text-xs text-muted-foreground/80">{td('doneExternal')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SummaryLine label={td('total')} amount={amount} currency={currency} />

      {result.instruction === 'card' ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">{td('cardTitle')}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{t('modeNotes.card')}</p>
          <div className="grid gap-2">
            {result.card?.number && (
              <CopyRow
                copyKey="card"
                label={td('cardNumber')}
                value={groupCardNumber(result.card.number)}
                raw={result.card.number}
                onCopy={onCopy}
                copied={copiedKey === 'card'}
              />
            )}
            {result.card?.iban && (
              <CopyRow
                copyKey="iban"
                label={td('iban')}
                value={groupIban(result.card.iban)}
                raw={result.card.iban}
                onCopy={onCopy}
                copied={copiedKey === 'iban'}
              />
            )}
            {result.card?.holder && (
              <p className="text-xs text-muted-foreground">
                {td('cardHolder')}
                <span className="ms-2 text-foreground" dir="auto">
                  {result.card.holder}
                </span>
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium">{td('cryptoTitle')}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{t('modeNotes.crypto')}</p>
          {variantLabel(variant, t) && (
            <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
              <span className="text-muted-foreground">{td('asset')}</span>
              <span className="font-medium" dir="auto">
                {variantLabel(variant, t)}
              </span>
            </p>
          )}
          {result.crypto?.network && (
            <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
              <span className="text-muted-foreground">{td('network')}</span>
              <NetworkName network={result.crypto.network} />
            </p>
          )}
          {result.crypto?.address && (
            <CopyRow
              copyKey="address"
              label={td('cryptoTitle')}
              value={shortenAddress(result.crypto.address)}
              raw={result.crypto.address}
              onCopy={onCopy}
              copied={copiedKey === 'address'}
            />
          )}
          <p role="alert" className="text-xs text-destructive">
            {td('networkWarning')}
          </p>
        </div>
      )}

      {result.qr && (
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.qr}
            alt={result.instruction === 'card' ? td('qrCard') : td('qrCrypto')}
            width={208}
            height={208}
            className="size-52 rounded-xl border bg-white p-2"
          />
        </div>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">{td('referenceLabel')}</span>
        <Input value={reference} onChange={event => onReference(event.target.value)} placeholder={td('referencePlaceholder')} maxLength={120} dir="auto" />
        <span className="text-xs text-muted-foreground/80">{td('referenceHint')}</span>
      </label>
    </div>
  );
}

function Thanks({ onClose }: { onClose: () => void }) {
  const t = useTranslations('support');
  const td = useTranslations('support.dialog');

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <span aria-hidden className="flex size-11 items-center justify-center rounded-full border">
        <Check className="size-5" />
      </span>
      <p className="text-base font-semibold">{td('doneTitle')}</p>
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{td('donePending')}</p>
      <p className="text-xs text-muted-foreground/80">{t('trust.private')}</p>
      <Button type="button" variant="outline" className="mt-1 rounded-full" onClick={onClose}>
        {td('close')}
      </Button>
    </div>
  );
}

/* ------------------------------- primitives ------------------------------- */

/**
 * A network written in both scripts, e.g. `ترون · TRON (TRC-20)`.
 *
 * The Latin half is pinned to its own direction: parentheses inside a Persian
 * line otherwise mirror, and a mirrored network name is exactly the kind of
 * ambiguity that sends money to the wrong chain.
 */
function NetworkName({ network }: { network: CryptoNetwork }) {
  const t = useTranslations('support');
  const [native, ...latin] = t(`networks.${network}`).split(' · ');

  return (
    <span className="flex flex-wrap items-baseline gap-x-1.5 font-medium">
      <span>{native}</span>
      {latin.map(part => (
        <span key={part} dir="ltr" className="inline-flex items-baseline gap-1.5">
          <span aria-hidden className="opacity-50">
            ·
          </span>
          {part}
        </span>
      ))}
    </span>
  );
}

/** The amount, spelled out in the unit it is actually held in. */
function SummaryLine({ label, amount, currency }: { label: string; amount: number; currency: IDonation['currency'] }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <PriceTag amount={amount} currency={currency} className="text-sm font-semibold" />
    </div>
  );
}

function CopyRow({
  copyKey,
  label,
  value,
  raw,
  onCopy,
  copied,
}: {
  /** Which row is copied, so only its own mark flips to a check. */
  copyKey: string;
  label: string;
  value: string;
  raw: string;
  onCopy: (key: string, value: string) => void;
  copied: boolean;
}) {
  const td = useTranslations('support.dialog');

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {/* Numbers and addresses are LTR runs: mirroring them breaks their grouping. */}
        <bdi dir="ltr" className="min-w-0 flex-1 truncate rounded-lg border bg-muted/30 px-3 py-2 text-sm tabular-nums ltr:font-mono">
          {value}
        </bdi>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          onClick={() => onCopy(copyKey, raw)}
          aria-label={`${td('copy')}: ${value}`}
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        </Button>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg border border-input px-3 py-2 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring/40">
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="size-4 shrink-0 rounded border-input accent-primary" />
      <span className="text-sm leading-none">{label}</span>
    </label>
  );
}

function ErrorNote({ message, onRetry }: { message: string; onRetry: () => void }) {
  const td = useTranslations('support.dialog');

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/40 px-3 py-2.5">
      <span className="flex min-w-0 items-center gap-2 text-xs text-destructive">
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0">{message}</span>
      </span>
      <button type="button" onClick={onRetry} className="text-xs font-medium underline underline-offset-4 transition-opacity hover:opacity-70">
        {td('errorRetry')}
      </button>
    </div>
  );
}
