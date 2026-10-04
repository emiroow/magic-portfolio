'use client';

import { CupRow } from '@/components/support/coffee-mark';
import { destinationKey, groupCardNumber, groupIban, shortenAddress } from '@/components/support/support-meta';
import { supportApi, SupportApiError } from '@/components/support/support-api';
import { PriceTag } from '@/components/products/price-tag';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SUPPORTER_MESSAGE_LIMIT } from '@/constants/global';
import { cn, formatPrice } from '@/lib/utils';
import type { IDonation, SupportCheckoutResult } from '@/types';
import { AlertTriangle, ArrowRight, Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface SupportDialogProps {
  option: IDonation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The three stops of the flow; `method` renders whatever the rail needs. */
type Step = 'amount' | 'details' | 'method';

const STEPS: Step[] = ['amount', 'details', 'method'];

/**
 * The checkout dialog: an amount, a note, then whatever the chosen rail asks for.
 *
 * Steps move strictly bottom-to-top and the surface mirrors with CSS logical
 * utilities only, so the Persian layout needs no direction checks. Every money
 * decision belongs to the server: this component sends a candidate amount and
 * renders what comes back.
 */
export function SupportDialog({ option, open, onOpenChange }: SupportDialogProps) {
  const t = useTranslations('support');
  const td = useTranslations('support.dialog');
  const locale = useLocale();

  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState(0);
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

  useEffect(() => () => void (copyTimer.current && clearTimeout(copyTimer.current)), []);

  /** Every option has its own amount list; a fresh dialog starts on the right one. */
  useEffect(() => {
    if (!open || !option) return;
    setStep('amount');
    setAmount(option.amount > 0 ? option.amount : (option.suggestedAmounts[0] ?? 0));
    setCustom('');
    setAnonymous(false);
    setShowOnWall(true);
    setReference('');
    setHoneypot('');
    setResult(null);
    setErrorCode(null);
    setBusy(false);
    setThanks(false);
  }, [open, option]);

  const quickAmounts = useMemo(() => {
    const values = option?.suggestedAmounts?.length ? option.suggestedAmounts : option && option.amount > 0 ? [option.amount] : [];
    return [...new Set(values.filter(value => value > 0))].sort((a, b) => a - b);
  }, [option]);

  const canPickAmount = Boolean(option?.customAmount);
  const showCustomField = canPickAmount;

  /** Client-side mirror of the server's bounds; the server decides in the end. */
  const amountError = useMemo(() => {
    if (!option || amount <= 0) return td('amountRequired');
    if (option.minAmount > 0 && amount < option.minAmount) return td('errors.min');
    if (option.maxAmount > 0 && amount > option.maxAmount) return td('errors.max');
    if (!option.customAmount && !quickAmounts.includes(amount)) return td('errors.fixed');
    return null;
  }, [option, amount, quickAmounts, td]);

  const destination = option ? t(`providers.${destinationKey(option) ?? 'other'}`) : '';
  const modeLabel = option ? t(`modes.${option.mode}`) : '';

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

  const startCheckout = async () => {
    if (!option) return;
    setBusy(true);
    setErrorCode(null);

    try {
      const data = await supportApi.checkout(locale, {
        donationId: option._id,
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
      <DialogContent className="max-w-md">
        {option && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5">
                {option.title}
                <CupRow count={option.cups} className="ms-1" />
              </DialogTitle>
              <DialogDescription>
                {modeLabel}
                {destination && (
                  <>
                    <span aria-hidden className="mx-1.5">
                      ·
                    </span>
                    <span dir="auto">{destination}</span>
                  </>
                )}
                <span aria-live="polite" className="sr-only">
                  {td('stepOf', { current: STEPS.indexOf(step) + 1, total: STEPS.length })}
                </span>
              </DialogDescription>
            </DialogHeader>

            {/* Step rail: three hairline marks, the current one solid. */}
            <div aria-hidden className="flex items-center gap-1.5">
              {STEPS.map(item => (
                <span
                  key={item}
                  className={cn('h-0.5 flex-1 rounded-full transition-colors', STEPS.indexOf(step) >= STEPS.indexOf(item) ? 'bg-foreground' : 'bg-border')}
                />
              ))}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={thanks ? 'thanks' : `${step}-${result?.kind ?? 'form'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-5"
              >
                {thanks ? (
                  <Thanks onClose={close} />
                ) : step === 'amount' ? (
                  <AmountStep
                    option={option}
                    quickAmounts={quickAmounts}
                    amount={amount}
                    onPick={setAmount}
                    custom={custom}
                    onCustom={value => {
                      setCustom(value);
                      const parsed = Number(value.replace(/[^\d]/g, ''));
                      setAmount(Number.isFinite(parsed) ? parsed : 0);
                    }}
                    showCustomField={showCustomField}
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
                    currency={option.currency}
                  />
                ) : result ? (
                  <MethodStep
                    option={option}
                    result={result}
                    destination={destination}
                    amount={amount}
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
                  <Button type="button" variant="ghost" onClick={() => setStep(step === 'method' ? 'details' : 'amount')} disabled={busy}>
                    {td('back')}
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" onClick={close}>
                    {td('close')}
                  </Button>
                )}

                {step === 'amount' && (
                  <Button type="button" onClick={() => setStep('details')} disabled={Boolean(amountError)} className="min-w-28">
                    {td('continue')}
                    <ArrowRight className="ms-2 size-4 rtl:-scale-x-100" aria-hidden />
                  </Button>
                )}

                {step === 'details' && (
                  <Button type="button" onClick={startCheckout} disabled={busy || !option._id} className="min-w-36">
                    {busy ? <Loader2 className="me-2 size-4 animate-spin" aria-hidden /> : null}
                    {busy ? td('sending') : option.mode === 'referral' || option.mode === 'link' ? td('leaveSite', { provider: destination }) : td('send')}
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

function AmountStep({
  option,
  quickAmounts,
  amount,
  onPick,
  custom,
  onCustom,
  showCustomField,
  amountError,
}: {
  option: IDonation;
  quickAmounts: number[];
  amount: number;
  onPick: (value: number) => void;
  custom: string;
  onCustom: (value: string) => void;
  showCustomField: boolean;
  amountError: string | null;
}) {
  const td = useTranslations('support.dialog');
  const tp = useTranslations('pricing');
  const locale = useLocale();
  const lang = locale === 'fa' ? 'fa' : 'en';

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{td('total')}</p>
        <PriceTag amount={amount} currency={option.currency} className="text-lg font-bold" />
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
              <span className="text-[0.75em] opacity-70">{tp(option.currency)}</span>
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
              value={custom}
              onChange={event => onCustom(event.target.value)}
              aria-invalid={Boolean(amountError)}
            />
            <span className="shrink-0 text-xs text-muted-foreground">{tp(option.currency)}</span>
          </span>
        </label>
      )}

      {(option.minAmount > 0 || option.maxAmount > 0) && (
        <p className="text-xs text-muted-foreground/80">
          {option.minAmount > 0 && td('min', { amount: `${formatPrice(option.minAmount, lang)} ${tp(option.currency)}` })}
          {option.minAmount > 0 && option.maxAmount > 0 && ' · '}
          {option.maxAmount > 0 && td('max', { amount: `${formatPrice(option.maxAmount, lang)} ${tp(option.currency)}` })}
        </p>
      )}

      {amountError && (
        <p role="alert" className="text-xs text-destructive">
          {amountError}
        </p>
      )}
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

      <Toggle label={td('anonymous')} checked={anonymous} onChange={value => {
        onAnonymous(value);
        if (value) onName('');
      }} />

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
      <input
        type="text"
        value={honeypot}
        onChange={event => onHoneypot(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="sr-only size-px"
      />
    </div>
  );
}

function MethodStep({
  option,
  result,
  destination,
  amount,
  onCopy,
  copiedKey,
  reference,
  onReference,
}: {
  option: IDonation;
  result: SupportCheckoutResult;
  destination: string;
  amount: number;
  onCopy: (key: string, value: string) => void;
  copiedKey: string | null;
  reference: string;
  onReference: (value: string) => void;
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
        <SummaryLine label={td('total')} amount={amount} currency={option.currency} />
        <p className="text-sm leading-relaxed text-muted-foreground">
          {option.mode === 'link' ? t('modeNotes.link', { provider: destination }) : t('modeNotes.referral', { provider: destination })}
        </p>
        <p className="text-xs text-muted-foreground/80">{td('doneExternal')}</p>
        <p className="text-xs text-muted-foreground/80">{t('trust.monochrome')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SummaryLine label={td('total')} amount={amount} currency={option.currency} />

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
          {result.crypto?.network && (
            <p className="text-xs">
              <span className="text-muted-foreground">{td('network')}</span>
              <span className="ms-2 font-medium">{t(`networks.${result.crypto.network}`)}</span>
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
