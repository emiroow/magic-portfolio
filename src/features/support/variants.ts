import { MONEY_MODES } from '@/features/support/constants';
import { slugify } from '@/lib/utils';
import type { DonationMode, IDonation, SupportVariant } from '@/features/support/types';
import type { PriceUnit } from '@/types';

/**
 * Shape helpers for the destinations a support method carries.
 *
 * These know nothing about icons or wording — they only decide what a destination
 * is called, which one a supporter picked and what it is priced in. Both the data
 * layer and the checkout need them, so the answers cannot drift apart.
 */

/** `true` when a method moves money, and therefore has an amount policy to honour. */
export function handlesMoney(mode: DonationMode): boolean {
  return MONEY_MODES.includes(mode);
}

/** Fields of a destination that carry money-moving data, per method. */
export function variantFields(mode: DonationMode): (keyof SupportVariant)[] {
  switch (mode) {
    case 'platform':
      return ['provider', 'href', 'instruction'];
    case 'card':
      return ['number', 'iban', 'bic', 'holder', 'qrPayload'];
    case 'crypto':
      return ['network', 'asset', 'address'];
    case 'gateway':
      return ['provider'];
    case 'action':
      return ['provider', 'href', 'instruction'];
  }
}

/**
 * `true` when the destination has what its method needs to actually take money.
 *
 * A wallet is only a wallet once it says what arrives in it: an address without an asset
 * is the guess this rail stopped making. A card needs the number or the account it
 * transfers to — in either market — and a BIC on its own routes nothing.
 */
export function variantIsUsable(mode: DonationMode, variant: SupportVariant): boolean {
  if (variant.active === false) return false;

  switch (mode) {
    case 'platform':
      return Boolean((variant.href || '').trim());
    case 'card':
      return Boolean((variant.number || '').trim() || (variant.iban || '').trim());
    case 'crypto':
      return Boolean((variant.address || '').trim()) && Boolean(variant.asset);
    case 'gateway':
      return Boolean(variant.provider);
    case 'action':
      // A gesture with nowhere to be made is not support, it is a dead button.
      return Boolean((variant.href || '').trim());
  }
}

/**
 * What a key can be built from. Form rows and stored documents both qualify, and
 * the empty strings a form hands over simply lose to the next candidate.
 */
export interface VariantSeed {
  label?: string;
  provider?: string;
  network?: string;
  asset?: string;
  iban?: string;
  number?: string;
  href?: string;
}

/**
 * Identifier for a destination: the service, the ledger and coin, or the last characters
 * of what it holds. Owners never type it, and it is what a shared link carries as
 * `?variant=` so a page can open on one specific wallet, card or platform.
 *
 * A wallet is named by its asset and its ledger together: two USDT destinations on two
 * chains are two destinations, and one key that says only `tron` cannot hold both.
 */
export function variantKey(mode: DonationMode, variant: VariantSeed, index = 0): string {
  const named = slugify(variant.label || '');
  const wallet = variant.asset && variant.network ? `${variant.asset}-${variant.network}` : variant.asset || variant.network;
  const seed = named || variant.provider || wallet || (variant.iban || '').trim() || (variant.number || '').slice(-6) || variant.href || '';
  const base = slugify(String(seed)) || `${mode}-${index + 1}`;
  // A key that is only digits would read as an amount in a link; give it a prefix.
  return /^\d/.test(base) ? `${mode}-${base}` : base;
}

/** Collision-free keys for a whole list, in the order the supporter sees them. */
export function withUniqueKeys<T extends VariantSeed>(mode: DonationMode, variants: T[]): (T & { key: string })[] {
  const taken = new Set<string>();

  return variants.map((variant, index) => {
    const base = variantKey(mode, variant, index);
    let key = base;
    let suffix = 2;

    while (taken.has(key)) key = `${base}-${suffix++}`;
    taken.add(key);

    return { ...variant, key };
  });
}

/** The destinations a supporter may actually pick, in stored order. */
export function usableVariants(option: IDonation): SupportVariant[] {
  return (option.variants ?? []).filter(variant => variantIsUsable(option.mode, variant));
}

/**
 * Whether the method has anything to offer at all. A method whose destinations are
 * all incomplete is kept out of the public surfaces: the wizard would open on an
 * empty choice list and the checkout would have nowhere to send the supporter.
 */
export function isOfferable(option: IDonation): boolean {
  return usableVariants(option).length > 0;
}

