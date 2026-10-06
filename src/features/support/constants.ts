import type { AppLocale, CryptoAsset, ProductCurrency } from '@/types';
import type {
  CryptoNetwork,
  DonationMode,
  DonationRegion,
  GatewayId,
  SupportProvider,
  SupportVariant,
  SupporterStatus,
} from '@/features/support/types';

/* ------------------------------------------------------------------
 * Financial support
 * ------------------------------------------------------------------ */

/** Supporters rendered on `/support` before the “show more” control appears. */
export const SUPPORTER_PAGE_SIZE = 9;

/**
 * Every support method the dashboard offers. The list backs the method picker,
 * zod's enum and the `support.modes` labels, so a method can only be added here —
 * one entry, one card on `/support`, one checkout surface.
 *
 * The first four carry money; `action` carries a gesture instead (a star, a follow,
 * a bug report) and is the only method with no amount policy at all.
 */
export const DONATION_MODES = ['platform', 'card', 'crypto', 'gateway', 'action'] as [DonationMode, ...DonationMode[]];

/** Methods that actually move money; `action` is excluded, so nothing is ever charged for it. */
export const MONEY_MODES = DONATION_MODES.filter(mode => mode !== 'action') as [DonationMode, ...DonationMode[]];

/** Markets the method picker offers; Iranian rails lead the Persian site. */
export const DONATION_REGIONS = ['ir', 'global'] as [DonationRegion, ...DonationRegion[]];

/**
 * Services a destination can belong to. The support platforms are the paid
 * hand-offs — Buy Me a Coffee abroad, کافی‌بده at home — the gateways cover both a
 * prepared payment link and an in-site checkout, and the networks are the services
 * a free gesture is made on.
 *
 * A new service is one id added to this list plus its label in both catalogues.
 * `custom` already takes any URL and is named by the destination's own label, so
 * a service can be served before the code catches up with its name.
 */
export const SUPPORT_PROVIDERS = [
  'buymeacoffee',
  'coffeebede',
  'github',
  'patreon',
  'kofi',
  'zarinpal',
  'idpay',
  'stripe',
  'paypal',
  'youtube',
  'telegram',
  'twitter',
  'instagram',
  'linkedin',
  'custom',
] as [SupportProvider, ...SupportProvider[]];

/** Providers offered to a `platform` destination: the pages that take money for the owner. */
export const PLATFORM_PROVIDERS = ['buymeacoffee', 'coffeebede', 'github', 'patreon', 'kofi', 'custom'] as [SupportProvider, ...SupportProvider[]];

/** Providers offered to an `action` destination: the networks a gesture is made on. */
export const ACTION_PROVIDERS = ['github', 'youtube', 'telegram', 'twitter', 'instagram', 'linkedin', 'custom'] as [
  SupportProvider,
  ...SupportProvider[],
];

/** Providers offered to a `gateway` destination; each one needs credentials in the environment. */
export const GATEWAY_IDS = ['zarinpal', 'idpay', 'stripe', 'paypal'] as [GatewayId, ...GatewayId[]];

/**
 * Ledgers a crypto destination can receive on (`crypto`).
 *
 * The ledger is only half of the pair: what arrives is the asset, held next to it on the
 * destination. Both are stored and both are checked, because paying a token onto a chain
 * that cannot carry it is a loss and not a typo.
 */
export const CRYPTO_NETWORKS = ['tron', 'ethereum', 'bitcoin', 'ton', 'bsc', 'lightning'] as [CryptoNetwork, ...CryptoNetwork[]];

/**
 * Which ledgers can actually carry which asset.
 *
 * This is the whole answer to "USDT on what?" and "what lives on TRON?", so the form can
 * narrow each list against the other and the API can refuse a pair no wallet honours.
 * A new pairing is one line here plus, if the asset is new, its id in `CryptoAsset`, its
 * entry in `SUPPORT_CURRENCIES` and its label under `pricing`.
 */
export const CRYPTO_ASSET_NETWORKS: Record<CryptoAsset, readonly CryptoNetwork[]> = {
  tether: ['tron', 'ethereum', 'bsc', 'ton'],
  usdc: ['ethereum', 'bsc', 'tron'],
  btc: ['bitcoin', 'lightning'],
  eth: ['ethereum'],
  trx: ['tron'],
  ton: ['ton'],
  bnb: ['bsc'],
};

/** The ledgers an asset can arrive on; every one of them when nothing is picked yet. */
export function networksForAsset(asset: CryptoAsset | undefined, all: readonly CryptoNetwork[]): readonly CryptoNetwork[] {
  return asset ? CRYPTO_ASSET_NETWORKS[asset] : all;
}

/** The assets a ledger can hold; every one of them when nothing is picked yet. */
export function assetsForNetwork(network: CryptoNetwork | undefined, all: readonly CryptoAsset[]): readonly CryptoAsset[] {
  return network ? all.filter(asset => CRYPTO_ASSET_NETWORKS[asset].includes(network)) : all;
}

/**
 * What the card rail asks for, market by market.
 *
 * Inside Iran a transfer goes to a sixteen-digit card or a sheba, from a banking
 * application that reads neither a BIC nor a sort code. Abroad the same rail is a bank
 * transfer: an IBAN the owner's bank can be paid by, the SWIFT code that routes it, and
 * a card number only where the scheme really offers card-to-card. The fields a row shows
 * follow this, so an owner is never asked for a code their market ignores.
 */
export const CARD_MARKET_FIELDS: Record<DonationRegion, (keyof SupportVariant)[]> = {
  ir: ['number', 'iban', 'holder', 'qrPayload'],
  global: ['number', 'iban', 'bic', 'holder', 'qrPayload'],
};

/**
 * Destinations one method can carry. Twelve is well past what one block can show,
 * and a longer list means the method is really two methods.
 */
export const MAX_VARIANTS = 12;

/** Longest destination name, so a tile never wraps into a third line. */
export const MAX_VARIANT_LABEL = 40;

/** Longest per-destination instruction: one step, said in one sentence. */
export const MAX_VARIANT_INSTRUCTION = 160;

/** Longest wallet destination: a Lightning invoice is far longer than an address. */
export const MAX_CRYPTO_ADDRESS = 250;

/**
 * Currencies each gateway can actually charge in. The Iranian rails settle in
 * rial, so toman/rial are theirs alone; the international ones need a hard
 * currency. A mismatch is refused at checkout rather than silently converted.
 *
 * A gateway never settles in a coin, which is why these stay inside the product
 * currencies while the rest of the rail reads the wider `PriceUnit`.
 */
export const GATEWAY_CURRENCIES: Record<GatewayId, readonly ProductCurrency[]> = {
  zarinpal: ['toman', 'rial'],
  idpay: ['toman', 'rial'],
  stripe: ['usd', 'eur'],
  paypal: ['usd', 'eur'],
};

/** Support record lifecycle, in the order the dashboard filter lists them. */
export const SUPPORTER_STATUSES = ['pending', 'completed', 'failed', 'cancelled'] as [SupporterStatus, ...SupporterStatus[]];

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
