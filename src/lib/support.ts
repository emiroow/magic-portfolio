import { MONEY_MODES } from '@/constants/global';
import { slugify } from '@/lib/utils';
import type { DonationMode, IDonation, ProductCurrency, SupportVariant } from '@/types';

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
      return ['number', 'iban', 'holder', 'qrPayload'];
    case 'crypto':
      return ['network', 'address'];
    case 'gateway':
      return ['provider'];
    case 'action':
      return ['provider', 'href', 'instruction'];
  }
}

/** `true` when the destination has what its method needs to actually take money. */
export function variantIsUsable(mode: DonationMode, variant: SupportVariant): boolean {
  if (variant.active === false) return false;

  switch (mode) {
    case 'platform':
      return Boolean((variant.href || '').trim());
    case 'card':
      return Boolean((variant.number || '').trim() || (variant.iban || '').trim());
    case 'crypto':
      return Boolean((variant.address || '').trim());
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
  iban?: string;
  number?: string;
  href?: string;
}

/**
 * Identifier for a destination: the service, the ledger or the last characters of
 * what it holds. Owners never type it, and it is what a shared link carries as
 * `?variant=` so a page can open on one specific wallet, card or platform.
 */
export function variantKey(mode: DonationMode, variant: VariantSeed, index = 0): string {
  const named = slugify(variant.label || '');
  const seed = named || variant.provider || variant.network || (variant.iban || '').trim() || (variant.number || '').slice(-6) || variant.href || '';
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
 * Unit a destination is priced in. Only an explicit override moves a destination
 * away from its method's currency, so a USDT row on two chains stays one price.
 */
export function variantCurrency(option: IDonation, variant?: SupportVariant): ProductCurrency {
  return variant?.currency || option.currency;
}

/** Market a destination serves; a destination only says so when it differs. */
export function variantRegion(option: IDonation, variant?: SupportVariant) {
  return variant?.region || option.region;
}

/**
 * Language-free name for a destination, stored on the support record so a receipt
 * still says what it was paid into after the method has been edited away.
 *
 * Digits are kept to their last four: a record list does not need a full card number
 * or IBAN sitting in every row to be recognisable to the owner.
 */
export function variantName(variant: SupportVariant | undefined): string {
  if (!variant) return '';

  const named = (variant.label || '').trim();
  if (named) return named;
  if (variant.provider) return variant.provider;
  if (variant.network) return variant.network;
  if (variant.number) return `•••• ${variant.number.slice(-4)}`;
  if (variant.iban) return `•••• ${variant.iban.slice(-4)}`;

  const target = (variant.address || variant.href || '').trim();
  return target.length > 24 ? `${target.slice(0, 12)}…${target.slice(-6)}` : target;
}
