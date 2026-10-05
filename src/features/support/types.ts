import type { AppLocale, ProductCurrency } from '@/types';

/**
 * How a support method actually collects money — the four ways a gift can travel.
 *
 * The dashboard offers exactly one item per method, so a supporter never compares
 * three prices for the same act of giving. What the method can be paid *into* is a
 * list of destinations (`SupportVariant`), picked inside the checkout wizard.
 *
 * - `platform` — hand off to a support platform (Buy Me a Coffee, کافی‌بده) or a
 *                payment page prepared in a gateway
 * - `card`     — card-to-card: a card number and/or IBAN with a scannable QR
 * - `crypto`   — an on-chain address or Lightning destination with a QR
 * - `gateway`  — a full in-site checkout: the site calls the gateway API itself
 * - `action`   — no money at all: a gesture the supporter performs on another
 *                service (star a repository, follow a channel, file a bug report)
 *
 * `action` is the extension point for every kind of support that is not a payment.
 * It carries destinations like the link methods do, but no amount policy, so the
 * money rules of the four rails above never have to be re-asked for a new type.
 */
export type DonationMode = 'platform' | 'card' | 'crypto' | 'gateway' | 'action';

/** Market the method is aimed at: drives the order of the methods on the page. */
export type DonationRegion = 'ir' | 'global';

/**
 * Services a destination can belong to — the platform the supporter is sent to, the
 * gateway the site talks to, or the network a free gesture happens on.
 *
 * The support platforms are the paid hand-offs, `custom` is the escape hatch for a
 * service the owner adds without a code change, and the social networks are only
 * ever offered to an `action` destination. Which subset a mode may use is decided by
 * the lists in `src/features/support/constants.ts`, so one id can serve several methods.
 */
export type SupportProvider =
  | 'buymeacoffee'
  | 'coffeebede'
  | 'github'
  | 'patreon'
  | 'kofi'
  | 'zarinpal'
  | 'idpay'
  | 'stripe'
  | 'paypal'
  | 'youtube'
  | 'telegram'
  | 'twitter'
  | 'instagram'
  | 'linkedin'
  | 'custom';

/** Gateways the site can talk to directly from `gateway` methods. */
export type GatewayId = 'zarinpal' | 'idpay' | 'stripe' | 'paypal';

/**
 * Ledgers a crypto destination can receive on. A stablecoin is named by the chain
 * it moves on, which is the choice that actually decides whether the money lands:
 * the asset itself is spelled out in the destination's own label.
 */
export type CryptoNetwork = 'tron' | 'ethereum' | 'bitcoin' | 'ton' | 'bsc' | 'lightning';

/**
 * One destination of a payment method: a platform page, a card, a wallet address,
 * a gateway or the page a free gesture is made on. Which fields carry meaning
 * depends on the method's own `mode`, and the dashboard only ever shows the fields
 * of the mode the method uses.
 */
export interface SupportVariant {
  _id?: string;
  /** Stable identifier carried in the deep link and the checkout payload. */
  key: string;
  /** Display name; when empty the destination names itself from its service or ledger. */
  label?: string;
  /** `platform`, `gateway` and `action`: which service the destination belongs to. */
  provider?: SupportProvider;
  /** `platform` and `action`: the page the supporter is sent to. */
  href?: string;
  /** `platform` and `action`: the one step the supporter has to take there. */
  instruction?: string;
  /** `card` only: digits, stored without spaces. */
  number?: string;
  /** `card` only: IBAN (sheba), stored upper-case without spaces. */
  iban?: string;
  /** `card` only: name the account is in. */
  holder?: string;
  /** `card` only: override for the QR payload; empty encodes the card number. */
  qrPayload?: string;
  /** `crypto` only: the ledger the address lives on. */
  network?: CryptoNetwork;
  /** `crypto` only: address, `lnurl…` or Lightning destination. */
  address?: string;
  /** Set when this destination is priced in another unit than its method. */
  currency?: ProductCurrency;
  /** Set when this destination serves another market than its method. */
  region?: DonationRegion;
  /** `false` hides this destination without deleting it. */
  active: boolean;
}

