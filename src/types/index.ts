/** Cross-domain types shared by more than one feature. Domain types live with their feature. */

/** Locales supported by the site. */
export type AppLocale = 'fa' | 'en';

/**
 * Currencies a price can be expressed in. Shared by the products catalogue and the
 * support methods, so it stays a cross-domain primitive. The codes mirror
 * `PRODUCT_CURRENCIES` in `src/constants/global.ts`, which is the runtime list the
 * dashboard form and the API validator read from.
 */
export type ProductCurrency = 'toman' | 'rial' | 'usd' | 'eur' | 'tether';
