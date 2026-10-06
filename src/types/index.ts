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

/**
 * Coins and tokens a support destination can receive.
 *
 * An asset is what arrives, which is a different question from the ledger it travels
 * on: USDT moves over TRON, Ethereum, BNB Chain or TON, and Bitcoin arrives on-chain
 * or over Lightning. Naming both keeps a destination from being read as a guess.
 *
 * `tether` is the one id the catalogue above already holds, so a USDT price and a USDT
 * asset are the same word in the same message namespace.
 */
export type CryptoAsset = 'tether' | 'usdc' | 'btc' | 'eth' | 'trx' | 'ton' | 'bnb';

/**
 * Any unit a support amount can be written in: the money of a country or the coin of
 * a chain. Products stay inside `ProductCurrency`; only the support rails price in
 * coins, so the wider list never reaches a shop form.
 */
export type PriceUnit = ProductCurrency | CryptoAsset;
