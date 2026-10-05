import { tryConnectDB } from '@/config/dbConnection';
import { blogModel } from '@/features/blog/model';
import { readingTime } from '@/lib/utils';
import { byLocaleOrder, serialize, serializeList } from '@/lib/serialize';
import type { AppLocale } from '@/types';
import type { IBlog } from '@/features/blog/types';

/** Drafts are excluded from every public surface; legacy documents have no flag. */
const PUBLISHED = { published: { $ne: false } };

/** Strip leading YAML front-matter (`--- ... ---`) from Markdown content. */
function stripFrontMatter(markdown?: string) {
  if (!markdown) return markdown;
  const text = markdown.replace(/^﻿/, '');
  if (!text.startsWith('---')) return markdown;

  const lines = text.split(String.fromCharCode(10));
  const end = lines.findIndex((line, index) => index > 0 && /^(---|\.\.\.)\s*$/.test(line));
  if (end === -1) return markdown;

  return lines
    .slice(end + 1)
    .join(String.fromCharCode(10))
    .replace(/^\s+/, '');
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
