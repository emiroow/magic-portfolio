import type { DonationMode, IDonation } from '@/types';
import { Coffee, CreditCard, Coins, Landmark, Link2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Presentation helpers shared by the support page, the home section and the
 * dashboard, so a method never gets a different icon or destination name in two
 * places.
 */

/** One icon per rail. */
export const MODE_ICONS: Record<DonationMode, LucideIcon> = {
  referral: Coffee,
  link: Link2,
  card: CreditCard,
  crypto: Coins,
  gateway: Landmark,
};

/**
 * Which label under `support.providers` names the money's destination. Card and
 * crypto transfers have no platform, so they say nothing and the dialog leans on
 * the method name instead.
 */
export function destinationKey(option: IDonation): string | null {
  if (option.mode === 'referral') return option.referral || null;
  if (option.mode === 'link') return option.linkProvider || null;
  if (option.mode === 'gateway') return option.gateway || null;
  return null;
}

/** Modes that finish somewhere else, and so must warn the supporter about it. */
export const LEAVES_SITE: DonationMode[] = ['referral', 'link', 'gateway'];

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
  if (raw.length <= head + tail + 1) return raw;
  return `${raw.slice(0, head)}…${raw.slice(-tail)}`;
}
