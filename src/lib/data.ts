import { tryConnectDB } from '@/config/dbConnection';
import { blogModel } from '@/models/blog';
import { donationModel } from '@/models/donation';
import { educationModel } from '@/models/education';
import { profileModel } from '@/models/profile';
import { productModel } from '@/models/product';
import { projectModel } from '@/models/project';
import { skillModel } from '@/models/skill';
import { socialModel } from '@/models/social';
import { supporterModel } from '@/models/supporter';
import { workModel } from '@/models/work';
import { readingTime } from '@/lib/utils';
import { handlesMoney, isOfferable, withUniqueKeys } from '@/lib/support';
import { CRYPTO_NETWORKS, DONATION_MODES, REGION_ORDER } from '@/constants/global';
import type {
  AppLocale,
  CryptoNetwork,
  DonationMode,
  IBlog,
  IDonation,
  IEducation,
  IProduct,
  IProfile,
  IProject,
  ISkill,
  ISocial,
  ISupporter,
  IWork,
  ProductCurrency,
  SupportProvider,
  SupportVariant,
} from '@/types';
import mongoose from 'mongoose';

/** Server-side data access layer. DB-safe: returns empty results when unreachable. */

/** Drafts are excluded from every public surface; legacy documents have no flag. */
const PUBLISHED = { published: { $ne: false } };

/** Convert BSON documents into plain JSON. */
function serialize<T>(doc: Record<string, unknown> | null): T | null {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc)) as T;
}

function serializeList<T>(docs: Record<string, unknown>[]): T[] {
  return docs.map(doc => serialize<T>(doc) as T);
}

/** Strip legacy `?cb=` cache-buster cruft from stored URLs. */
function cleanUrl(url?: string) {
  return url ? url.split('?')[0] : url;
}

/** Defensive cleanup for stored profile documents. */
function normalizeProfile(profile: IProfile | null): IProfile | null {
  if (!profile) return null;
  return { ...profile, avatarUrl: cleanUrl(profile.avatarUrl) };
}

/** Strip leading YAML front-matter (`--- ... ---`) from Markdown content. */
function stripFrontMatter(markdown?: string) {
  if (!markdown) return markdown;
  const text = markdown.replace(/^\uFEFF/, '');
  if (!text.startsWith('---')) return markdown;

  const lines = text.split(String.fromCharCode(10));
  const end = lines.findIndex((line, index) => index > 0 && /^(---|\.\.\.)\s*$/.test(line));
  if (end === -1) return markdown;

  return lines
    .slice(end + 1)
    .join(String.fromCharCode(10))
    .replace(/^\s+/, '');
}

export interface PortfolioData {
  profile: IProfile | null;
  projects: IProject[];
  works: IWork[];
  educations: IEducation[];
  skills: ISkill[];
  socials: ISocial[];
}

const EMPTY_PORTFOLIO: PortfolioData = {
  profile: null,
  projects: [],
  works: [],
  educations: [],
  skills: [],
  socials: [],
};

/** Load every public home-page section in one call (empty when DB unavailable). */
export async function getPortfolioData(locale: AppLocale): Promise<PortfolioData> {
  if (!(await tryConnectDB())) return EMPTY_PORTFOLIO;

  const [profile, projects, works, educations, skills, socials] = await Promise.all([
    profileModel.findOne({ lang: locale }).lean(),
    projectModel.find({ lang: locale }).sort({ createdAt: -1 }).lean(),
    workModel.find({ lang: locale }).sort({ start: -1 }).lean(),
    educationModel.find({ lang: locale }).sort({ start: -1 }).lean(),
    skillModel.find({ lang: locale }).sort({ name: 1 }).lean(),
    socialModel.find({ lang: locale }).lean(),
  ]);

  return {
    profile: normalizeProfile(serialize<IProfile>(profile as Record<string, unknown> | null)),
    projects: serializeList<IProject>(projects as Record<string, unknown>[]),
    works: serializeList<IWork>(works as Record<string, unknown>[]),
    educations: serializeList<IEducation>(educations as Record<string, unknown>[]),
    skills: serializeList<ISkill>(skills as Record<string, unknown>[]),
    socials: serializeList<ISocial>(socials as Record<string, unknown>[]),
  };
}

