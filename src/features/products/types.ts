import type { AppLocale, ProductCurrency } from '@/types';

/** Commercial product offered in the `/products` catalogue. */
export interface IProduct {
  _id?: string;
  title: string;
  /** URL segment for `/products/[slug]`; falls back to `_id` when absent. */
  slug?: string;
  /** Short summary shown on the catalogue card. */
  description: string;
  /** Long-form Markdown body rendered on the product page. */
  details?: string;
  image?: string;
  /** Single grouping label used by the catalogue filter. */
  category?: string;
  /** "What you get" bullets listed on the card and the product page. */
  features: string[];
  /** Amount in whole units of `currency`; `0` is rendered as "Free". */
  price: number;
  currency: ProductCurrency;
  /** `false` keeps the product public but marks it as not purchasable. */
  available: boolean;
  /** Checkout or sales page. */
  href?: string;
  /** `false` keeps the product out of every public surface. */
  active: boolean;
  /** Picked for the home page section; `active` still controls visibility. */
  featured?: boolean;
  lang: AppLocale;
  createdAt?: string;
  updatedAt?: string;
}
