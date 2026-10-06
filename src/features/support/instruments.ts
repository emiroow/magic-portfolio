import type { CryptoNetwork } from '@/features/support/types';

/**
 * The numbers money actually travels on: card digits, an IBAN, a BIC, a wallet address.
 *
 * Each is checked the way its own standard checks it, because a destination that is
 * stored but cannot be paid into is worse than one that is missing: the supporter sends
 * to a stranger's account, or onto a chain the address does not live on. These run on
 * every save — in the dashboard form and in the API alike — so what the owner typed is
 * what the banking network accepts.
 */

/* --------------------------------- card digits -------------------------------- */

/**
 * Luhn over a run of digits: the check digit every card scheme prints, and the one the
 * Iranian Shetab network prints on a sixteen-digit card.
 */
export function luhnValid(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;

  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = digits.charCodeAt(index) - 48;
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
}

/**
 * Card schemes, the prefixes they issue and the lengths they issue them in.
 *
 * A number that starts with `4` and holds 19 digits is a Visa; the same digits with one
 * missing are a mistype. Checking the pair together is what makes the difference between
 * an unusable destination and a saved one.
 */
const CARD_SCHEMES = [
  { id: 'amex', pattern: /^3[47]/, lengths: [15] },
  { id: 'diners', pattern: /^(30[0-5]|36|38)/, lengths: [14, 16] },
  { id: 'jcb', pattern: /^352[89]|^35[3-8]\d/, lengths: [16, 17, 18, 19] },
  { id: 'unionpay', pattern: /^62/, lengths: [16, 17, 18, 19] },
  { id: 'discover', pattern: /^(6011|64[4-9]\d|65)/, lengths: [16, 17, 18, 19] },
  { id: 'mastercard', pattern: /^(5[1-5]|2[2-7])/, lengths: [16] },
  { id: 'visa', pattern: /^4/, lengths: [13, 16, 19] },
] as const;

/** A scheme an international card can belong to; `other` is a number none of them issued. */
export type CardScheme = (typeof CARD_SCHEMES)[number]['id'] | 'other';

/** The scheme that issued a PAN, and whether the number is one that scheme could print. */
export function cardCheck(digits: string): { scheme: CardScheme; ok: boolean } {
  if (!/^\d{13,19}$/.test(digits)) return { scheme: 'other', ok: false };

  const scheme = CARD_SCHEMES.find(item => item.pattern.test(digits));
  if (!scheme) return { scheme: 'other', ok: false };

  const shaped = (scheme.lengths as readonly number[]).includes(digits.length);

  return { scheme: scheme.id, ok: shaped && luhnValid(digits) };
}

/** `true` when a run of digits is all one digit repeated — a typed-in placeholder, not a card. */
const isRepeating = (digits: string) => /^(\d)\1+$/.test(digits);

/**
 * An Iranian card number: exactly sixteen digits, a sound Shetab check digit, and not a
 * row of the same digit. The card is what a local banking app transfers to, so nothing
 * shorter or longer can be paid with it.
 */
export function isIranianCardNumber(digits: string): boolean {
  return /^\d{16}$/.test(digits) && !isRepeating(digits) && luhnValid(digits);
}

/** A card the international rails recognise: a scheme they issue, its own length, a sound check digit. */
export function isInternationalCardNumber(digits: string): boolean {
  return cardCheck(digits).ok;
}

/* --------------------------------- bank rails --------------------------------- */

/**
 * IBAN lengths by issuing country, from the SWIFT registry.
 *
 * A country outside the table is still accepted on its check digits and the general
 * fifteen-to-thirty-four window, so a new member state does not lock the owner out of
 * their own account; a country inside it has to be exactly as long as its banks issue.
 */
