import { supporterModel } from '@/features/support/supporter.model';
import { variantCurrency, variantName, variantRegion, withUniqueKeys } from '@/features/support/variants';
import { withBothLangs, type Content, type Localized } from '@/seed/personas/types';
import type { IDonation, ISupporter, SupporterStatus } from '@/features/support/types';
import type { AppLocale } from '@/types';

const DAY = 24 * 60 * 60 * 1000;

/**
 * The supporters wall, seeded.
 *
 * A wall with nothing on it is the one part of the support page a fresh install can
 * never show, so the demo carries a year of gifts: most of them confirmed and opted in,
 * one that asked to stay off the wall, and one each in the states the dashboard filters
 * on — awaiting confirmation, failed at the bank, cancelled at the gateway. Those last
 * three are invisible to the public page on purpose, which is what makes the public
 * count, the wall and the dashboard agree with each other.
 *
 * Only the gift itself is written here. The currency, the method, the market and the
 * destination's own name are read off the seeded method each gift points at, so a record
 * can never disagree with the rail it was paid into — the same rule the checkout follows
 * when it creates one.
 *
 * Names and messages are invented for the demo, as the rest of the persona is.
 */

/** One gift as it is authored: which rail, how much, when, and what they left. */
interface DemoGift {
  /** `slug` of the method this gift travelled on. */
  slug: string;
  /** Destination of that method, by the key the page links to it with. */
  variant: string;
  /** In whole units of the destination's own currency. */
  amount: number;
  /** Days before the seed run, so the wall reads as a history rather than one afternoon. */
  daysAgo: number;
  /** Left empty (or `anonymous`) for the gifts that show as Anonymous. */
  name?: string;
  message?: string;
  /** Never published; it exists so a receipt could be sent. */
  email?: string;
  /** Tracking code, transaction hash or the last digits a receipt is matched by. */
  reference?: string;
  /** Owner's note, written when a gift is confirmed or refused by hand. */
  note?: string;
  status?: SupporterStatus;
  /** `false` keeps a confirmed gift off the wall. */
  showOnWall?: boolean;
}

