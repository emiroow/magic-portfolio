import { tryConnectDB } from '@/config/dbConnection';
import { donationModel } from '@/features/support/donation.model';
import { supporterModel } from '@/features/support/supporter.model';
import { handlesMoney, isOfferable, withUniqueKeys } from '@/features/support/variants';
import { CRYPTO_ASSET_NETWORKS, CRYPTO_NETWORKS, DONATION_MODES, REGION_ORDER } from '@/features/support/constants';
import { CRYPTO_ASSETS } from '@/constants/global';
import { serializeList } from '@/lib/serialize';
import type { AppLocale, CryptoAsset, PriceUnit } from '@/types';
import type { CryptoNetwork, DonationMode, IDonation, ISupporter, SupportProvider, SupportVariant } from '@/features/support/types';

/* ------------------------------------------------------------------
 * Financial support
 * ------------------------------------------------------------------ */

/**
 * A stored method, read before this release's shape was applied to it. Destinations
 * used to live in one field per mode, and the amount policy used to sit on the method
 * instead of on each destination — so the folds below keep an existing database
 * payable and priced correctly instead of emptying the page or resetting its amounts.
 */
type StoredDonation = Omit<IDonation, 'mode' | 'variants'> & {
  mode?: DonationMode | 'referral' | 'link';
  variants?: SupportVariant[];
  // Method-level amount policy, before it moved onto each destination. Read only to
  // migrate into the destinations; never carried onto the returned method.
  amount?: number;
  customAmount?: boolean;
  suggestedAmounts?: number[];
  minAmount?: number;
  maxAmount?: number;
  referral?: string;
  href?: string;
  linkProvider?: string;
  card?: { number?: string; holder?: string; iban?: string };
  cardQrPayload?: string;
  crypto?: { network?: string; address?: string };
  gateway?: string;
};

/** Services renamed or folded away; an unknown one becomes a custom destination. */
const PROVIDER_ALIASES: Record<string, SupportProvider> = {
  buymeacoffee: 'buymeacoffee',
  coffeebede: 'coffeebede',
  kofi: 'kofi',
  patreon: 'patreon',
  github: 'github',
  liberapay: 'custom',
  hamyato: 'custom',
  other: 'custom',
  zarinpal: 'zarinpal',
  idpay: 'idpay',
  stripe: 'stripe',
  paypal: 'paypal',
  paypalme: 'paypal',
};

/** Ledgers that were listed as coins; the address is kept, the name becomes a label. */
const NETWORK_LABELS: Record<string, string> = { tether: 'Tether (USDT)' };

/** The single destination an old document carried, in the shape the page expects. */
function legacyVariant(mode: DonationMode, doc: StoredDonation): SupportVariant | null {
  const trim = (value: unknown) => String(value ?? '').trim();

  if (mode === 'platform' || mode === 'action') {
    const href = trim(doc.href);
    if (!href) return null;
    const named = trim(doc.referral) || trim(doc.linkProvider);

    return { key: 'destination', provider: PROVIDER_ALIASES[named] ?? 'custom', href, active: true };
  }

  if (mode === 'card') {
    const number = trim(doc.card?.number);
    const iban = trim(doc.card?.iban);
    if (!number && !iban) return null;

    return { key: 'destination', number, iban, holder: trim(doc.card?.holder), qrPayload: trim(doc.cardQrPayload), active: true };
  }

  if (mode === 'crypto') {
    const address = trim(doc.crypto?.address);
    const network = trim(doc.crypto?.network);
    if (!address) return null;

    const ledger = (CRYPTO_NETWORKS as string[]).includes(network) ? network : undefined;

    return {
      key: 'destination',
      network: ledger as CryptoNetwork | undefined,
      address,
      label: ledger ? undefined : NETWORK_LABELS[network],
      active: true,
    };
  }

  const gateway = trim(doc.gateway);
  if (!gateway) return null;

  return { key: 'destination', provider: PROVIDER_ALIASES[gateway] ?? 'custom', active: true };
}

