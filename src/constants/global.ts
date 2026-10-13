import { FolderGit2, HandHeart, Home, NotebookText, ShoppingBag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CryptoAsset, LanguageLevel, PriceUnit, ProductCurrency } from '@/types';

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
 *
 * The literal hrefs are kept (`as const`) because they double as the identity an
 * archive is looked up by in `SectionAvailability` below.
 */
export const MenuRoutes = [
  { href: '/products', icon: ShoppingBag, label: 'products' },
  { href: '/projects', icon: FolderGit2, label: 'projects' },
  { href: '/blog', icon: NotebookText, label: 'blog' },
  { href: '/support', icon: HandHeart, label: 'support' },
] as const satisfies readonly NavbarRoute[];

/** Every archive the dock can list, as the union its hrefs form. */
export type ArchiveHref = (typeof MenuRoutes)[number]['href'];

/**
 * Whether each archive has anything to show for one locale. An empty section is not a
 * destination, so the dock drops it — and the read behind this lives with the pages that
 * answer the same question (see `getSectionAvailability`).
 */
export type SectionAvailability = Record<ArchiveHref, boolean>;

/**
 * How many images one record may carry in its gallery. Products, projects and
 * posts all read the same ceiling: it bounds the zod schema, the dashboard
 * counter and the number of lightbox steps a reader is expected to click through.
 */
export const MAX_GALLERY_IMAGES = 8;

/**
 * A résumé upload is a document, not a picture: it is stored byte-for-byte and never
 * run through the image pipeline. These bound what the dashboard offers and what the
 * upload route accepts, so a huge or wrong-kind file is refused before it reaches
 * storage rather than after.
 */
export const RESUME_MAX_SIZE = 10 * 1024 * 1024; // 10 MB
export const RESUME_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/**
 * The proficiency a listed language can carry, least to most fluent. The tuple is
 * annotated with `LanguageLevel` from `src/types` the same way the currency lists are,
 * so a level can only be added in one place and the résumé's five-dot scale follows
 * automatically. `MAX_LANGUAGES` bounds the profile list so the sheet stays one page.
 */
export const LANGUAGE_LEVELS = ['beginner', 'intermediate', 'advanced', 'fluent', 'native'] as [LanguageLevel, ...LanguageLevel[]];
export const MAX_LANGUAGES = 6;

/**
 * Currencies the dashboard offers for a product price. The tuple is annotated
 * with `ProductCurrency` from `src/types`, so a code can only be added in one
 * place; zod's enum and the labels under the `pricing` namespace in the message
 * catalogues both have to keep up.
 *
 * A shop never quotes in coins, so this list stays the product one; support reads
 * the wider `SUPPORT_CURRENCIES` below.
 */
export const PRODUCT_CURRENCIES = ['toman', 'rial', 'usd', 'eur', 'tether'] as [ProductCurrency, ...ProductCurrency[]];

/**
 * Assets a crypto destination can receive, in the order the dashboard lists them.
 * Mirrors `CryptoAsset` in `src/types` the same way the list above mirrors its type.
 */
export const CRYPTO_ASSETS = ['tether', 'usdc', 'btc', 'eth', 'trx', 'ton', 'bnb'] as [CryptoAsset, ...CryptoAsset[]];

/** Every unit a support amount may be written in: national money first, then coins. */
export const SUPPORT_CURRENCIES = ['toman', 'rial', 'usd', 'eur', 'tether', 'usdc', 'btc', 'eth', 'trx', 'ton', 'bnb'] as [PriceUnit, ...PriceUnit[]];

/** ISO 4217 code for the `priceCurrency` field of the product structured data. */
export const PRODUCT_CURRENCY_CODES: Record<ProductCurrency, string> = {
  toman: 'IRT',
  rial: 'IRR',
  usd: 'USD',
  eur: 'EUR',
  tether: 'USDT',
};

/**
 * Codes for the support structured data. Coins have no ISO 4217 entry, so they are
 * named by the ticker a wallet uses; being exhaustive here is what keeps a new unit
 * from reaching the page without a code.
 */
export const SUPPORT_CURRENCY_CODES: Record<PriceUnit, string> = {
  ...PRODUCT_CURRENCY_CODES,
  usdc: 'USDC',
  btc: 'BTC',
  eth: 'ETH',
  trx: 'TRX',
  ton: 'TON',
  bnb: 'BNB',
};
