import { slugify } from '@/lib/utils';
import { donationModel } from '@/features/support/donation.model';
import { withUniqueKeys } from '@/features/support/variants';
import type { IDonation, SupportProvider, SupportVariant } from '@/features/support/types';
import { withBothLangs, type Content, type Localized, type Persona } from '@/seed/personas/types';

/**
 * Support methods for the demo persona.
 *
 * A method is not biographical the way a project is — it is plumbing — but it still
 * belongs to somebody. So the rails are authored once and their coordinates are read
 * off the persona: the handle on their Buy Me a Coffee and GitHub Sponsors pages, the
 * repository a star is asked for, the channels they actually appear on, and the name
 * an account is registered under. Switching persona moves the whole support page to
 * the new owner instead of leaving `your-name` placeholders behind.
 *
 * Coverage is deliberate: every mode the site can render, both markets, and all three
 * ways a destination can price itself — an amount the supporter names, a fixed price,
 * and a set of tiers with nothing free to type.
 *
 * The instrument values are placeholders by necessity (seeding a real card or wallet
 * would end with a supporter paying a stranger), but each is the shape its own
 * standard defines: a sixteen-digit Mellat card with a sound Luhn digit, a sheba on the
 * same bank whose mod-97 checksum holds, a UK IBAN routed by the matching SWIFT code,
 * and wallets whose address matches the ledger named beside them. Replace them in the
 * dashboard before going live.
 *
 * Destination keys are never written here. `withUniqueKeys` derives them from the
 * destination's own content — the same call the read path makes — so a stored document
 * and the keys the page links to cannot drift apart.
 */

/** A destination as it is authored: everything but the derived key. */
type AuthoredVariant = Omit<SupportVariant, 'key'>;

/** One method as it is authored, before its keys are derived. */
type MethodContent = Omit<Content<IDonation>, 'variants'> & { variants: AuthoredVariant[] };

/** The persona's own coordinates, resolved once per seed run. */
interface Identity {
  /** Latin name an international account is registered under. */
  holder: string;
  /** Handle the persona's pages use on the support platforms. */
  handle: string;
  /** GitHub profile, empty when the persona is not on it. */
  github: string;
  /** The repository a star and an issue are asked for; falls back to the profile. */
  repo: string;
  /**
   * A Lightning destination: the site's own pay-by-name address where there is a site,
   * and a static LNURL where there is not. Both are what a wallet can actually pay, and
   * a one-time invoice is not something a rail can hold.
   */
  lightning: string;
  /** First channel of each icon the persona links to, as a gesture destination. */
  channel: (icon: string) => string;
}

/** Trailing slashes carry no meaning in a page a supporter is sent to. */
const bare = (url: string) => url.replace(/\/+$/, '');

/** Host of a URL, or empty when it is not one; a bad persona link must not abort the seed. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function identityOf(persona: Persona): Identity {
  const profile = persona.profile.en[0];
  const channel = (icon: string) => bare(persona.socials.en.find(social => social.icon === icon)?.url || '');
  const github = channel('github');
  const repo =
    bare(
      persona.projects.en.flatMap(project => project.links ?? []).find(link => link.icon === 'github' && link.href.includes('github.com/'))?.href ||
        ''
    ) || github;

  const site = hostOf(channel('website'));

  return {
    holder: profile.fullName,
    handle: (github.split('/').pop() || slugify(profile.fullName) || 'your-name').toLowerCase(),
    github,
    repo,
    lightning: site ? `sats@${site}` : 'lnurl1dp68gurn8ghj7vsqzzmqe6krokgo0cc5mwx1p',
    channel,
  };
}

/**
 * The free gestures, in shown order, limited to the channels the persona keeps.
 *
 * A designer is not asked to star a repository they do not have, and every gesture
 * needs a page to happen on — so a channel that is absent simply contributes nothing.
 * `label` is what names the destination (and therefore its key), because two GitHub
 * gestures with no names would be one button twice.
 *
 * A GitHub gesture belongs to a repository rather than to a profile: an issue is opened
 * on a project, and `/issues/new` on a profile page is not a page at all.
 */