/**
 * The asset of a wallet stored before coin and ledger were kept side by side.
 *
 * Read off the unit the row was priced in — the one place an old document did write the
 * coin down, and the unit it inherits from its method counts here too — and off the
 * ledger where a single asset lives on it. Left unset when neither answers, so the
 * destination waits for its owner to name the coin instead of the site guessing a chain
 * and losing a supporter's money.
 */
function legacyAsset(variant: SupportVariant): CryptoAsset | undefined {
  const network = variant.network;
  if (!network || variant.asset) return variant.asset;

  const carried = CRYPTO_ASSETS.filter(asset => CRYPTO_ASSET_NETWORKS[asset].includes(network));
  const priced = carried.find(asset => asset === variant.currency);

  return priced ?? (carried.length === 1 ? carried[0] : undefined);
}

/**
 * Fill in whatever a stored or externally-written document lacks, so the page and
 * the wizard can read a method without defending every field at every call site.
 * Exported because the admin list runs it too: what the dashboard edits has to be
 * what the public page shows.
 *
 * The amount policy now belongs to each destination. A stored document that carried it
 * on the method has those values folded into every one of its money destinations here
 * (only where the destination names none of its own), so existing amounts, bounds and
 * currency survive the move to the destination level. A method that takes no money
 * gets no amount fields on its destinations at all.
 */