export const IBAN_LENGTHS: Record<string, number> = {
  AD: 24,
  AE: 23,
  AL: 28,
  AT: 20,
  AZ: 28,
  BA: 20,
  BE: 16,
  BG: 22,
  BH: 22,
  BR: 29,
  CH: 21,
  CR: 22,
  CY: 28,
  CZ: 24,
  DE: 22,
  DK: 18,
  DO: 28,
  EE: 20,
  EG: 29,
  ES: 24,
  FI: 18,
  FO: 18,
  FR: 27,
  GB: 22,
  GE: 22,
  GI: 23,
  GL: 18,
  GR: 27,
  HR: 21,
  HU: 28,
  IE: 22,
  IL: 23,
  IS: 26,
  IT: 27,
  JO: 30,
  KW: 30,
  KZ: 20,
  LB: 28,
  LI: 21,
  LT: 32,
  LU: 20,
  LV: 21,
  MC: 27,
  MD: 24,
  ME: 22,
  MK: 19,
  MR: 27,
  MT: 31,
  MU: 30,
  NL: 18,
  NO: 15,
  PK: 24,
  PL: 28,
  PT: 25,
  QA: 29,
  RO: 24,
  RS: 22,
  SA: 24,
  SE: 24,
  SI: 19,
  SK: 24,
  SM: 27,
  ST: 25,
  TL: 23,
  TN: 24,
  TR: 26,
  UA: 29,
  VA: 22,
  VG: 24,
  XK: 20,
};

/** An IBAN as its registry holds it: upper case, no spaces. */
export function normalizeIban(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * The IBAN's own arithmetic: move the country and its check digits to the end, read the
 * letters as 10-35, and the whole number has to leave a remainder of 1 under 97.
 */
function ibanRemainder(iban: string): number {
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  const digits = rearranged.replace(/[A-Z]/g, letter => String(letter.charCodeAt(0) - 55));

  let remainder = 0;
  for (const digit of digits) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }

  return remainder;
}

/**
 * Whether a string is an IBAN that could be paid into.
 *
 * `country` pins the issuing state, which is how an Iranian sheba is told apart from
 * any other IBAN: same arithmetic, a fixed twenty-six characters and an all-digit account.
 */
export function isIban(value: string, country?: string): boolean {
  const iban = normalizeIban(value);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false;
  if (country && !iban.startsWith(country.toUpperCase())) return false;

  const expected = IBAN_LENGTHS[iban.slice(0, 2)];
  if (expected ? iban.length !== expected : iban.length < 15 || iban.length > 34) return false;

  return ibanRemainder(iban) === 1;
}

/** An Iranian sheba: an IBAN issued in Iran, which is twenty-six characters of digits after the country. */
export function isSheba(value: string): boolean {
  const iban = normalizeIban(value);
  return /^IR\d{24}$/.test(iban) && isIban(iban, 'IR');
}

/** SWIFT-BIC (ISO 9362): the institution, its country, its location and an optional branch. */
export function isBic(value: string): boolean {
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value.replace(/[\s-]/g, '').toUpperCase());
}

/* ------------------------------ wallet addresses ------------------------------ */

/**
 * What an address has to look like on each ledger the site lists.
 *
 * The ledger decides the shape, not the asset: USDT and TRX arrive at the same TRON
 * account, and a token on the wrong chain is a loss rather than a typo — which is why
 * the pair is checked against the network the destination names.
 */
const WALLET_ADDRESS_RULES: Record<CryptoNetwork, { pattern: RegExp; min: number; max: number }> = {
  tron: { pattern: /^T[1-9A-HJ-NP-Za-km-z]{33}$/, min: 34, max: 34 },
  ethereum: { pattern: /^0x[0-9a-fA-F]{40}$/, min: 42, max: 42 },
  bsc: { pattern: /^0x[0-9a-fA-F]{40}$/, min: 42, max: 42 },
  bitcoin: { pattern: /^(bc1[a-z0-9]{25,87}|[13][1-9A-HJ-NP-Za-km-z]{25,39})$/, min: 26, max: 90 },
  ton: { pattern: /^(EQ|UQ)[A-Za-z0-9_-]{44,46}$/, min: 46, max: 48 },
  // An invoice, an LNURL, or the address a wallet can pay by name alone.
  lightning: { pattern: /^(ln(tb|tp|bc)[a-z0-9]{20,}|lnurl1[a-z0-9]{20,}|[\w.+-]+@[\w-]+(\.[\w-]+)+)$/i, min: 8, max: 250 },
};

/** Whether an address belongs on the ledger the destination says it lives on. */
export function isWalletAddress(network: CryptoNetwork | undefined, address: string): boolean {
  const rule = network ? WALLET_ADDRESS_RULES[network] : undefined;
  const target = address.trim();
  if (!rule || !target) return false;

  return target.length >= rule.min && target.length <= rule.max && rule.pattern.test(target);
}