/**
 * A support method the owner can be backed through: one method, its own conditions
 * (the amount policy, or the absence of one) and the destinations it can arrive at.
 * Created in the dashboard, rendered on `/support` and spent by the checkout endpoint.
 */
export interface IDonation {
  _id?: string;
  title: string;
  /** URL-free identifier kept for analytics and stable ordering. */
  slug?: string;
  /** One line under the title: what this method is good for. */
  description?: string;
  mode: DonationMode;
  /** The method's own market; a destination may override it. */
  region: DonationRegion;
  /** Where the money lands, in the order the supporter is shown them. */
  variants: SupportVariant[];
  /** `0` means "the supporter chooses": the wizard starts on the amount step. */
  amount: number;
  currency: ProductCurrency;
  /** Allow an amount the owner did not pre-set. */
  customAmount: boolean;
  /** Quick-pick amounts offered on the amount step; empty falls back to `amount`. */
  suggestedAmounts: number[];
  /** Smallest accepted amount; `0` defers to the site default. */
  minAmount: number;
  /** Largest accepted amount; `0` defers to the site default. */
  maxAmount: number;
  /** `false` keeps the method out of every public surface. */
  active: boolean;
  /** Position on `/support`; lower numbers lead. */
  order: number;
  lang: AppLocale;
  createdAt?: string;
  updatedAt?: string;
}

/** Lifecycle of a support record. */
export type SupporterStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

/**
 * One act of support: created when a visitor starts a checkout, confirmed by the
 * owner (or by the gateway callback). These records are what the supporter wall
 * on `/support` is built from.
 */
export interface ISupporter {
  _id?: string;
  /** Method the gift was for; the id may one day be gone, so the title is stored too. */
  donationId?: string;
  donationTitle?: string;
  /** Destination the supporter picked inside the method, kept for the receipt line. */
  variantKey?: string;
  variantLabel?: string;
  name?: string;
  /** `true` hides the name on the wall behind the anonymous label. */
  anonymous: boolean;
  /** Never published — only used for the "email me a receipt" note. */
  email?: string;
  /** Message left for the owner; shown on the wall when opted in and confirmed. */
  message?: string;
  amount: number;
  currency: ProductCurrency;
  mode: DonationMode;
  region?: DonationRegion;
  status: SupporterStatus;
  /** Gateway authority / tracking code / transaction hash / receipt description. */
  reference?: string;
  /** Gateway-side id used to match a callback back to this record. */
  externalId?: string;
  /** Owner's note when confirming a card-to-card transfer by hand. */
  note?: string;
  /** Show this supporter on the wall once the gift is confirmed. */
  showOnWall: boolean;
  lang: AppLocale;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * What the deployment can charge with, read by the dashboard so it can warn about
 * an option pointed at a gateway with no credentials.
 */
export interface SupportSettings {
  gateways: GatewayId[];
  currencyRules: Record<GatewayId, readonly ProductCurrency[]>;
}

/**
 * What the checkout endpoint hands back, one shape per method:
 *
 * - `external`     — leave for a support platform or a prepared payment page
 * - `instructions` — transfer it yourself; the QR and the destination are included
 * - `redirect`     — a gateway session was created; send the supporter there
 */
export type SupportCheckoutResult =
  | { kind: 'external'; orderId: string; url: string }
  | { kind: 'redirect'; orderId: string; url: string }
  | {
      kind: 'instructions';
      orderId: string;
      instruction: 'card' | 'crypto';
      /** PNG data URL generated on the server; `null` when the payload was unusable. */
      qr: string | null;
      card?: { number?: string; holder?: string; iban?: string };
      crypto?: { network?: CryptoNetwork; address?: string };
    };