const GESTURES: { icon: string; provider: SupportProvider; base?: 'repo'; path?: string; en: AuthoredVariant; fa: AuthoredVariant }[] = [
  {
    icon: 'github',
    provider: 'github',
    base: 'repo',
    en: {
      provider: 'github',
      label: 'Star the repository',
      instruction: 'Press Star on the repository page — it takes a few seconds and puts the project in front of other developers.',
      active: true,
    },
    fa: {
      provider: 'github',
      label: 'ستاره دادن به مخزن',
      instruction: 'دکمهٔ Star را در صفحهٔ مخزن بزنید؛ چند ثانیه بیشتر نمی‌گیرد و پروژه را جلوی توسعه‌دهندگان دیگر می‌گذارد.',
      active: true,
    },
  },
  {
    icon: 'github',
    provider: 'github',
    base: 'repo',
    path: '/issues/new',
    en: {
      provider: 'github',
      label: 'Report a bug',
      instruction: 'Open an issue with the steps to reproduce, the result you expected and what you actually saw.',
      active: true,
    },
    fa: {
      provider: 'github',
      label: 'گزارش باگ',
      instruction: 'یک issue با مراحل بازتولید، نتیجهٔ مورد انتظار و آنچه در عمل دیدید باز کنید.',
      active: true,
    },
  },
  {
    icon: 'telegram',
    provider: 'telegram',
    en: {
      provider: 'telegram',
      label: 'Join the channel',
      instruction: 'Follow the channel to see the releases as they ship.',
      active: true,
    },
    fa: {
      provider: 'telegram',
      label: 'عضویت در کانال',
      instruction: 'کانال را دنبال کنید تا نسخه‌های جدید را همان زمان انتشار ببینید.',
      active: true,
    },
  },
  {
    icon: 'instagram',
    provider: 'instagram',
    en: {
      provider: 'instagram',
      label: 'Follow on Instagram',
      instruction: 'Follow the account to see the work in progress between releases.',
      active: true,
    },
    fa: {
      provider: 'instagram',
      label: 'دنبال کردن در اینستاگرام',
      instruction: 'حساب را دنبال کنید تا کار در حال پیشرفت را میان دو نسخه ببینید.',
      active: true,
    },
  },
  {
    icon: 'x',
    provider: 'twitter',
    en: {
      provider: 'twitter',
      label: 'Follow on X',
      instruction: 'Follow the account, and repost a thread when it is useful to someone you know.',
      active: true,
    },
    fa: {
      provider: 'twitter',
      label: 'دنبال کردن در ایکس',
      instruction: 'حساب را دنبال کنید و هر وقت یک رشته‌نوشته برای کسی به درد خورد، آن را بازنشر کنید.',
      active: true,
    },
  },
  {
    icon: 'linkedin',
    provider: 'linkedin',
    en: {
      provider: 'linkedin',
      label: 'Follow on LinkedIn',
      instruction: 'Following the page carries the releases into a feed where developers read them.',
      active: true,
    },
    fa: {
      provider: 'linkedin',
      label: 'دنبال کردن در لینکدین',
      instruction: 'دنبال کردن صفحه، نسخه‌ها را به فیدی می‌برد که توسعه‌دهندگان می‌خوانند.',
      active: true,
    },
  },
];

/** The gestures this persona can honestly ask for, capped at three so the tile stays scannable. */
function gesturesFor(id: Identity): { en: AuthoredVariant[]; fa: AuthoredVariant[] } {
  const en: AuthoredVariant[] = [];
  const fa: AuthoredVariant[] = [];

  for (const gesture of GESTURES) {
    const page = gesture.base === 'repo' ? id.repo : id.channel(gesture.icon);
    if (!page || en.length >= 3) continue;

    en.push({ ...gesture.en, href: `${page}${gesture.path ?? ''}` });
    fa.push({ ...gesture.fa, href: `${page}${gesture.path ?? ''}` });
  }

  return { en, fa };
}

