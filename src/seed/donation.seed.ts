import { donationModel } from '@/features/support/donation.model';
import type { IDonation } from '@/features/support/types';
import { withBothLangs, type Content, type Localized, type Persona } from '@/seed/personas/types';

/**
 * Support methods for the demo persona.
 *
 * Unlike projects or products, a method is not biographical: it is plumbing. So the
 * set is authored once, in both languages, and every method the site can render
 * appears exactly once — the support platforms (Buy Me a Coffee and GitHub Sponsors
 * abroad, کافی‌بده at home), card-to-card, a stablecoin wallet, an in-site gateway
 * checkout left unpublished until its credentials exist, and the block of gestures
 * that ask for a minute instead of money.
 *
 * Each method carries its own destinations inside it: three chains for the wallet,
 * a card and a sheba for the bank transfer, the pages a free gesture is made on.
 * That is what the supporter picks between in the wizard, and what the dashboard
 * edits — a method never shows a destination that belongs to another one.
 *
 * Two of the rails here are the same rail in two markets. Card-to-card at home is a
 * sixteen-digit card and a sheba, paid from a banking application; abroad the same mode
 * is an international transfer to an IBAN with its SWIFT code, so the demo carries one
 * method of each and the codes on them are the shapes their standards define — a card
 * whose check digit holds, an IBAN whose checksum holds. The wallet names its coin and
 * its ledger on every destination: USDT on TRON is one destination, TRX on TRON another.
 *
 * The destinations are obvious placeholders (`your-name`, a `DEADBEEF` address, a
 * demo card on a real bank prefix), because seeding real coordinates into a demo
 * database would only ever end with a supporter paying the wrong person. They are
 * still the shape each standard defines — the check digit of the card and the checksum
 * of every IBAN here hold — so the demo can be edited and saved without a validation
 * trip. Replace them in the dashboard before going live.
 */

type MethodContent = Content<IDonation>;

