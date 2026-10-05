'use client';

import { clampStep, stepsFor, type Step } from '@/features/support/steps/flow';
import { supportApi, SupportApiError } from '@/features/support/support-api';
import { amountFits, carriableAmount, choiceCurrency, standingAmount, variantDetail, variantLabel } from '@/features/support/support-meta';
import { handlesMoney, usableVariants } from '@/features/support/variants';
import type { IDonation, SupportCheckoutResult, SupportVariant } from '@/features/support/types';
import type { ProductCurrency } from '@/types';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * What the footer's primary button is at this moment.
 *
 * The footer never asks which step it is on: the wizard says what can be done, and
 * the surface draws it. That keeps the wording, the disabled state and the action in
 * one place instead of spread across a chain of conditionals.
 */
export type PrimaryAction =
  /** Move on from the choice step, or start the payment once the details are in. */
  | { kind: 'next' }
  /** Ask the server to record the gift and show what the rail wants next. */
  | { kind: 'checkout'; label: string }
  /** The transfer is on screen: declare it sent so the owner can confirm it. */
  | { kind: 'declare' }
  /** Leave this tab for the destination the supporter chose. */
  | { kind: 'link'; href: string; label: string }
  /** A gateway owns the tab now: nothing to press. */
  | { kind: 'wait' }
  /** Nothing to do: the window is showing a result that ends here. */
  | { kind: 'none' };

/** What the supporter says about themselves, kept together because it travels together. */
export interface WizardDetails {
  name: string;
  email: string;
  message: string;
  reference: string;
  anonymous: boolean;
  showOnWall: boolean;
  /** Hidden from people, tempting for scripts; a filled one is dropped by the server. */
  honeypot: string;
}

const EMPTY_DETAILS: WizardDetails = { name: '', email: '', message: '', reference: '', anonymous: false, showOnWall: true, honeypot: '' };

interface UseSupportWizard {
  /** The method the window was opened on. */
  option: IDonation;
  /** Called whenever the supporter's decision changes, so the page can keep up. */
  onSelect: (option: IDonation, variantKey: string, amount: number) => void;
  /** Amount carried in by a shared link. */
  initialAmount?: number;
  /** Destination carried in by a shared link. */
  initialVariantKey?: string;
}

/**
 * The state of one support window: the decision (method, destination, amount), the
 * supporter's details, and whatever the rails hand back.
 *
 * The window mounts on its method, so being mounted is what “a fresh open” means;
 * switching method inside an open window is the case that must not start over.
 *
 * Two rules hold it together. The first is that a method's own conditions decide the
 * flow — money walks `choose → details → payment`, a free gesture walks
 * `choose → action` and never reaches the checkout endpoint. The second is that no
 * money decision is made here: the wizard sends a candidate amount and renders what
 * the server says, so a hand-edited request can never be charged a different sum.
 */
