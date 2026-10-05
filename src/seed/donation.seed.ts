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
 * The destinations are obvious placeholders (`your-name`, an all-zero IBAN, a
 * 16-digit fake card), because seeding real coordinates into a demo database would
 * only ever end with a supporter paying the wrong person. Replace them in the
 * dashboard before going live.
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
      variants: [
        {
          key: 'buymeacoffee',
          provider: 'buymeacoffee',
          href: 'https://buymeacoffee.com/your-name',
          currency: 'usd',
          region: 'global',
          active: true,
        },
        { key: 'github', provider: 'github', href: 'https://github.com/sponsors/your-name', currency: 'usd', region: 'global', active: true },
        { key: 'coffeebede', provider: 'coffeebede', href: 'https://coffeebede.com/your-name', currency: 'toman', region: 'ir', active: true },
      ],
      // The method quotes abroad; the Iranian page prices itself in toman.
      amount: 0,
      currency: 'usd',
      customAmount: true,
      suggestedAmounts: [5, 10, 25],
      minAmount: 0,
      maxAmount: 0,
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
        { key: 'card', number: '6037991122223333', holder: 'Demo Owner', active: true },
        { key: 'sheba', iban: 'IR000000000000000000000000', holder: 'Demo Owner', active: true },
      ],
      amount: 0,
      currency: 'toman',
      customAmount: true,
      suggestedAmounts: [250000, 500000, 1000000],
      minAmount: 50000,
      maxAmount: 50000000,
      active: true,
      order: 1,
    },
    {
      title: 'Tether (USDT)',
      slug: 'usdt',
      description: 'Send from your own wallet on the chain you already use. Check the network before you confirm.',
      mode: 'crypto',
      region: 'global',
      variants: [
        { key: 'tron', network: 'tron', address: 'TExampleWalletAddressReplaceMe1234', active: true },
        { key: 'ethereum', network: 'ethereum', address: '0xExampleAddressReplaceMe000000000000000000', active: true },
        { key: 'ton', network: 'ton', address: 'UQExampleAddressReplaceMe0000000000000000000000', active: true },
      ],
      amount: 0,
      currency: 'tether',
      customAmount: true,
      suggestedAmounts: [5, 10, 25],
      minAmount: 1,
      maxAmount: 0,
      active: true,
      order: 2,
    },
    {
      title: 'Card payment on this site',
      slug: 'on-site-payment',
      description: 'A gateway checkout that never leaves this page, and returns here when it is done.',
      mode: 'gateway',
      region: 'ir',
      variants: [{ key: 'zarinpal', provider: 'zarinpal', active: true }],
      amount: 0,
      currency: 'toman',
      customAmount: true,
      suggestedAmounts: [100000, 300000, 500000],
      minAmount: 50000,
      maxAmount: 0,
      // Unpublished until the gateway credentials exist in the environment: an
      // invisible method beats one that fails at the last step.
      active: false,
      order: 3,
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
      // A gesture is not a transaction: no amount, no currency choice, no limits.
      amount: 0,
      currency: 'toman',
      customAmount: false,
      suggestedAmounts: [],
      minAmount: 0,
      maxAmount: 0,
      active: true,
      order: 4,
    },
  ],
  fa: [
    {
      title: 'پلتفرم‌های حمایت',
      slug: 'platforms',
      description: 'حمایت در صفحه‌ای که از پیش می‌داند چگونه دریافت کند: Buy Me a Coffee برای خارج و کافی‌بده برای ایران.',
      mode: 'platform',
      region: 'global',
      variants: [
        {
          key: 'buymeacoffee',
          provider: 'buymeacoffee',
          href: 'https://buymeacoffee.com/your-name',
          currency: 'usd',
          region: 'global',
          active: true,
        },
        { key: 'github', provider: 'github', href: 'https://github.com/sponsors/your-name', currency: 'usd', region: 'global', active: true },
        { key: 'coffeebede', provider: 'coffeebede', href: 'https://coffeebede.com/your-name', currency: 'toman', region: 'ir', active: true },
      ],
      // روش بر حسب دلار قیمت می‌گیرد؛ صفحهٔ ایرانی خودش به تومان.
      amount: 0,
      currency: 'usd',
      customAmount: true,
      suggestedAmounts: [5, 10, 25],
      minAmount: 0,
      maxAmount: 0,
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
        { key: 'card', number: '6037991122223333', holder: 'صاحب حساب نمونه', active: true },
        { key: 'sheba', iban: 'IR000000000000000000000000', holder: 'صاحب حساب نمونه', active: true },
      ],
      amount: 0,
      currency: 'toman',
      customAmount: true,
      suggestedAmounts: [250000, 500000, 1000000],
      minAmount: 50000,
      maxAmount: 50000000,
      active: true,
      order: 1,
    },
    {
      title: 'تتر (USDT)',
      slug: 'usdt',
      description: 'از کیف پول خودتان و روی زنجیره‌ای که با آن کار می‌کنید ارسال کنید؛ پیش از تأیید، شبکه را بررسی کنید.',
      mode: 'crypto',
      region: 'global',
      variants: [
        { key: 'tron', network: 'tron', address: 'TExampleWalletAddressReplaceMe1234', active: true },
        { key: 'ethereum', network: 'ethereum', address: '0xExampleAddressReplaceMe000000000000000000', active: true },
        { key: 'ton', network: 'ton', address: 'UQExampleAddressReplaceMe0000000000000000000000', active: true },
      ],
      amount: 0,
      currency: 'tether',
      customAmount: true,
      suggestedAmounts: [5, 10, 25],
      minAmount: 1,
      maxAmount: 0,
      active: true,
      order: 2,
    },
    {
      title: 'پرداخت با کارت در این سایت',
      slug: 'on-site-payment',
      description: 'پرداخت از طریق درگاه، بدون خروج از این صفحه و بازگشت به همین‌جا پس از پایان.',
      mode: 'gateway',
      region: 'ir',
      variants: [{ key: 'zarinpal', provider: 'zarinpal', active: true }],
      amount: 0,
      currency: 'toman',
      customAmount: true,
      suggestedAmounts: [100000, 300000, 500000],
      minAmount: 50000,
      maxAmount: 0,
      // تا کلیدهای درگاه در محیط اجرا تنظیم نشده، منتشر نمی‌شود: یک روش پنهان
      // بهتر از روشی است که در آخرین گام خطا می‌دهد.
      active: false,
      order: 3,
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
      // یک اقدام تراکنش نیست: بدون مبلغ، بدون انتخاب واحد پول و بدون حد.
      amount: 0,
      currency: 'toman',
      customAmount: false,
      suggestedAmounts: [],
      minAmount: 0,
      maxAmount: 0,
      active: true,
      order: 4,
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
