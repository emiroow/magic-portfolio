import type { AppLocale } from '@/types';

/** Low-level helpers shared by every server-side data query. */

/** Convert BSON documents into plain JSON. */
export function serialize<T>(doc: Record<string, unknown> | null): T | null {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc)) as T;
}

export function serializeList<T>(docs: Record<string, unknown>[]): T[] {
  return docs.map(doc => serialize<T>(doc) as T);
}

/** Sorted in the active locale's collation, so Persian lists group sensibly. */
export function byLocaleOrder(locale: AppLocale) {
  return (a: string, b: string) => a.localeCompare(b, locale === 'fa' ? 'fa' : 'en');
}
