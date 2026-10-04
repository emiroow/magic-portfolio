import { Coffee, FolderGit2, Home, NotebookText, ShoppingBag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  AppLocale,
  CryptoNetwork,
  DonationMode,
  DonationRegion,
  GatewayId,
  LinkProvider,
  ProductCurrency,
  ReferralProvider,
  SupporterStatus,
} from '@/types';

/**
 * A single dock entry. `href` is locale-relative (the localized `Link` wrapper
 * prepends the active locale); `label` is a key under the `navbar` namespace.
 */
export interface NavbarRoute {
  href: string;
  icon: LucideIcon;
  label: string;
}

/**
 * Primary dock navigation. Only Home stays as its own button; the three content
 * archives are grouped behind the dock's menu so the bar never outgrows the
 * screen. Hrefs are locale-relative and `label` is a key under `navbar`.
 */
export const DockRoutes: readonly NavbarRoute[] = [{ href: '/', icon: Home, label: 'home' }];

/**
 * The grouped routes that live inside the dock's dropdown menu. Each has its
 * own archive page, so they share one compact trigger instead of three buttons.
 */
export const MenuRoutes: readonly NavbarRoute[] = [
  { href: '/products', icon: ShoppingBag, label: 'products' },
  { href: '/projects', icon: FolderGit2, label: 'projects' },
  { href: '/blog', icon: NotebookText, label: 'blog' },
  { href: '/support', icon: Coffee, label: 'support' },
];

/**
 * Project slots on the home page. The dashboard caps how many projects can be
 * featured at this number, and the section fills any leftover slot with the
 * newest published project, so the row is never left half empty.
 */
export const HOME_PROJECT_SLOTS = 3;

/**
 * Product slots on the home page. Mirrors `HOME_PROJECT_SLOTS`: the dashboard
 * caps featured products here and the section backfills any open slot with the
 * newest published product.
 */
export const HOME_PRODUCT_SLOTS = 3;

/**
 * Blog slots on the home page. Same rule as projects and products: the featured
 * picks lead the row and the newest published posts backfill any open slot.
 */
export const HOME_BLOG_SLOTS = 3;

/**
 * Currencies the dashboard offers for a product price. The tuple is annotated
 * with `ProductCurrency` from `src/types`, so a code can only be added in one
 * place; zod's enum and the labels under the `pricing` namespace in the message
 * catalogues both have to keep up.
 */
export const PRODUCT_CURRENCIES = ['toman', 'rial', 'usd', 'eur', 'tether'] as [ProductCurrency, ...ProductCurrency[]];

/** ISO 4217 code for the `priceCurrency` field of the product structured data. */
export const PRODUCT_CURRENCY_CODES: Record<ProductCurrency, string> = {
  toman: 'IRT',
  rial: 'IRR',
  usd: 'USD',
  eur: 'EUR',
  tether: 'USDT',
};

/* ------------------------------------------------------------------
 * Buy-me-a-coffee / financial support
 * ------------------------------------------------------------------ */

/**
 * Support options on the home page. Same rule as projects, products and blog:
 * the dashboard caps the featured picks here and the section backfills any open
 * slot with the newest active option.
 */
export const HOME_SUPPORT_SLOTS = 3;

/** Supporters listed in the home-page strip before the full wall on `/support`. */
export const HOME_SUPPORTER_STRIP = 6;

/** Supporters rendered on `/support` before the “show more” control appears. */
export const SUPPORTER_PAGE_SIZE = 9;

/**
 * Every checkout surface the dashboard offers. The list backs the `<select>`,
 * zod's enum and the `support.modes` labels, so a mode can only be added here.
 */
export const DONATION_MODES = ['referral', 'link', 'card', 'crypto', 'gateway'] as [DonationMode, ...DonationMode[]];

/** Markets the option selector groups by; Iranian methods lead the Persian site. */
export const DONATION_REGIONS = ['ir', 'global'] as [DonationRegion, ...DonationRegion[]];

/** Creator-support platforms reachable by hand-off (`referral`). */
export const REFERRAL_PROVIDERS = [
  'buymeacoffee',
  'kofi',
  'patreon',
  'github',
  'liberapay',
  'hamyato',
] as [ReferralProvider, ...ReferralProvider[]];

/** Hosted checkout links (`link`). */
export const LINK_PROVIDERS = ['zarinpal', 'idpay', 'paypalme', 'stripe', 'other'] as [LinkProvider, ...LinkProvider[]];

/** Ledgers a crypto option can receive on (`crypto`). */
export const CRYPTO_NETWORKS = ['tron', 'ethereum', 'bitcoin', 'ton', 'bsc', 'lightning'] as [
  CryptoNetwork,
  ...CryptoNetwork[],
];

/** Gateways the site charges through itself (`gateway`). */
export const GATEWAY_IDS = ['zarinpal', 'idpay', 'stripe', 'paypal'] as [GatewayId, ...GatewayId[]];

/**
 * Currencies each gateway can actually charge in. The Iranian rails settle in
 * rial, so toman/rial are theirs alone; the international ones need a hard
 * currency. A mismatch is refused at checkout rather than silently converted.
 */
export const GATEWAY_CURRENCIES: Record<GatewayId, readonly ProductCurrency[]> = {
  zarinpal: ['toman', 'rial'],
  idpay: ['toman', 'rial'],
  stripe: ['usd', 'eur'],
  paypal: ['usd', 'eur'],
};

/** Support record lifecycle, in the order the dashboard filter lists them. */
export const SUPPORTER_STATUSES = ['pending', 'completed', 'failed', 'cancelled'] as [
  SupporterStatus,
  ...SupporterStatus[],
];

/** Longest supporter message stored and shown, so the wall stays scannable. */
export const SUPPORTER_MESSAGE_LIMIT = 280;

/**
 * Home-page ordering per locale: the Persian site leads with the local rails,
 * the English site with the international ones.
 */
export const REGION_ORDER: Record<AppLocale, readonly DonationRegion[]> = {
  fa: ['ir', 'global'],
  en: ['global', 'ir'],
};
