import { tryConnectDB } from '@/config/dbConnection';
import { blogModel } from '@/models/blog';
import { educationModel } from '@/models/education';
import { profileModel } from '@/models/profile';
import { productModel } from '@/models/product';
import { projectModel } from '@/models/project';
import { skillModel } from '@/models/skill';
import { socialModel } from '@/models/social';
import { workModel } from '@/models/work';
import { readingTime } from '@/lib/utils';
import type { AppLocale, IBlog, IEducation, IProduct, IProfile, IProject, ISkill, ISocial, IWork } from '@/types';
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
