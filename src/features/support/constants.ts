import type { AppLocale, ProductCurrency } from '@/types';
import type { CryptoNetwork, DonationMode, DonationRegion, GatewayId, SupportProvider, SupporterStatus } from '@/features/support/types';

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

/** Longest per-destination instruction: one step, said in one sentence. */
export const MAX_VARIANT_INSTRUCTION = 160;

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
