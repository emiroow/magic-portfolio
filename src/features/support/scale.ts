import type { ISupporter } from '@/features/support/types';
import type { PriceUnit } from '@/types';

/**
 * How much a gift is worth next to a gift written in another unit.
 *
 * The wall honours the greatest support first, and the rails take money in eleven units —
 * so ۵۰۰٬۰۰۰ تومان, ۲۵ دلار and ۰٫۰۰۱ بیت‌کوین have to sit on one scale before any of them
 * can lead the list. That is the only question this table answers.
 *
 * One US dollar is the base, and a value is roughly what a whole unit of that currency buys.
 * National monies are set at the order of magnitude they trade at, the stablecoins sit on the
 * dollar they are pegged to, and `rial` is exactly a tenth of `toman` because that relation is
 * a definition rather than an estimate. The rest are deliberately round: they only ever decide
 * which of two gifts reads as the bigger one.
 *
 * Nothing here is a price. It is never shown to a supporter and never charged — a checkout
 * still refuses to convert at any rate (see `toRial` in `payments.ts`), and a gift is displayed
 * in the unit it actually travelled in.
 */
export const UNIT_WORTH_IN_USD: Record<PriceUnit, number> = {
  toman: 0.00001,
  rial: 0.000001,
  usd: 1,
  eur: 1.1,
  tether: 1,
  usdc: 1,
  btc: 100_000,
  eth: 3_000,
  trx: 0.25,
  ton: 2,
  bnb: 500,
};

/** The unit a record that names none is read as — the one its own schema defaults to. */
const FALLBACK_UNIT: PriceUnit = 'toman';

/**
 * Rough US-dollar worth of one whole unit.
 *
 * A unit this build does not know falls back to the default rather than worthing nothing: a
 * hand-written or older record should be ordered among the others, not pushed to the bottom
 * of the wall for a spelling the table never learned.
 */
export function unitWorth(currency: PriceUnit | string | undefined): number {
  return UNIT_WORTH_IN_USD[currency as PriceUnit] ?? UNIT_WORTH_IN_USD[FALLBACK_UNIT];
}

/** A gift's worth on the shared scale. An amount that is not a positive number worths nothing. */
export function giftWorth(gift: Pick<ISupporter, 'amount' | 'currency'>): number {
  const amount = Number.isFinite(gift.amount) ? gift.amount : 0;
  return amount > 0 ? amount * unitWorth(gift.currency) : 0;
}

/** `createdAt` as a number; a record without one simply loses the tie-break. */
function timeOf(value: string | undefined): number {
  const time = new Date(value ?? 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

/** The id as the wall sees it: a plain string to break an otherwise identical pair with. */
function idOf(gift: ISupporter): string {
  return String(gift._id ?? '');
}

/**
 * Wall order: greatest support first.
 *
 * Gifts that land on the same rung of the scale keep the newer one ahead, and the id breaks
 * what is still tied, so two runs of the query cannot hand back two different orders and make
 * a supporter's place on the wall jump between them.
 */
export function byGreatestSupport(a: ISupporter, b: ISupporter): number {
  return giftWorth(b) - giftWorth(a) || timeOf(b.createdAt) - timeOf(a.createdAt) || idOf(a).localeCompare(idOf(b));
}