export function normalizeDonation(input: unknown): IDonation {
  const doc = input as StoredDonation;
  const amounts = (doc.suggestedAmounts ?? []).filter(amount => Number.isFinite(amount) && amount > 0);
  // `referral` and `link` were two names for leaving the site; both are `platform`.
  const named = doc.mode === 'referral' || doc.mode === 'link' ? 'platform' : doc.mode;
  // Anything this build does not know becomes the door that needs no credentials.
  const mode: DonationMode = named && (DONATION_MODES as string[]).includes(named) ? named : 'platform';
  const money = handlesMoney(mode);
  const stored = (doc.variants ?? []).filter(variant => variant && typeof variant === 'object');
  // A document from before destinations carried their rail in flat fields.
  const rows: SupportVariant[] = stored.length ? stored : [legacyVariant(mode, doc)].filter((variant): variant is SupportVariant => Boolean(variant));

  // The method's old amount policy, read only to migrate onto the destinations below.
  const legacyAmount = money && Number.isFinite(doc.amount) ? (doc.amount as number) : 0;
  const legacyCustom = money ? doc.customAmount !== false : false;
  const legacySuggested = money ? (amounts.length ? amounts : legacyAmount > 0 ? [legacyAmount] : []) : [];
  const legacyMin = money && Number.isFinite(doc.minAmount) ? (doc.minAmount as number) : 0;
  const legacyMax = money && Number.isFinite(doc.maxAmount) ? (doc.maxAmount as number) : 0;
  const fallbackCurrency = doc.currency ?? 'toman';

  // Give every money destination a full amount policy: its own values first, then the
  // method's old ones, so a destination that never set them still prices as before.
  const enriched: SupportVariant[] = rows.map(variant => {
    const base: SupportVariant = { ...variant, active: variant.active !== false };
    if (!money) return base;

    const inherited = base.currency || fallbackCurrency;
    // A wallet is priced in the coin it receives, so the asset answers the unit before any
    // stored currency can — and an old row that only named a currency gets its coin from it.
    const asset = mode === 'crypto' ? legacyAsset({ ...base, currency: inherited }) : undefined;

    return {
      ...base,
      ...(asset ? { asset } : {}),
      currency: asset || inherited,
      amount: variant.amount ?? legacyAmount,
      customAmount: variant.customAmount ?? legacyCustom,
      suggestedAmounts: variant.suggestedAmounts?.length ? variant.suggestedAmounts : legacySuggested,
      minAmount: variant.minAmount ?? legacyMin,
      maxAmount: variant.maxAmount ?? legacyMax,
    };
  });

  return {
    _id: doc._id,
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    mode,
    region: doc.region ?? 'global',
    // Kept only as the default a destination inherits; the destinations above already
    // carry a resolved currency of their own.
    currency: fallbackCurrency,
    // Keys are derived, never typed, so an old or hand-written row still resolves.
    variants: withUniqueKeys(mode, enriched),
    active: doc.active !== false,
    order: Number.isFinite(doc.order) ? (doc.order as number) : 0,
    lang: doc.lang,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Active support methods for a locale: the dashboard's `order` first, then the
 * newest, and the locale's own market leads so the Persian site opens on the
 * Iranian rails.
 *
 * A method with no complete destination is left out: the page it would appear on
 * could only ever open a wizard with nothing to choose.
 */
export async function getDonations(locale: AppLocale): Promise<IDonation[]> {
  if (!(await tryConnectDB())) return [];

  const docs = await donationModel.find({ lang: locale, active: true }).sort({ order: 1, createdAt: -1 }).lean();
  const items = serializeList<StoredDonation>(docs as Record<string, unknown>[])
    .map(method => normalizeDonation(method))
    .filter(isOfferable);

  const rank = REGION_ORDER[locale];
  return items.sort((a, b) => rank.indexOf(a.region) - rank.indexOf(b.region) || a.order - b.order);
}

/** Whether the locale has anything to support at all; the hero button asks this. */
export async function hasDonations(locale: AppLocale): Promise<boolean> {
  if (!(await tryConnectDB())) return false;

  const doc = await donationModel.findOne({ lang: locale, active: true }).select('_id').lean();
  return Boolean(doc);
}

/**
 * The supporter wall: confirmed gifts whose owner let them be shown. Anonymous
 * gifts still count, but their name is dropped here so it never reaches the
 * browser at all.
 */
export async function getSupporters(locale: AppLocale, limit = 60): Promise<ISupporter[]> {
  if (!(await tryConnectDB())) return [];

  const docs = await supporterModel
    .find({ lang: locale, status: 'completed', showOnWall: { $ne: false } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return serializeList<ISupporter>(docs as Record<string, unknown>[]).map(record => ({
    ...record,
    anonymous: Boolean(record.anonymous),
    name: record.anonymous ? '' : record.name || '',
  }));
}

export interface SupportStats {
  /** Confirmed gifts, whatever their method. */
  supporters: number;
  /**
   * Total raised, but only while the confirmed gifts sit on one scale: a
   * toman/usd mix would add numbers that mean different things, so it is
   * reported as no total rather than a wrong one.
   */
  raised: number | null;
  currency: PriceUnit | null;
}

/** Headline numbers for the support page. */
export async function getSupportStats(locale: AppLocale): Promise<SupportStats> {
  if (!(await tryConnectDB())) return { supporters: 0, raised: null, currency: null };

  const rows = await supporterModel.find({ lang: locale, status: 'completed' }).select({ amount: 1, currency: 1 }).lean();

  const currencies = new Set(rows.map(row => row.currency ?? 'toman'));
  const single = currencies.size === 1 ? (rows[0]?.currency ?? 'toman') : null;
  const raised = single ? rows.reduce((total, row) => total + (Number.isFinite(row.amount) ? row.amount : 0), 0) : null;

  return { supporters: rows.length, raised, currency: single };
}

/**
 * Confirmed supporters per method, keyed by method id.
 *
 * A card that says how many people already picked it is a fact the site can know;
 * amounts are not added up here, because gifts on different scales cannot be summed.
 */
export async function getSupporterCounts(locale: AppLocale, methods: IDonation[]): Promise<Record<string, number>> {
  if (!(await tryConnectDB()) || !methods.length) return {};

  const rows = await supporterModel.find({ lang: locale, status: 'completed' }).select({ donationId: 1 }).lean();

  const wanted = new Set(methods.map(method => String(method._id ?? '')));
  const counts: Record<string, number> = {};

  for (const row of rows) {
    const key = String(row.donationId ?? '');
    if (!wanted.has(key)) continue;

    counts[key] = (counts[key] ?? 0) + 1;
  }

  return counts;
}
