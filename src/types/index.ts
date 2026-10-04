/** Shared domain types mirroring `src/models` schemas and API payloads. */

/** Locales supported by the site. */
export type AppLocale = 'fa' | 'en';

/**
 * Currencies a product price can be expressed in. The codes mirror
 * `PRODUCT_CURRENCIES` in `src/constants/global.ts`, which is the runtime list
 * the dashboard form and the API validator read from.
 */
export type ProductCurrency = 'toman' | 'rial' | 'usd' | 'eur' | 'tether';

/** External link attached to a project (demo, source, docs, ...). */
export interface IProjectLink {
  type: string;
  href: string;
  icon: string;
}

/** Site owner profile (one document per locale). */
export interface IProfile {
  _id?: string;
  name: string;
  fullName: string;
  jobTitle: string;
  description?: string;
  summary?: string;
  avatarUrl?: string;
  tel?: string;
  email?: string;
  lang: AppLocale;
}

/** Portfolio project shown on the home page and its details page. */
export interface IProject {
  _id?: string;
  title: string;
  /** URL segment for `/projects/[slug]`; falls back to `_id` when absent. */
  slug?: string;
  href: string;
  dates: string;
  active: boolean;
  /** Picked for the home page section; `active` still controls visibility. */
  featured?: boolean;
  description: string;
  /** Long-form Markdown body rendered on the details page. */
  details?: string;
  technologies: string[];
  links: IProjectLink[];
  image: string;
  lang: AppLocale;
}

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

/**
 * How a support option actually collects money. Every option is exactly one of
 * these, which is what keeps the checkout dialog honest: it only ever shows the
 * surface belonging to the option's own mode.
 *
 * - `referral`  — hand off to a creator-support platform (Buy Me a Coffee, Ko-fi, حمیاتو…)
 * - `link`      — a checkout page built in advance inside a gateway (ZarinPal/IDPay links, PayPal.me, Stripe link)
 * - `card`      — card-to-card: a card number and/or IBAN with a scannable QR
 * - `crypto`    — an on-chain address or Lightning destination with a QR
 * - `gateway`   — a full in-site checkout: the site calls the gateway API itself
 */
export type DonationMode = 'referral' | 'link' | 'card' | 'crypto' | 'gateway';

/** Market the option is aimed at: drives the order of the methods on the page. */
export type DonationRegion = 'ir' | 'global';

/** Creator-support platforms a `referral` option can point at. */
export type ReferralProvider = 'buymeacoffee' | 'kofi' | 'patreon' | 'github' | 'liberapay' | 'hamyato';

/** Hosted checkout links a `link` option can point at. */
export type LinkProvider = 'zarinpal' | 'idpay' | 'paypalme' | 'stripe' | 'other';

/** Gateways the site can talk to directly from `gateway` options. */
export type GatewayId = 'zarinpal' | 'idpay' | 'stripe' | 'paypal';

/** Ledgers a `crypto` option can receive on. */
export type CryptoNetwork = 'tron' | 'ethereum' | 'bitcoin' | 'ton' | 'bsc' | 'lightning';

/**
 * A support option (one coffee, ten coffees, a monthly pledge…). Created in the
 * dashboard, rendered on `/support` and inside the home-page section.
 */
export interface IDonation {
  _id?: string;
  title: string;
  /** URL-free identifier kept for analytics and stable ordering. */
  slug?: string;
  /** Short pitch under the title on the card. */
  description?: string;
  /** `0` means "the supporter chooses": the dialog starts on the amount step. */
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
  mode: DonationMode;
  region: DonationRegion;
  /** `referral` only. */
  referral?: ReferralProvider;
  /** `link` and `referral`: where the button leads. */
  href?: string;
  /** `link` only: which gateway the prepared link belongs to. */
  linkProvider?: LinkProvider;
  /** `card` only. Digits are stored without spaces. */
  card?: { number?: string; holder?: string; iban?: string };
  /** `card`: override for the QR payload; empty encodes the card number. */
  cardQrPayload?: string;
  /** `crypto` only. */
  crypto?: { network?: CryptoNetwork; address?: string };
  /** `gateway` only: which configured gateway charges the supporter. */
  gateway?: GatewayId;
  /** Optional funding target; when set the card shows a progress bar. */
  goal?: number;
  /** Repeat the gift every month, where the destination supports it. */
  recurring: boolean;
  /** Number of coffees the option represents — drawn as the cup row on the card. */
  cups: number;
  /** `false` keeps the option out of every public surface. */
  active: boolean;
  /** Picked for the home page section; `active` still controls visibility. */
  featured?: boolean;
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
  /** Option the gift was for; the id may one day be gone, so the title is stored too. */
  donationId?: string;
  donationTitle?: string;
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

/** Skill badge. */
export interface ISkill {
  _id?: string;
  name: string;
  lang: AppLocale;
}

/** Social media profile. */
export interface ISocial {
  _id?: string;
  name: string;
  url: string;
  icon: string;
  lang: AppLocale;
}

/** Professional work experience entry. */
export interface IWork {
  _id?: string;
  company?: string;
  href?: string;
  location?: string;
  title?: string;
  logoUrl?: string;
  /** ISO date or `YYYY/MM` string. */
  start?: string;
  /** ISO date or `YYYY/MM` string; empty means "present". */
  end?: string;
  description?: string;
  lang: AppLocale;
}

/** Education entry. */
export interface IEducation {
  _id?: string;
  school?: string;
  href?: string;
  degree?: string;
  logoUrl?: string;
  /** ISO date or `YYYY/MM` string. */
  start?: string;
  /** ISO date or `YYYY/MM` string. */
  end?: string;
  lang: AppLocale;
}

/** Blog post stored in MongoDB; `content` is Markdown. */
export interface IBlog {
  _id?: string;
  title: string;
  summary?: string;
  content?: string;
  slug: string;
  /** Cover image shown on the list, the article header and social cards. */
  image?: string;
  /** Free-form labels used for filtering and related posts. */
  tags?: string[];
  /** `false` keeps a post out of every public surface (legacy docs: published). */
  published?: boolean;
  /** Picked for the home page section; `published` still controls visibility. */
  featured?: boolean;
  lang: AppLocale;
  createdAt?: string;
  updatedAt?: string;
  /** Derived from `content`; never stored. */
  readingMinutes?: number;
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
 * What the checkout endpoint hands back, one shape per rail:
 *
 * - `external`   — leave for a platform or a prepared gateway link
 * - `instructions` — transfer it yourself; the QR and destination are included
 * - `redirect`   — a gateway session was created; send the supporter there
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

/** Aggregated payload consumed by the public site and `/api/[lang]`. */
export interface IPortfolioData {
  profile?: IProfile;
  educations: IEducation[];
  projects: IProject[];
  works: IWork[];
  socials: ISocial[];
  skills: ISkill[];
}