/** The two sites keep different company: the rails, the amounts and the words all differ. */
const GIFTS: Localized<DemoGift> = {
  en: [
    {
      slug: 'platforms',
      variant: 'github',
      amount: 25,
      daysAgo: 5,
      name: 'Mira Kowalski',
      message: 'The import command saved a weekend of migration. Keep it coming.',
      email: 'mira@koddelab.pl',
    },
    { slug: 'platforms', variant: 'buymeacoffee', amount: 10, daysAgo: 26 },
    {
      slug: 'usdt',
      variant: 'tether-tron',
      amount: 25,
      daysAgo: 61,
      name: 'Tomás Nunes',
      message: 'Small and monthly, because the changelog is the only one that never lied to me.',
      reference: '4f9c2d8e1a7b6c5d0e3f2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d',
    },
    {
      slug: 'platforms',
      variant: 'patreon',
      amount: 10,
      daysAgo: 96,
      name: 'Anna Brandt',
      message: 'First tier, for the deploy guide alone.',
    },
    { slug: 'platforms', variant: 'buymeacoffee', amount: 5, daysAgo: 134 },
    {
      slug: 'btc',
      variant: 'btc-lightning',
      amount: 0.0005,
      daysAgo: 172,
      name: 'Devon Price',
      message: 'Sent over Lightning in four seconds. Your sub-cent amounts finally work.',
      reference: 'lnurl1dp68gurn8ghj7vsqzzmqe6krokgo0cc5mwx1p',
    },
    {
      slug: 'international-transfer',
      variant: 'gb33bukb20201555555555',
      amount: 40,
      daysAgo: 214,
      name: 'Sofia Rossi',
      message: 'From Milan, with thanks for keeping the self-hosted build free.',
      email: 'sofia.rossi@velatura.example',
      reference: 'PMT-2026-884217',
    },
    {
      slug: 'usdt',
      variant: 'tether-ethereum',
      amount: 10,
      daysAgo: 259,
      name: 'Yuki Tanabe',
      reference: '9b1d4c7a2e5f8306c1a9d2b7e4f0c3a685d2b9e1f7c4a0d3b6e9f2c5a8d1b470',
    },
    {
      slug: 'btc',
      variant: 'btc-bitcoin',
      amount: 0.001,
      daysAgo: 305,
      name: 'Priya Nandakumar',
      message: 'A small amount and a large thank you.',
    },
    { slug: 'platforms', variant: 'patreon', amount: 25, daysAgo: 352 },
    {
      // Confirmed, counted, and deliberately off the wall.
      slug: 'platforms',
      variant: 'github',
      amount: 50,
      daysAgo: 9,
      name: 'Marcus Feld',
      email: 'marcus@feldworks.example',
      showOnWall: false,
      note: 'Asked that the sponsorship stay private; confirmed on the platform page.',
    },
    {
      slug: 'usdt',
      variant: 'tether-tron',
      amount: 10,
      daysAgo: 2,
      name: 'Lena Osei',
      status: 'pending',
      reference: '7c3a9f1d0b28e54671fa9c3d5e7b9012468ace0df1b3a5c7e9d0f2b4a6c8e0d1',
      note: 'Hash sent, not yet three confirmations deep.',
    },
    {
      slug: 'international-transfer',
      variant: 'gb33bukb20201555555555',
      amount: 20,
      daysAgo: 24,
      status: 'failed',
      reference: 'PMT-2026-771904',
      note: 'The transfer came back: the sending bank refused the SWIFT route.',
    },
    {
      slug: 'platforms',
      variant: 'patreon',
      amount: 10,
      daysAgo: 15,
      name: 'Hugo Martin',
      status: 'cancelled',
      note: 'Cancelled at the platform before the first charge.',
    },
  ],
  fa: [
    {
      slug: 'card-to-card',
      variant: 'card-246848',
      amount: 500000,
      daysAgo: 5,
      name: 'مریم کریمی',
      message: 'مستندات فارسی را که گذاشتید تیم همان روز استفاده کرد. سپاس.',
      reference: '88421765',
    },
    { slug: 'platforms', variant: 'coffeebede', amount: 200000, daysAgo: 26 },
    {
      slug: 'usdt',
      variant: 'tether-tron',
      amount: 25,
      daysAgo: 61,
      name: 'سارا محمدی',
      message: 'کم است ولی هر ماه؛ فقط برای اینکه این پروژه زنده بماند.',
      reference: '4f9c2d8e1a7b6c5d0e3f2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d',
    },
    { slug: 'card-to-card', variant: 'card-246848', amount: 250000, daysAgo: 96 },
    {
      slug: 'platforms',
      variant: 'github',
      amount: 10,
      daysAgo: 134,
      name: 'امیر رضایی',
      message: 'خارج از ایران هستم و کارت به کارت ممکن نبود، پس از گیت‌هاب.',
    },
    {
      slug: 'platforms',
      variant: 'coffeebede',
      amount: 1000000,
      daysAgo: 172,
      name: 'نگار احمدی',
      message: 'راهنمای استقرار را خریدم و ارزشش را داشت؛ این هم سهم خودم برای ادامهٔ کار.',
    },
    {
      slug: 'card-to-card',
      variant: 'ir220610505409585374874655',
      amount: 2000000,
      daysAgo: 214,
      name: 'بابک شریفی',
      reference: '1390447721',
      note: 'از طریق شبا، مطابق صورت‌حساب تأیید شد.',
    },
    {
      slug: 'btc',
      variant: 'btc-bitcoin',
      amount: 0.001,
      daysAgo: 259,
      name: 'حسین توکلی',
      message: 'ساده و بی‌دردسر. امیدوارم نسخه‌های بعدی هم رایگان بمانند.',
    },
    {
      slug: 'card-to-card',
      variant: 'card-246848',
      amount: 750000,
      daysAgo: 305,
      name: 'زهرا نوری',
      message: 'کد QR و شناسهٔ پیگیری خیلی به درد آمد.',
      reference: '99210453',
    },
    { slug: 'platforms', variant: 'buymeacoffee', amount: 5, daysAgo: 352 },
    {
      slug: 'card-to-card',
      variant: 'ir220610505409585374874655',
      amount: 1000000,
      daysAgo: 9,
      name: 'رضا مهرابی',
      email: 'reza.morehavi@example.com',
      showOnWall: false,
      note: 'خواست نامش روی دیوار نباشد؛ مبلغ تأیید شد.',
    },
    {
      slug: 'platforms',
      variant: 'coffeebede',
      amount: 500000,
      daysAgo: 2,
      name: 'فاطمه نوروزی',
      status: 'pending',
      note: 'در انتظار تأیید پلتفرم.',
    },
    {
      slug: 'card-to-card',
      variant: 'card-246848',
      amount: 300000,
      daysAgo: 24,
      status: 'failed',
      reference: '771904',
      note: 'تراکنش در بانک ناموفق ماند و مبلغ به حساب فرستنده برگشت.',
    },
    {
      slug: 'usdt',
      variant: 'tether-ethereum',
      amount: 10,
      daysAgo: 15,
      name: 'مهدی سالاری',
      status: 'cancelled',
      note: 'پیش از تأیید لغو شد؛ هیچ مبلغی نرسید.',
    },
  ],
};

