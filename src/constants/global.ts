import { FolderGit2, Home, NotebookText, ShoppingBag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ProductCurrency } from '@/types';

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