/** Public blog list (content stripped, reading time derived). */
export async function getBlogList(locale: AppLocale): Promise<IBlog[]> {
  if (!(await tryConnectDB())) return [];

  const docs = await blogModel
    .find({ lang: locale, ...PUBLISHED })
    .sort({ createdAt: -1 })
    .lean();

  return serializeList<IBlog>(docs as Record<string, unknown>[]).map(post => {
    const { content, ...rest } = post;
    return { ...rest, tags: post.tags ?? [], featured: Boolean(post.featured), readingMinutes: readingTime(content) };
  });
}

/** Every post for a locale, drafts included — the dashboard listing. */
export async function getAllPosts(locale: AppLocale): Promise<IBlog[]> {
  if (!(await tryConnectDB())) return [];

  const docs = await blogModel.find({ lang: locale }).sort({ createdAt: -1 }).lean();

  return serializeList<IBlog>(docs as Record<string, unknown>[]).map(post => ({
    ...post,
    tags: post.tags ?? [],
    readingMinutes: readingTime(post.content),
  }));
}

/** Distinct tags across the published posts, newest-first document order. */
export async function getBlogTags(locale: AppLocale): Promise<string[]> {
  if (!(await tryConnectDB())) return [];

  const tags = await blogModel.distinct('tags', { lang: locale, ...PUBLISHED });
  return (tags as string[]).filter(Boolean).sort(byLocaleOrder(locale));
}

/** Posts sharing a tag with `post`, falling back to the newest ones. */
export async function getRelatedPosts(locale: AppLocale, post: IBlog, limit = 3): Promise<IBlog[]> {
  const list = await getBlogList(locale);
  const others = list.filter(candidate => candidate.slug !== post.slug);
  const tags = new Set(post.tags ?? []);

  const shared = others.filter(candidate => (candidate.tags ?? []).some(tag => tags.has(tag)));
  return (shared.length ? shared : others).slice(0, limit);
}

/** Single blog post with full content, or `null` when not found. */
export async function getBlogBySlug(locale: AppLocale, slug: string): Promise<IBlog | null> {
  if (!(await tryConnectDB())) return null;

  const doc = await blogModel.findOne({ lang: locale, slug, ...PUBLISHED }).lean();
  const post = serialize<IBlog>(doc as Record<string, unknown> | null);
  return post ? { ...post, content: stripFrontMatter(post.content), tags: post.tags ?? [] } : null;
}

/** Active projects for a locale, newest first. */
export async function getProjects(locale: AppLocale): Promise<IProject[]> {
  if (!(await tryConnectDB())) return [];

  const docs = await projectModel.find({ lang: locale, active: true }).sort({ createdAt: -1 }).lean();
  return serializeList<IProject>(docs as Record<string, unknown>[]);
}

/**
 * One project by its slug, or by id for records seeded before slugs existed.
 * Only active projects are public.
 */
export async function getProjectByKey(locale: AppLocale, key: string): Promise<IProject | null> {
  if (!(await tryConnectDB())) return null;

  const byKey = key.trim();
  const or: Record<string, unknown>[] = [{ slug: byKey }];
  if (mongoose.isValidObjectId(byKey)) or.push({ _id: byKey });

  const doc = await projectModel.findOne({ lang: locale, active: true, $or: or }).lean();
  return serialize<IProject>(doc as Record<string, unknown> | null);
}

/** Distinct technologies across the active projects, for the archive filter. */
export async function getProjectTechnologies(locale: AppLocale): Promise<string[]> {
  if (!(await tryConnectDB())) return [];

  const tags = await projectModel.distinct('technologies', { lang: locale, active: true });
  return (tags as string[]).filter(Boolean).sort(byLocaleOrder(locale));
}

/** Sorted in the active locale's collation, so Persian chips group sensibly. */
function byLocaleOrder(locale: AppLocale) {
  return (a: string, b: string) => a.localeCompare(b, locale === 'fa' ? 'fa' : 'en');
}