/** The destination a key points at, falling back to the first usable one. */
export function resolveVariant(option: IDonation, key?: string): SupportVariant | undefined {
  const list = usableVariants(option);
  if (!list.length) return undefined;
  if (!key) return list[0];
  return list.find(variant => variant.key === key);
}

/**
 * Unit a destination is priced in.
 *
 * A wallet prices in the coin it receives, so its asset answers the question before any
 * override does — the two can never disagree, and a USDT row on two chains stays one
 * price. Otherwise only an explicit override moves a destination away from its method's
 * currency. `normalizeDonation` materializes a currency onto every money destination, so
 * the method's default is reached only by a hand-written row that named neither.
 */
export function variantCurrency(option: IDonation, variant?: SupportVariant): PriceUnit {
  return variant?.asset || variant?.currency || option.currency;
}

/**
 * The amount a destination asks for by default: its own fixed price, else its first
 * quick-pick. `0` when it sets neither, which the wizard reads as "the supporter picks".
 */
export function variantStandingAmount(variant?: SupportVariant): number {
  if (!variant) return 0;
  const fixed = variant.amount ?? 0;
  return fixed > 0 ? fixed : (variant.suggestedAmounts?.[0] ?? 0);
}

/**
 * `true` when a destination accepts an amount the supporter names themselves.
 *
 * The card, the chooser and the wizard all ask this one question, so a surface can
 * never offer a free number that the checkout would refuse as "not a set amount".
 */
export function takesOpenAmount(variant: SupportVariant | undefined): boolean {
  return Boolean(variant?.customAmount);
}

/**
 * The quick-pick amounts shown on a destination's amount step: its suggested list,
 * else its fixed price, deduped and ordered. Empty when it pre-sets nothing.
 */
export function variantQuickAmounts(variant?: SupportVariant): number[] {
  if (!variant) return [];
  const suggested = variant.suggestedAmounts ?? [];
  const fixed = variant.amount ?? 0;
  const values = suggested.length ? suggested : fixed > 0 ? [fixed] : [];
  return [...new Set(values.filter(value => value > 0))].sort((a, b) => a - b);
}

/**
 * Whether an amount is one this destination would accept, and why not if it isn't.
 *
 * This is the single rule the wizard mirrors and the checkout enforces, so a number
 * the front calls valid can never be the one the server refuses: the bounds are the
 * destination's own floor and ceiling, and with custom amount off only the fixed
 * price or a suggested amount passes. `code` is what the surface turns into a message.
 */
export type AmountVerdict = { ok: true } | { ok: false; code: 'empty' | 'min' | 'max' | 'fixed' };

export function judgeAmount(variant: SupportVariant | undefined, value: number): AmountVerdict {
  if (!variant || !Number.isFinite(value) || value <= 0) return { ok: false, code: 'empty' };

  const min = variant.minAmount ?? 0;
  const max = variant.maxAmount ?? 0;
  if (min > 0 && value < min) return { ok: false, code: 'min' };
  if (max > 0 && value > max) return { ok: false, code: 'max' };

  if (!variant.customAmount) {
    const fixed = variant.amount ?? 0;
    const accepted = fixed > 0 ? [fixed] : (variant.suggestedAmounts ?? []);
    if (!accepted.includes(value)) return { ok: false, code: 'fixed' };
  }

  return { ok: true };
}

/** Market a destination serves; a destination only says so when it differs. */
export function variantRegion(option: IDonation, variant?: SupportVariant) {
  return variant?.region || option.region;
}

/**
 * Language-free name for a destination, stored on the support record so a receipt
 * still says what it was paid into after the method has been edited away.
 *
 * A wallet is named by coin and ledger together, because that is the pair that decides
 * where the money went. Digits are kept to their last four: a record list does not need
 * a full card number or IBAN sitting in every row to be recognisable to the owner.
 */
export function variantName(variant: SupportVariant | undefined): string {
  if (!variant) return '';

  const named = (variant.label || '').trim();
  if (named) return named;
  if (variant.provider) return variant.provider;
  if (variant.asset) return variant.network ? `${variant.asset}-${variant.network}` : variant.asset;
  if (variant.network) return variant.network;
  if (variant.number) return `•••• ${variant.number.slice(-4)}`;
  if (variant.iban) return `•••• ${variant.iban.slice(-4)}`;

  const target = (variant.address || variant.href || '').trim();
  return target.length > 24 ? `${target.slice(0, 12)}…${target.slice(-6)}` : target;
}