const METHODS: Localized<MethodContent> = {
  en: [
    {
      title: 'Support platforms',
      slug: 'platforms',
      description: 'Backing on a page that already knows how to take it: Buy Me a Coffee abroad, Coffeebede in Iran.',
      mode: 'platform',
      region: 'global',
      // Each destination prices itself: the two pages abroad in dollars, the Iranian
      // page in toman — one method, three destinations, different amount policies.
      variants: [
        {
          key: 'buymeacoffee',
          provider: 'buymeacoffee',
          href: 'https://buymeacoffee.com/your-name',
          currency: 'usd',
          region: 'global',
          customAmount: true,
          suggestedAmounts: [5, 10, 25],
          active: true,
        },
        {
          key: 'github',
          provider: 'github',
          href: 'https://github.com/sponsors/your-name',
          currency: 'usd',
          region: 'global',
          customAmount: true,
          suggestedAmounts: [5, 10, 25],
          active: true,
        },
        {
          key: 'coffeebede',
          provider: 'coffeebede',
          href: 'https://coffeebede.com/your-name',
          currency: 'toman',
          region: 'ir',
          customAmount: true,
          suggestedAmounts: [200000, 500000, 1000000],
          active: true,
        },
      ],
      currency: 'usd',
      active: true,
      order: 0,
    },
    {
      title: 'Card to card',
      slug: 'card-to-card',
      description: 'Transfer from your own banking application. A QR and the reference are shown before you send.',
      mode: 'card',
      region: 'ir',
      variants: [
        {
          key: 'card',
          number: '6037991000012348',
          holder: 'Demo Owner',
          currency: 'toman',
          customAmount: true,
          suggestedAmounts: [250000, 500000, 1000000],
          minAmount: 50000,
          maxAmount: 50000000,
          active: true,
        },
        {
          key: 'sheba',
          iban: 'IR700120000000000000000000',
          holder: 'Demo Owner',
          currency: 'toman',
          customAmount: true,
          suggestedAmounts: [250000, 500000, 1000000],
          minAmount: 50000,
          maxAmount: 50000000,
          active: true,
        },
      ],
      currency: 'toman',
      active: true,
      order: 1,
    },
    {
      title: 'International transfer',
      slug: 'international-transfer',
      description: 'For supporters outside Iran: a bank transfer to an IBAN and its SWIFT code, in euros.',
      mode: 'card',
      region: 'global',
      // The same rail, the other market: an account number a banking app in Iran has
      // never heard of, and a SWIFT code an Iranian card transfer does not use.
      variants: [
        {
          key: 'iban',
          iban: 'GB74BARC20000012345678',
          bic: 'BARCGB22',
          holder: 'Demo Owner',
          currency: 'eur',
          region: 'global',
          customAmount: true,
          suggestedAmounts: [10, 25, 50],
          minAmount: 5,
          maxAmount: 5000,
          active: true,
        },
      ],
      currency: 'eur',
      active: true,
      order: 2,
    },
    {
      title: 'Tether (USDT)',
      slug: 'usdt',
      description: 'Send from your own wallet on the chain you already use. Check the network before you confirm.',
      mode: 'crypto',
      region: 'global',
      variants: [
        {
          key: 'tron',
          network: 'tron',
          asset: 'tether',
          address: 'TYourTronAddressHereDemo1234567899',
          currency: 'tether',
          customAmount: true,
          suggestedAmounts: [5, 10, 25],
          minAmount: 1,
          active: true,
        },
        {
          key: 'ethereum',
          network: 'ethereum',
          asset: 'tether',
          address: '0xDEADBEEF000000000000000000000000000000ab',
          currency: 'tether',
          customAmount: true,
          suggestedAmounts: [5, 10, 25],
          minAmount: 1,
          active: true,
        },
        {
          key: 'ton',
          network: 'ton',
          asset: 'tether',
          address: 'UQExampleAddressReplaceMe00000000000000000000000',
          currency: 'tether',
          customAmount: true,
          suggestedAmounts: [5, 10, 25],
          minAmount: 1,
          active: true,
        },
      ],
      currency: 'tether',
      active: true,
      order: 3,
    },
    {
      title: 'Card payment on this site',
      slug: 'on-site-payment',
      description: 'A gateway checkout that never leaves this page, and returns here when it is done.',
      mode: 'gateway',
      region: 'ir',
      variants: [
        {
          key: 'zarinpal',
          provider: 'zarinpal',
          currency: 'toman',
          customAmount: true,
          suggestedAmounts: [100000, 300000, 500000],
          minAmount: 50000,
          active: true,
        },
      ],
      currency: 'toman',
      // Unpublished until the gateway credentials exist in the environment: an
      // invisible method beats one that fails at the last step.
      active: false,
      order: 4,
    },
    {
      title: 'Support without money',
      slug: 'free-support',
      description: 'A star, a follow or a well-written bug report: these cost nothing and still move the project forward.',
      mode: 'action',
      region: 'global',
      variants: [
        {
          key: 'star',
          provider: 'github',
          href: 'https://github.com/your-name/portfolio',
          label: 'Star the repository',
          instruction: 'Press Star on the repository page — it takes a few seconds and puts the project in front of other developers.',
          active: true,
        },
        {
          key: 'telegram',
          provider: 'telegram',
          href: 'https://t.me/your_channel',
          label: 'Join the channel',
          instruction: 'Follow the channel to see the releases as they ship.',
          active: true,
        },
        {
          key: 'bug-report',
          provider: 'custom',
          href: 'https://github.com/your-name/portfolio/issues/new',
          label: 'Report a bug',
          instruction: 'Open an issue with the steps to reproduce, the expected result and what you actually saw.',
          active: true,
        },
      ],
      // A gesture is not a transaction: its destinations carry no amount at all.
      currency: 'toman',
      active: true,
      order: 5,
    },
  ],
  fa: [
    {
      title: 'پلتفرم‌های حمایت',
      slug: 'platforms',
      description: 'حمایت در صفحه‌ای که از پیش می‌داند چگونه دریافت کند: Buy Me a Coffee برای خارج و کافی‌بده برای ایران.',
      mode: 'platform',
      region: 'global',
      // هر مقصد خودش قیمت‌گذاری می‌کند: دو صفحهٔ خارجی به دلار، صفحهٔ ایرانی به تومان.
      variants: [
        {
          key: 'buymeacoffee',
          provider: 'buymeacoffee',
          href: 'https://buymeacoffee.com/your-name',
          currency: 'usd',
          region: 'global',
          customAmount: true,
          suggestedAmounts: [5, 10, 25],
          active: true,
        },
        {
          key: 'github',
          provider: 'github',
          href: 'https://github.com/sponsors/your-name',
          currency: 'usd',
          region: 'global',
          customAmount: true,
          suggestedAmounts: [5, 10, 25],
          active: true,
        },
        {
          key: 'coffeebede',
          provider: 'coffeebede',
          href: 'https://coffeebede.com/your-name',
          currency: 'toman',
          region: 'ir',
          customAmount: true,
          suggestedAmounts: [200000, 500000, 1000000],
          active: true,
        },
      ],
      currency: 'usd',
      active: true,
      order: 0,
    },
    {
      title: 'کارت به کارت',
      slug: 'card-to-card',
      description: 'با اپلیکیشن بانکی خودتان انتقال دهید؛ پیش از ارسال، کد QR و شناسه را می‌بینید.',
      mode: 'card',
      region: 'ir',
      variants: [
        {
          key: 'card',
          number: '6037991000012348',
          holder: 'صاحب حساب نمونه',
          currency: 'toman',
          customAmount: true,
          suggestedAmounts: [250000, 500000, 1000000],
          minAmount: 50000,
          maxAmount: 50000000,
          active: true,
        },
        {
          key: 'sheba',
          iban: 'IR700120000000000000000000',
          holder: 'صاحب حساب نمونه',
          currency: 'toman',
          customAmount: true,
          suggestedAmounts: [250000, 500000, 1000000],
          minAmount: 50000,
          maxAmount: 50000000,
          active: true,
        },
      ],
      currency: 'toman',
      active: true,
      order: 1,
    },
    {
      title: 'حوالهٔ بانکی بین‌المللی',
      slug: 'international-transfer',
      description: 'برای حامیان خارج از ایران: حواله به آی‌بن و کد سوییفت، به یورو.',
      mode: 'card',
      region: 'global',
      // همان ریل، بازار دیگر: حسابی که اپلیکیشن بانکی ایران آن را نمی‌شناسد و کد
      // سوییفتی که کارت‌به‌کارت داخلی هرگز نمی‌خواند.
      variants: [
        {
          key: 'iban',
          iban: 'GB74BARC20000012345678',
          bic: 'BARCGB22',
          holder: 'صاحب حساب نمونه',
          currency: 'eur',
          region: 'global',
          customAmount: true,
          suggestedAmounts: [10, 25, 50],
          minAmount: 5,
          maxAmount: 5000,
          active: true,
        },
      ],
      currency: 'eur',
      active: true,
      order: 2,
    },
    {
      title: 'تتر (USDT)',
      slug: 'usdt',
      description: 'از کیف پول خودتان و روی زنجیره‌ای که با آن کار می‌کنید ارسال کنید؛ پیش از تأیید، شبکه را بررسی کنید.',
      mode: 'crypto',
      region: 'global',
      variants: [
        {
          key: 'tron',
          network: 'tron',
          asset: 'tether',
          address: 'TYourTronAddressHereDemo1234567899',
          currency: 'tether',
          customAmount: true,
          suggestedAmounts: [5, 10, 25],
          minAmount: 1,
          active: true,
        },
        {
          key: 'ethereum',
          network: 'ethereum',
          asset: 'tether',
          address: '0xDEADBEEF000000000000000000000000000000ab',
          currency: 'tether',
          customAmount: true,
          suggestedAmounts: [5, 10, 25],
          minAmount: 1,
          active: true,
        },
        {
          key: 'ton',
          network: 'ton',
          asset: 'tether',
          address: 'UQExampleAddressReplaceMe00000000000000000000000',
          currency: 'tether',
          customAmount: true,
          suggestedAmounts: [5, 10, 25],
          minAmount: 1,
          active: true,
        },
      ],
      currency: 'tether',
      active: true,
      order: 3,
    },
    {
      title: 'پرداخت با کارت در این سایت',
      slug: 'on-site-payment',
      description: 'پرداخت از طریق درگاه، بدون خروج از این صفحه و بازگشت به همین‌جا پس از پایان.',
      mode: 'gateway',
      region: 'ir',
      variants: [
        {
          key: 'zarinpal',
          provider: 'zarinpal',
          currency: 'toman',
          customAmount: true,
          suggestedAmounts: [100000, 300000, 500000],
          minAmount: 50000,
          active: true,
        },
      ],
      currency: 'toman',
      // تا کلیدهای درگاه در محیط اجرا تنظیم نشده، منتشر نمی‌شود: یک روش پنهان
      // بهتر از روشی است که در آخرین گام خطا می‌دهد.
      active: false,
      order: 4,
    },
    {
      title: 'حمایت بدون پول',
      slug: 'free-support',
      description: 'یک ستاره، یک دنبال کردن یا یک گزارش باگ دقیق: هیچ‌کدام هزینه ندارد و همه پروژه را جلو می‌برند.',
      mode: 'action',
      region: 'global',
      variants: [
        {
          key: 'star',
          provider: 'github',
          href: 'https://github.com/your-name/portfolio',
          label: 'ستاره دادن به مخزن',
          instruction: 'دکمهٔ Star را در صفحهٔ مخزن بزنید؛ چند ثانیه بیشتر نمی‌گیرد و پروژه را جلوی توسعه‌دهندگان دیگر می‌گذارد.',
          active: true,
        },
        {
          key: 'telegram',
          provider: 'telegram',
          href: 'https://t.me/your_channel',
          label: 'عضویت در کانال',
          instruction: 'کانال را دنبال کنید تا نسخه‌های جدید را همان زمان ببینید.',
          active: true,
        },
        {
          key: 'bug-report',
          provider: 'custom',
          href: 'https://github.com/your-name/portfolio/issues/new',
          label: 'گزارش باگ',
          instruction: 'یک issue با مراحل بازتولید، نتیجهٔ مورد انتظار و آنچه در عمل دیدید باز کنید.',
          active: true,
        },
      ],
      // یک اقدام تراکنش نیست: مقصدانش هیچ مبلغی ندارند.
      currency: 'toman',
      active: true,
      order: 5,
    },
  ],
};

/**
 * Seed one document per payment method so a fresh database shows the whole support
 * page in action. A persona never changes these; they are the site's payment
 * plumbing. Returns the inserted count.
 */
export const seedDonationData = async (_persona: Persona) => {
  const docs = withBothLangs(METHODS);
  if (!docs.length) return 0;

  const inserted = await donationModel.insertMany(docs);
  return inserted.length;
};