/** One support document, resolved against the method a gift was paid into. */
function recordFor(gift: DemoGift, methods: IDonation[], lang: AppLocale, now: Date): Content<ISupporter> {
  const method = methods.find(option => option.lang === lang && option.slug === gift.slug);
  if (!method) throw new Error(`support seed: no method '${gift.slug}' to point a gift at`);

  const variant = withUniqueKeys(method.mode, method.variants ?? []).find(item => item.key === gift.variant);
  if (!variant) throw new Error(`support seed: '${gift.slug}' has no destination '${gift.variant}'`);

  // The checkout's own rule: a gift with no name is an anonymous one.
  const anonymous = !gift.name;

  return {
    donationId: method._id ? String(method._id) : undefined,
    donationTitle: method.title,
    variantKey: variant.key,
    variantLabel: variantName(variant),
    name: anonymous ? '' : gift.name,
    anonymous,
    email: gift.email,
    message: gift.message,
    amount: gift.amount,
    currency: variantCurrency(method, variant),
    mode: method.mode,
    region: variantRegion(method, variant),
    status: gift.status ?? 'completed',
    reference: gift.reference,
    note: gift.note,
    showOnWall: gift.showOnWall !== false,
    createdAt: new Date(now.getTime() - gift.daysAgo * DAY).toISOString(),
  };
}

/**
 * Seed the wall's history from the methods that were just inserted. Returns the
 * inserted count, like every other step.
 */
export const seedSupporterData = async (methods: IDonation[]) => {
  const now = new Date();
  // Hydrated documents keep their values behind getters, so a spread of one comes out
  // empty; the gifts are read off plain copies, and `_id` arrives as the string the
  // record stores it in.
  const rails = JSON.parse(JSON.stringify(methods)) as IDonation[];
  const pair: Localized<Content<ISupporter>> = {
    en: GIFTS.en.map(gift => recordFor(gift, rails, 'en', now)),
    fa: GIFTS.fa.map(gift => recordFor(gift, rails, 'fa', now)),
  };

  // The gifts carry their own `createdAt`, backdated over a year: the wall is sorted by
  // it, and a history in which every gift landed today is not a history.
  const inserted = await supporterModel.insertMany(withBothLangs(pair));

  return inserted.length;
};