/**
 * `.lean()` hands back stored documents as they are, so a record written outside
 * the dashboard can be missing a field the schema defaults. The catalogue
 * renders `features.length` and the price directly, so both get filled in here.
 */
function normalizeProduct(product: IProduct): IProduct {
  return {
    ...product,
    features: product.features ?? [],
    price: Number.isFinite(product.price) ? product.price : 0,
    currency: product.currency ?? 'usd',
    available: product.available !== false,
    featured: Boolean(product.featured),
  };
}

/** Published products for a locale, newest first. */
export async function getProducts(locale: AppLocale): Promise<IProduct[]> {
  if (!(await tryConnectDB())) return [];

  const docs = await productModel.find({ lang: locale, active: true }).sort({ createdAt: -1 }).lean();
  return serializeList<IProduct>(docs as Record<string, unknown>[]).map(normalizeProduct);
}

/**
 * One product by its slug, or by id for records saved without one. Only
 * published products are public.
 */
export async function getProductByKey(locale: AppLocale, key: string): Promise<IProduct | null> {
  if (!(await tryConnectDB())) return null;

  const byKey = key.trim();
  const or: Record<string, unknown>[] = [{ slug: byKey }];
  if (mongoose.isValidObjectId(byKey)) or.push({ _id: byKey });

  const doc = await productModel.findOne({ lang: locale, active: true, $or: or }).lean();
  const product = serialize<IProduct>(doc as Record<string, unknown> | null);
  return product ? normalizeProduct(product) : null;
}

/** Distinct categories across the published products, for the catalogue filter. */
export async function getProductCategories(locale: AppLocale): Promise<string[]> {
  if (!(await tryConnectDB())) return [];

  const categories = await productModel.distinct('category', { lang: locale, active: true });
  return (categories as string[]).filter(Boolean).sort(byLocaleOrder(locale));
}

/* ------------------------------------------------------------------
 * Financial support
 * ------------------------------------------------------------------ */

/**
 * A stored method, read before this release's shape was applied to it. Destinations
 * used to live in one field per mode, so the fold below keeps an existing database
 * payable instead of emptying the page.
 */
type StoredDonation = Omit<IDonation, 'mode' | 'variants'> & {
  mode?: DonationMode | 'referral' | 'link';
  variants?: SupportVariant[];
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
 * Fill in whatever a stored or externally-written document lacks, so the page and
 * the wizard can read a method without defending every field at every call site.
 * Exported because the admin list runs it too: what the dashboard edits has to be
 * what the public page shows.
 *
 * A method that takes no money also gets no money fields: zeroed here rather than
 * trusted at every surface that reads them.
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

  return {
    ...doc,
    mode,
    region: doc.region ?? 'global',
    currency: doc.currency ?? 'toman',
    // Keys are derived, never typed, so an old or hand-written row still resolves.
    variants: withUniqueKeys(
      mode,
      rows.map(variant => ({ ...variant, active: variant.active !== false }))
    ),
    amount: money && Number.isFinite(doc.amount) ? doc.amount : 0,
    customAmount: money && doc.customAmount !== false,
    suggestedAmounts: money ? (amounts.length ? amounts : Number.isFinite(doc.amount) && doc.amount > 0 ? [doc.amount] : []) : [],
    minAmount: money && Number.isFinite(doc.minAmount) ? doc.minAmount : 0,
    maxAmount: money && Number.isFinite(doc.maxAmount) ? doc.maxAmount : 0,
    order: Number.isFinite(doc.order) ? doc.order : 0,
    active: doc.active !== false,
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
  currency: ProductCurrency | null;
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

/** Profile document only (used by metadata/OG generation). */
export async function getProfile(locale: AppLocale): Promise<IProfile | null> {
  if (!(await tryConnectDB())) return null;

  const doc = await profileModel.findOne({ lang: locale }).lean();
  return normalizeProfile(serialize<IProfile>(doc as Record<string, unknown> | null));
}

/** Social links (used by the floating dock on every public page). */
export async function getSocials(locale: AppLocale): Promise<ISocial[]> {
  if (!(await tryConnectDB())) return [];

  const docs = await socialModel.find({ lang: locale }).lean();
  return serializeList<ISocial>(docs as Record<string, unknown>[]);
}