/** Every method, authored for both locales from one identity. */
function methodsFor(id: Identity, gestures: { en: AuthoredVariant[]; fa: AuthoredVariant[] }): Localized<MethodContent> {
  /** Money rails, identical on both sites apart from the words and the account name. */
  const rails: Localized<MethodContent> = {
    en: [
      {
        title: 'Support platforms',
        slug: 'platforms',
        description: 'Backing on a page that already knows how to take it — the amount is charged by the platform, never by this site.',
        mode: 'platform',
        region: 'global',
        currency: 'usd',
        active: true,
        order: 0,
        variants: [
          {
            provider: 'buymeacoffee',
            href: `https://buymeacoffee.com/${id.handle}`,
            currency: 'usd',
            customAmount: true,
            suggestedAmounts: [5, 10, 25],
            minAmount: 3,
            maxAmount: 500,
            active: true,
          },
          {
            provider: 'github',
            href: `https://github.com/sponsors/${id.handle}`,
            currency: 'usd',
            customAmount: true,
            suggestedAmounts: [5, 10, 25],
            minAmount: 1,
            maxAmount: 2000,
            active: true,
          },
          {
            // A tier is not a free number: the supporter picks one of the three,
            // which is the only way this rail prices itself.
            provider: 'patreon',
            href: `https://www.patreon.com/${id.handle}`,
            currency: 'usd',
            customAmount: false,
            suggestedAmounts: [10, 25, 50],
            minAmount: 10,
            maxAmount: 50,
            active: true,
          },
          {
            // One coffee, one price: the destination with nothing free to type.
            provider: 'kofi',
            href: `https://ko-fi.com/${id.handle}`,
            currency: 'usd',
            amount: 5,
            customAmount: false,
            active: true,
          },
          {
            provider: 'coffeebede',
            href: `https://coffeebede.ir/${id.handle}`,
            currency: 'toman',
            region: 'ir',
            customAmount: true,
            suggestedAmounts: [200000, 500000, 1000000],
            minAmount: 50000,
            maxAmount: 5000000,
            active: true,
          },
        ],
      },
      {
        title: 'Card to card',
        slug: 'card-to-card',
        description: 'Transfer from your own banking application. The card number, the QR and a reference are shown before you send.',
        mode: 'card',
        region: 'ir',
        currency: 'toman',
        active: true,
        order: 1,
        variants: [
          {
            number: '6037991124246848',
            holder: id.holder,
            currency: 'toman',
            customAmount: true,
            suggestedAmounts: [250000, 500000, 1000000],
            minAmount: 50000,
            maxAmount: 50000000,
            active: true,
          },
          {
            iban: 'IR220610505409585374874655',
            holder: id.holder,
            currency: 'toman',
            customAmount: true,
            suggestedAmounts: [500000, 1000000, 2000000],
            minAmount: 100000,
            maxAmount: 100000000,
            active: true,
          },
        ],
      },
      {
        title: 'International transfer',
        slug: 'international-transfer',
        description: 'For supporters outside Iran: a bank transfer to an IBAN and its SWIFT code, in euros.',
        mode: 'card',
        region: 'global',
        currency: 'eur',
        active: true,
        order: 2,
        variants: [
          {
            iban: 'GB33BUKB20201555555555',
            bic: 'BUKBGB22',
            // An international account is registered in Latin script whatever the
            // site's own language is, so this name does not follow the locale.
            holder: id.holder,
            currency: 'eur',
            customAmount: true,
            suggestedAmounts: [10, 25, 50],
            minAmount: 5,
            maxAmount: 5000,
            active: true,
          },
        ],
      },
      {
        title: 'Tether (USDT)',
        slug: 'usdt',
        description: 'Send from your own wallet on the chain you already use. Check the network before you confirm.',
        mode: 'crypto',
        region: 'global',
        currency: 'tether',
        active: true,
        order: 3,
        variants: [
          {
            network: 'tron',
            asset: 'tether',
            address: 'TLsush8GuyoD5o1z4N24gEtrsE1ah6j9ha',
            customAmount: true,
            suggestedAmounts: [5, 10, 25],
            minAmount: 5,
            active: true,
          },
          {
            network: 'ethereum',
            asset: 'tether',
            address: '0x146578e3145d9fcd38eda9825ebb91576456482e',
            customAmount: true,
            suggestedAmounts: [5, 10, 25],
            minAmount: 5,
            active: true,
          },
          {
            network: 'ton',
            asset: 'tether',
            address: 'UQrLTWtfswO9E0FqBlGmF3lDazRvkYSy3xqQ3TnLVf5c5w',
            customAmount: true,
            suggestedAmounts: [5, 10, 25],
            minAmount: 5,
            active: true,
          },
        ],
      },
      {
        // A second wallet, because a Bitcoin rail is a different thing to pay into:
        // the amounts are fractions of a coin and the ledgers share no address shape.
        title: 'Bitcoin (BTC)',
        slug: 'btc',
        description: 'On-chain or over Lightning, whichever your wallet already does.',
        mode: 'crypto',
        region: 'global',
        currency: 'btc',
        active: true,
        order: 4,
        variants: [
          {
            network: 'bitcoin',
            asset: 'btc',
            address: 'bc1qhgo3prvsdws20jwv8dupjmtvepac7o8ek4kh8e',
            customAmount: true,
            suggestedAmounts: [0.0005, 0.001, 0.005],
            minAmount: 0.0001,
            active: true,
          },
          {
            network: 'lightning',
            asset: 'btc',
            address: id.lightning,
            customAmount: true,
            suggestedAmounts: [0.0001, 0.0005, 0.001],
            minAmount: 0.0001,
            active: true,
          },
        ],
      },
      {
        title: 'On-site card payment',
        slug: 'on-site-payment',
        description: 'A gateway checkout that never leaves this page, and returns here when it is done.',
        mode: 'gateway',
        region: 'ir',
        currency: 'toman',
        // Unpublished until the gateway credentials exist in the environment: an
        // invisible method beats one that fails at the supporter's last step.
        active: false,
        order: 5,
        variants: [
          { provider: 'zarinpal', currency: 'toman', customAmount: true, suggestedAmounts: [100000, 300000, 500000], minAmount: 50000, active: true },
          { provider: 'idpay', currency: 'toman', customAmount: true, suggestedAmounts: [100000, 300000, 500000], minAmount: 50000, active: true },
        ],
      },
    ],
    fa: [
      {
        title: 'پلتفرم‌های حمایت',
        slug: 'platforms',
        description: 'حمایت در صفحه‌ای که از پیش می‌داند چگونه دریافت کند؛ مبلغ توسط آن پلتفرم گرفته می‌شود، نه توسط این سایت.',
        mode: 'platform',
        region: 'global',
        currency: 'usd',
        active: true,
        order: 0,
        variants: [
          {
            provider: 'buymeacoffee',
            href: `https://buymeacoffee.com/${id.handle}`,
            currency: 'usd',
            customAmount: true,
            suggestedAmounts: [5, 10, 25],
            minAmount: 3,
            maxAmount: 500,
            active: true,
          },
          {
            provider: 'github',
            href: `https://github.com/sponsors/${id.handle}`,
            currency: 'usd',
            customAmount: true,
            suggestedAmounts: [5, 10, 25],
            minAmount: 1,
            maxAmount: 2000,
            active: true,
          },
          {
            provider: 'patreon',
            href: `https://www.patreon.com/${id.handle}`,
            currency: 'usd',
            customAmount: false,
            suggestedAmounts: [10, 25, 50],
            minAmount: 10,
            maxAmount: 50,
            active: true,
          },
          {
            // یک کافی، یک قیمت: مقصدی که عدد آزادی برای نوشتن ندارد.
            provider: 'kofi',
            href: `https://ko-fi.com/${id.handle}`,
            currency: 'usd',
            amount: 5,
            customAmount: false,
            active: true,
          },
          {
            provider: 'coffeebede',
            href: `https://coffeebede.ir/${id.handle}`,
            currency: 'toman',
            region: 'ir',
            customAmount: true,
            suggestedAmounts: [200000, 500000, 1000000],
            minAmount: 50000,
            maxAmount: 5000000,
            active: true,
          },
        ],
      },
      {
        title: 'کارت به کارت',
        slug: 'card-to-card',
        description: 'با اپلیکیشن بانکی خودتان انتقال دهید؛ پیش از ارسال، شمارهٔ کارت، کد QR و شناسه را می‌بینید.',
        mode: 'card',
        region: 'ir',
        currency: 'toman',
        active: true,
        order: 1,
        variants: [
          {
            number: '6037991124246848',
            holder: id.holder,
            currency: 'toman',
            customAmount: true,
            suggestedAmounts: [250000, 500000, 1000000],
            minAmount: 50000,
            maxAmount: 50000000,
            active: true,
          },
          {
            iban: 'IR220610505409585374874655',
            holder: id.holder,
            currency: 'toman',
            customAmount: true,
            suggestedAmounts: [500000, 1000000, 2000000],
            minAmount: 100000,
            maxAmount: 100000000,
            active: true,
          },
        ],
      },
      {
        title: 'حوالهٔ بانکی بین‌المللی',
        slug: 'international-transfer',
        description: 'برای حامیان خارج از ایران: حواله به آی‌بن و کد سوییفت آن، به یورو.',
        mode: 'card',
        region: 'global',
        currency: 'eur',
        active: true,
        order: 2,
        variants: [
          {
            iban: 'GB33BUKB20201555555555',
            bic: 'BUKBGB22',
            holder: id.holder,
            currency: 'eur',
            customAmount: true,
            suggestedAmounts: [10, 25, 50],
            minAmount: 5,
            maxAmount: 5000,
            active: true,
          },
        ],
      },
      {
        title: 'تتر (USDT)',
        slug: 'usdt',
        description: 'از کیف پول خودتان و روی زنجیره‌ای که با آن کار می‌کنید ارسال کنید؛ پیش از تأیید شبکه را بررسی کنید.',
        mode: 'crypto',
        region: 'global',
        currency: 'tether',
        active: true,
        order: 3,
        variants: [
          {
            network: 'tron',
            asset: 'tether',
            address: 'TLsush8GuyoD5o1z4N24gEtrsE1ah6j9ha',
            customAmount: true,
            suggestedAmounts: [5, 10, 25],
            minAmount: 5,
            active: true,
          },
          {
            network: 'ethereum',
            asset: 'tether',
            address: '0x146578e3145d9fcd38eda9825ebb91576456482e',
            customAmount: true,
            suggestedAmounts: [5, 10, 25],
            minAmount: 5,
            active: true,
          },
          {
            network: 'ton',
            asset: 'tether',
            address: 'UQrLTWtfswO9E0FqBlGmF3lDazRvkYSy3xqQ3TnLVf5c5w',
            customAmount: true,
            suggestedAmounts: [5, 10, 25],
            minAmount: 5,
            active: true,
          },
        ],
      },
      {
        title: 'بیت‌کوین (BTC)',
        slug: 'btc',
        description: 'روی شبکهٔ اصلی یا از طریق لایتنینگ، هر کدام که کیف پول شما پشتیبانی می‌کند.',
        mode: 'crypto',
        region: 'global',
        currency: 'btc',
        active: true,
        order: 4,
        variants: [
          {
            network: 'bitcoin',
            asset: 'btc',
            address: 'bc1qhgo3prvsdws20jwv8dupjmtvepac7o8ek4kh8e',
            customAmount: true,
            suggestedAmounts: [0.0005, 0.001, 0.005],
            minAmount: 0.0001,
            active: true,
          },
          {
            network: 'lightning',
            asset: 'btc',
            address: id.lightning,
            customAmount: true,
            suggestedAmounts: [0.0001, 0.0005, 0.001],
            minAmount: 0.0001,
            active: true,
          },
        ],
      },
      {
        title: 'پرداخت با کارت در این سایت',
        slug: 'on-site-payment',
        description: 'پرداخت از طریق درگاه، بدون خروج از این صفحه و بازگشت به همین‌جا پس از پایان.',
        mode: 'gateway',
        region: 'ir',
        currency: 'toman',
        // تا کلید درگاه در محیط اجرا تنظیم نشده منتشر نمی‌شود: یک روش پنهان بهتر
        // از روشی است که در آخرین گام به حامی خطا می‌دهد.
        active: false,
        order: 5,
        variants: [
          { provider: 'zarinpal', currency: 'toman', customAmount: true, suggestedAmounts: [100000, 300000, 500000], minAmount: 50000, active: true },
          { provider: 'idpay', currency: 'toman', customAmount: true, suggestedAmounts: [100000, 300000, 500000], minAmount: 50000, active: true },
        ],
      },
    ],
  };

  /** The gestures chapter only exists when the persona has channels to ask about. */
  if (gestures.en.length && gestures.fa.length) {
    const gesture = (title: string, description: string, order: number): MethodContent => ({
      title,
      slug: 'free-support',
      description,
      mode: 'action',
      region: 'global',
      // A gesture is not a transaction: its destinations carry no amount at all.
      currency: 'toman',
      active: true,
      order,
      variants: [],
    });

    rails.en.push({
      ...gesture(
        'Support without money',
        'A star, a follow or a well-written bug report: none of these asks for money and all of them keep the project visible.',
        6
      ),
      variants: gestures.en,
    });
    rails.fa.push({
      ...gesture('حمایت بدون پول', 'یک ستاره، یک دنبال کردن یا یک گزارش باگ دقیق: هیچ‌کدام پول نمی‌خواهند و همه پروژه را جلو می‌برند.', 6),
      variants: gestures.fa,
    });
  }

  return rails;
}

/** Stamp the derived keys onto every destination of a method. */
function withKeys(method: MethodContent): Content<IDonation> {
  return { ...method, variants: withUniqueKeys(method.mode, method.variants) };
}

/**
 * Seed one document per payment method, per locale, so a fresh database shows the
 * whole support page in action. Returns the inserted documents: the supporters wall
 * is built from them, and a gift has to point at a rail that exists.
 */
export const seedDonationData = async (persona: Persona) => {
  const rails = methodsFor(identityOf(persona), gesturesFor(identityOf(persona)));
  const docs = withBothLangs({
    en: rails.en.map(withKeys),
    fa: rails.fa.map(withKeys),
  });

  return donationModel.insertMany(docs);
};
