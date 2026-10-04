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
import { REGION_ORDER } from '@/constants/global';
import type {
  AppLocale,
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
    .replace( /^\s+/, '');
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

  const docs = await blogModel.find({ lang: locale, ...PUBLISHED }).sort({ createdAt: -1 }).lean();

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
 * Buy-me-a-coffee / financial support
 * ------------------------------------------------------------------ */

/**
 * Fill in whatever an older or externally-written document lacks. The page
 * renders `suggestedAmounts` and the amount directly, so both are defaulted here
 * rather than at every call site.
 */
function normalizeDonation(donation: IDonation): IDonation {
  const amounts = (donation.suggestedAmounts ?? []).filter(amount => Number.isFinite(amount) && amount > 0);

  return {
    ...donation,
    amount: Number.isFinite(donation.amount) ? donation.amount : 0,
    currency: donation.currency ?? 'toman',
    customAmount: donation.customAmount !== false,
    suggestedAmounts: amounts.length ? amounts : donation.amount > 0 ? [donation.amount] : [],
    minAmount: Number.isFinite(donation.minAmount) ? donation.minAmount : 0,
    maxAmount: Number.isFinite(donation.maxAmount) ? donation.maxAmount : 0,
    mode: donation.mode ?? 'referral',
    region: donation.region ?? 'global',
    recurring: Boolean(donation.recurring),
    cups: Math.min(Math.max(Number(donation.cups) || 1, 1), 12),
    order: Number.isFinite(donation.order) ? donation.order : 0,
    active: donation.active !== false,
    featured: Boolean(donation.featured),
  };
}

/**
 * Active support options for a locale: the dashboard's `order` first, then the
 * newest, and the locale's own market leads so the Persian site opens on the
 * Iranian rails.
 */
export async function getDonations(locale: AppLocale): Promise<IDonation[]> {
  if (!(await tryConnectDB())) return [];

  const docs = await donationModel.find({ lang: locale, active: true }).sort({ order: 1, createdAt: -1 }).lean();
  const items = serializeList<IDonation>(docs as Record<string, unknown>[]).map(normalizeDonation);

  const rank = REGION_ORDER[locale];
  return items.sort((a, b) => rank.indexOf(a.region) - rank.indexOf(b.region) || a.order - b.order);
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
  /** Confirmed gifts, whatever their rail. */
  supporters: number;
  /**
   * Total raised, but only while the confirmed gifts sit on one scale: a
   * toman/usd mix would add numbers that mean different things, so it is
   * reported as no total rather than a wrong one.
   */
  raised: number | null;
  currency: ProductCurrency | null;
}

/** Headline numbers for the support page and the home section. */
export async function getSupportStats(locale: AppLocale): Promise<SupportStats> {
  if (!(await tryConnectDB())) return { supporters: 0, raised: null, currency: null };

  const rows = await supporterModel
    .find({ lang: locale, status: 'completed' })
    .select({ amount: 1, currency: 1 })
    .lean();

  const currencies = new Set(rows.map(row => row.currency ?? 'toman'));
  const single = currencies.size === 1 ? (rows[0]?.currency ?? 'toman') : null;
  const raised = single ? rows.reduce((total, row) => total + (Number.isFinite(row.amount) ? row.amount : 0), 0) : null;

  return { supporters: rows.length, raised, currency: single };
}

export interface DonationProgress {
  /** Confirmed gifts that belong to this option, in its own currency only. */
  raised: number;
  /** How many supporters picked this option. */
  count: number;
}

/**
 * Per-option totals, for the progress bar and the “already bought” line.
 *
 * A gift counts toward the raised sum only while it is in the option's own
 * currency: adding a dollar gift to a toman goal would draw a bar that means
 * nothing. The count still includes every currency, because a supporter is a
 * supporter.
 */
export async function getDonationProgress(
  locale: AppLocale,
  options: IDonation[]
): Promise<Record<string, DonationProgress>> {
  if (!(await tryConnectDB()) || !options.length) return {};

  const rows = await supporterModel
    .find({ lang: locale, status: 'completed' })
    .select({ donationId: 1, amount: 1, currency: 1 })
    .lean();

  const byId = new Map(options.map(option => [String(option._id ?? ''), option]));
  const totals: Record<string, DonationProgress> = {};

  for (const row of rows) {
    const key = String(row.donationId ?? '');
    const option = byId.get(key);
    if (!option) continue;

    const entry = (totals[key] ??= { raised: 0, count: 0 });
    entry.count += 1;
    if ((row.currency ?? 'toman') === option.currency && Number.isFinite(row.amount)) {
      entry.raised += row.amount;
    }
  }

  return totals;
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
