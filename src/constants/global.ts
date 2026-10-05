import { FolderGit2, HandHeart, Home, NotebookText, ShoppingBag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  AppLocale,
  CryptoNetwork,
  DonationMode,
  DonationRegion,
  GatewayId,
  ProductCurrency,
  SupportProvider,
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
  { href: '/support', icon: HandHeart, label: 'support' },
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
 * Financial support
 * ------------------------------------------------------------------ */

/** Supporters rendered on `/support` before the “show more” control appears. */
export const SUPPORTER_PAGE_SIZE = 9;

/**
 * Every payment method the dashboard offers. The list backs the method picker,
 * zod's enum and the `support.modes` labels, so a method can only be added here —
 * one entry, one card on `/support`, one checkout surface.
 */
export const DONATION_MODES = ['platform', 'card', 'crypto', 'gateway'] as [DonationMode, ...DonationMode[]];

/** Markets the method picker offers; Iranian rails lead the Persian site. */
export const DONATION_REGIONS = ['ir', 'global'] as [DonationRegion, ...DonationRegion[]];

/**
 * Services a destination can belong to. The support platforms are the two the
 * section hands off to — Buy Me a Coffee abroad, کافی‌بده at home — and the
 * gateways cover both a prepared payment link and an in-site checkout.
 *
 * A new platform is one id added to this list plus its label in both catalogues.
 * `custom` already takes any URL and is named by the destination's own label, so
 * a service can be served before the code catches up with its name.
 */
export const SUPPORT_PROVIDERS = ['buymeacoffee', 'coffeebede', 'zarinpal', 'idpay', 'stripe', 'paypal', 'custom'] as [
  SupportProvider,
  ...SupportProvider[],
];

/** Providers offered to a `platform` destination. */
export const PLATFORM_PROVIDERS = ['buymeacoffee', 'coffeebede', 'custom'] as [SupportProvider, ...SupportProvider[]];

/** Providers offered to a `gateway` destination; each one needs credentials in the environment. */
export const GATEWAY_IDS = ['zarinpal', 'idpay', 'stripe', 'paypal'] as [GatewayId, ...GatewayId[]];

/**
 * Ledgers a crypto destination can receive on (`crypto`). A stablecoin is listed
 * under the chain it moves on, because the chain is the choice that decides
 * whether the money lands; the asset itself belongs in the destination's label.
 */
export const CRYPTO_NETWORKS = ['tron', 'ethereum', 'bitcoin', 'ton', 'bsc', 'lightning'] as [CryptoNetwork, ...CryptoNetwork[]];

/**
 * Destinations one method can carry. Twelve is well past what one block can show,
 * and a longer list means the method is really two methods.
 */
export const MAX_VARIANTS = 12;

/** Longest destination name, so a tile never wraps into a third line. */
export const MAX_VARIANT_LABEL = 40;

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
 * Page ordering per locale: the Persian site leads with the local rails, the
 * English site with the international ones.
 */
export const REGION_ORDER: Record<AppLocale, readonly DonationRegion[]> = {
  fa: ['ir', 'global'],
  en: ['global', 'ir'],
};
