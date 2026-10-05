import type { DonationMode, IDonation, ProductCurrency, SupportVariant } from '@/types';
import { Coins, Coffee, CreditCard, Landmark } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usableVariants, variantCurrency, variantRegion } from '@/lib/support';
import { CRYPTO_NETWORKS, SUPPORT_PROVIDERS } from '@/constants/global';
import { linkHost } from '@/lib/utils';

/**
 * Naming and money helpers for the support section, shared by the page, the wizard
 * and the dashboard, so a method never gets one name in two places and an amount
 * never means two different things.
 */

/** One icon per method. */
export const MODE_ICONS: Record<DonationMode, LucideIcon> = {
  platform: Coffee,
  card: CreditCard,
  crypto: Coins,
  gateway: Landmark,
};

/** Anything the wording of the catalogues, narrowed to what a tile needs. */
type Label = (key: string) => string;

/** A method and the destination of it a supporter is actually looking at. */
export interface Choice {
  option: IDonation;
  variant?: SupportVariant;
}

/**
 * Name of a destination: what the owner called it, else the service or the ledger
 * it sits on. `t` is the `support` namespace of the page showing it.
 */
export function variantLabel(variant: SupportVariant | undefined, t: Label): string {
  if (!variant) return '';
  const named = (variant.label || '').trim();
  if (named) return named;
  if (variant.provider) return t(`providers.${variant.provider}`);
  if (variant.network) return t(`networks.${variant.network}`);
  return '';
}

/**
 * Second line of a destination tile: the part of it a supporter checks before
 * sending money — the last digits of a card, the head of an address, the host of a
 * platform page. Empty when the name already says everything.
 */
export function variantDetail(variant: SupportVariant | undefined): string {
  if (!variant) return '';

  if (variant.number) return `•••• ${variant.number.slice(-4)}`;
  if (variant.iban) return shortenAddress(variant.iban, 4, 4);
  if (variant.address) return shortenAddress(variant.address);
  if (variant.href) return linkHost(variant.href);

  return '';
}

/**
 * Direction for a short name that may mix Persian and Latin.
 *
 * A bracket next to a Latin run inside an RTL paragraph is mirrored, and `تتر )USDT(`
 * is not the name of anything. A name has no sentence punctuation that could move,
 * so a mixed one is given a Latin base and reads the same in both scripts.
 */
export function nameDir(value: string | undefined): 'ltr' | 'auto' {
  const raw = value || '';
  return /[\u0600-\u06FF]/.test(raw) && /[A-Za-z]/.test(raw) ? 'ltr' : 'auto';
}

/**
 * A destination name stored on a support record, translated when it still matches a
 * catalogue id. Records keep the words the server had at the time, so a name an owner
 * typed by hand simply reads as what it is instead of breaking the line.
 */
export function storedVariantName(label: string | undefined, t: Label): string {
  if (!label) return '';
  if ((SUPPORT_PROVIDERS as string[]).includes(label)) return t(`providers.${label}`);
  if ((CRYPTO_NETWORKS as string[]).includes(label)) return t(`networks.${label}`);
  return label;
}

/** Unit a choice is priced in, following the destination's override when it has one. */
export function choiceCurrency(choice: Choice): ProductCurrency {
  return variantCurrency(choice.option, choice.variant);
}

/** Market a choice serves, for the tag a destination wears when it differs. */
export function choiceRegion(choice: Choice) {
  return variantRegion(choice.option, choice.variant);
}

/** `true` when the list spans more than one market, so the tiles have to say so. */
export function spansMarkets(option: IDonation): boolean {
  const list = usableVariants(option);
  if (list.length < 2) return false;

  return new Set(list.map(variant => variantRegion(option, variant))).size > 1;
}

/**
 * The methods an amount of the supporter's own choosing can travel on. A fixed-price
 * method is left out: naming a number there is not a choice the site can honour.
 */
export function flexibleMethods(options: IDonation[]): IDonation[] {
  return options.filter(option => option.customAmount && usableVariants(option).length > 0);
}

/**
 * Client-side mirror of the bounds the checkout enforces: is this number one the
 * method would accept? Moving between methods, or arriving on a deep link, asks the
 * same question, and the server always keeps the final say.
 */
export function amountFits(option: IDonation, value: number): boolean {
  if (value <= 0) return false;
  if (option.minAmount > 0 && value < option.minAmount) return false;
  if (option.maxAmount > 0 && value > option.maxAmount) return false;
  return option.customAmount || value === option.amount || option.suggestedAmounts.includes(value);
}

/** What a method asks for by default: its own price, else its first suggested amount. */
export function standingAmount(option: IDonation): number {
  return option.amount > 0 ? option.amount : (option.suggestedAmounts[0] ?? 0);
}

/**
 * The amount to keep when a supporter moves from one choice to another.
 *
 * Bounds are not enough: ۲۵۰٬۰۰۰ تومان and ۲۵۰٬۰۰۰ دلار are the same digits and
 * nothing alike, and a method with no ceiling would accept either. A number only
 * survives a move between choices that price in the same currency; anywhere else the
 * new one starts from its method's own amount.
 */
export function carriableAmount(from: Choice, to: Choice, value: number): number {
  return choiceCurrency(from) === choiceCurrency(to) && amountFits(to.option, value) ? value : standingAmount(to.option);
}

/* ------------------------------- formatting ------------------------------- */

/** Group a card number the way it is printed: `6037 9911 2222 3333`. */
export function groupCardNumber(value: string | undefined): string {
  const digits = (value || '').replace(/\D/g, '');
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

/** Group an IBAN in fours, keeping the leading `IR` attached to the first block. */
export function groupIban(value: string | undefined): string {
  const raw = (value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!raw) return '';
  const head = raw.slice(0, 4);
  const rest = raw
    .slice(4)
    .replace(/(.{4})/g, '$1 ')
    .trim();
  return rest ? `${head} ${rest}` : head;
}

/**
 * An address too long for one line is truncated in the middle, which keeps the
 * prefix and the tail — the two parts a wallet compares before sending.
 */
export function shortenAddress(value: string | undefined, head = 10, tail = 8): string {
  const raw = (value || '').trim();
  if (!raw) return '';
  if (raw.length <= head + tail + 1) return raw;
  return `${raw.slice(0, head)}…${raw.slice(-tail)}`;
}