export function useSupportWizard({ option, onSelect, initialAmount, initialVariantKey }: UseSupportWizard) {
  const t = useTranslations('support');
  const td = useTranslations('support.dialog');
  const locale = useLocale();

  const [step, setStep] = useState<Step>('choose');
  const [amount, setAmount] = useState(0);
  const [variantKey, setVariantKey] = useState('');
  const [custom, setCustom] = useState('');
  const [details, setDetails] = useState<WizardDetails>(EMPTY_DETAILS);
  const [result, setResult] = useState<SupportCheckoutResult | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  /**
   * Whether the supporter has had a say about the amount yet. A window that opens on
   * a method with no standing amount has nothing to complain about before they do.
   */
  const [touched, setTouched] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Tells a fresh open apart from switching method inside an open window. */
  const opened = useRef(false);

  useEffect(() => () => void (copyTimer.current && clearTimeout(copyTimer.current)), []);

  const money = handlesMoney(option.mode);
  const flow = stepsFor(option.mode);
  /** A method switch can land on a step the new flow does not have; fold it back. */
  const current = clampStep(step, flow);

  /** Only the destinations of this method; nothing else can ever be listed here. */
  const destinations = useMemo(() => usableVariants(option), [option]);

  /** The destination in view: the key the supporter picked, else the first one. */
  const variant: SupportVariant | undefined = useMemo(
    () => (destinations.length ? (destinations.find(item => item.key === variantKey) ?? destinations[0]) : undefined),
    [destinations, variantKey]
  );

  const currency: ProductCurrency = choiceCurrency({ option, variant });
  /** The destination's own name, or the method's when it has no platform to name. */
  const destination = variantLabel(variant, t) || t(`modes.${option.mode}`);
  /**
   * What a button that leaves this tab should be named for. A payment hands off to a
   * service the supporter recognises (Buy Me a Coffee); a gesture is named by its own
   * label, which would read oddly in front of “Open”, so the host is used instead.
   */
  const outbound = variantDetail(variant) || destination;

  /**
   * Every method has its own amount list and its own destinations, so a fresh open
   * starts on the right ones. Changing method while the window is open keeps what the
   * supporter typed: their name and note survive, the amount survives if the new
   * method accepts it in the same currency, and only the payment of the method they
   * left is dropped.
   */
  useEffect(() => {
    const fresh = !opened.current;
    opened.current = true;

    const takesMoney = handlesMoney(option.mode);
    const list = usableVariants(option);
    const next = (fresh ? initialVariantKey : variantKey) || list[0]?.key || '';
    const picked = list.find(item => item.key === next) ?? list[0];
    const wanted = initialAmount && initialAmount > 0 ? initialAmount : standingAmount(option);
    const usable = takesMoney && amountFits(option, wanted);

    if (fresh) setDetails(EMPTY_DETAILS);

    setVariantKey(picked?.key ?? '');
    setStep(fresh && usable && initialAmount ? 'details' : 'choose');
    setAmount(usable ? wanted : takesMoney ? standingAmount(option) : 0);
    setCustom(usable && initialAmount ? String(wanted) : '');
    setResult(null);
    setErrorCode(null);
    setBusy(false);
    setThanks(false);
    setTouched(false);
    // `variantKey` is read only to survive a method switch; listing it would re-run
    // the sync on every pick and reset the step underneath the supporter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option, initialAmount, initialVariantKey]);

  const quickAmounts = useMemo(() => {
    const values = option.suggestedAmounts?.length ? option.suggestedAmounts : option.amount > 0 ? [option.amount] : [];
    return [...new Set(values.filter(value => value > 0))].sort((a, b) => a - b);
  }, [option]);

  /** Client-side mirror of the bounds the server enforces; the server keeps the say. */
  const invalidAmount = useMemo(() => {
    if (!money) return null;
    if (amount <= 0) return td('amountRequired');
    if (option.minAmount > 0 && amount < option.minAmount) return td('errors.min');
    if (option.maxAmount > 0 && amount > option.maxAmount) return td('errors.max');
    if (!option.customAmount && !quickAmounts.includes(amount)) return td('errors.fixed');
    return null;
  }, [money, amount, option, quickAmounts, td]);

  /** Said only once there is a reason to say it: a number they typed, or a press. */
  const amountError = touched || amount > 0 ? invalidAmount : null;
  const ready = Boolean(variant && (!money || (amount > 0 && !invalidAmount)));

  const setDetail = useCallback(<Key extends keyof WizardDetails>(key: Key, value: WizardDetails[Key]) => {
    setDetails(current => ({ ...current, [key]: value }));
  }, []);

  /** Moving to another method keeps the number only when the money still means the same. */
  const pickMethod = (next: IDonation) => {
    const list = usableVariants(next);
    // What the destination owes to the method being left, not the one being read:
    // a gesture has no number to carry, and a payment always starts somewhere.
    const kept = handlesMoney(next.mode) ? carriableAmount({ option, variant }, { option: next, variant: list[0] }, amount) : 0;

    setVariantKey(list[0]?.key ?? '');
    setAmount(kept);
    onSelect(next, list[0]?.key ?? '', kept);
  };

  const pickVariant = (next: SupportVariant) => {
    const carried = money ? carriableAmount({ option, variant }, { option, variant: next }, amount) : 0;

    setVariantKey(next.key);
    setAmount(carried);
    onSelect(option, next.key, carried);
  };

  const pickAmount = (value: number) => {
    setTouched(true);
    setAmount(value);
    setCustom(value > 0 ? String(value) : '');
  };

  const typeAmount = (value: string) => {
    setTouched(true);
    setCustom(value);
    const parsed = Number(value.replace(/[^\d]/g, ''));
    setAmount(Number.isFinite(parsed) ? parsed : 0);
  };

  /**
   * On from the choice step. A press that cannot be honoured says why instead of
   * sitting behind a dead button, so the window never looks broken.
   */
  const next = () => {
    if (!ready) {
      setTouched(true);
      return;
    }

    setStep(money ? 'details' : 'action');
  };

  const startCheckout = async () => {
    if (!option._id || !variant) return;
    setBusy(true);
    setErrorCode(null);

    try {
      const data = await supportApi.checkout(locale, {
        donationId: option._id,
        variantKey: variant.key,
        amount,
        name: details.anonymous ? '' : details.name.trim(),
        anonymous: details.anonymous,
        email: details.email.trim(),
        message: details.message.trim(),
        showOnWall: details.showOnWall,
        company: details.honeypot,
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
      await supportApi.confirm(locale, { orderId: result.orderId, reference: details.reference.trim() });
      setThanks(true);
    } catch (error) {
      setErrorCode(error instanceof SupportApiError ? error.code : 'generic');
    } finally {
      setBusy(false);
    }
  };

  /** Copying answers with a check for two seconds, so no toast covers the screen. */
  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Insecure context or a denied permission: the text is still on screen.
      toast.error(td('copyFailed'));
    }
  };

  /** The one action the footer offers right now, in the supporter's own words. */
  const primary: PrimaryAction = thanks
    ? { kind: 'none' }
    : current === 'choose'
      ? { kind: 'next' }
      : current === 'details'
        ? {
            kind: 'checkout',
            label: busy
              ? td('sending')
              : money && (option.mode === 'card' || option.mode === 'crypto')
                ? td('paymentDetails')
                : td('leaveSite', { provider: destination }),
          }
        : current === 'action'
          ? variant?.href
            ? { kind: 'link', href: variant.href, label: td('openPage', { provider: outbound }) }
            : { kind: 'none' }
          : result?.kind === 'redirect'
            ? { kind: 'wait' }
            : result?.kind === 'instructions'
              ? { kind: 'declare' }
              : result?.kind === 'external'
                ? { kind: 'link', href: result.url, label: td('leaveSite', { provider: destination }) }
                : { kind: 'none' };

  return {
    step: current,
    flow,
    back: flow[flow.indexOf(current) - 1],
    go: setStep,
    money,
    destinations,
    variant,
    currency,
    destination,
    amount,
    custom,
    quickAmounts,
    amountError,
    details,
    setDetail,
    result,
    busy,
    thanks,
    errorCode,
    dismissError: () => setErrorCode(null),
    copiedKey,
    primary,
    next,
    pickMethod,
    pickVariant,
    pickAmount,
    typeAmount,
    startCheckout,
    declareSent,
    copy,
  };
}

export type Wizard = ReturnType<typeof useSupportWizard>;
