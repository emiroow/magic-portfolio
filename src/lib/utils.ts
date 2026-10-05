import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PERSIAN_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

/** Convert ASCII digits in a string to Persian digits. */
function toPersianDigits(input: string) {
  return input.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

/**
 * Format a date-ish string as locale "Month YYYY" (Jalali for fa).
 * Accepts `YYYY/MM` or ISO strings; e.g. "مهر ۱۴۰۳", "October 2024".
 */
export function formatYearMonthLocal(date: string | undefined, locale: 'fa' | 'en' = 'en'): string {
  if (!date) return '';

  // Calendar-style "YYYY/M[M]" input.
  const ym = date.match(/^(\d{3,4})\/(\d{1,2})$/);
  if (ym) {
    const year = Number(ym[1]);
    const month = Number(ym[2]);

    if (locale === 'fa' && month >= 1 && month <= 12) {
      return `${PERSIAN_MONTHS[month - 1]} ${toPersianDigits(String(year))}`;
    }

    const d = new Date(Date.UTC(year, Math.max(0, month - 1), 1));
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', timeZone: 'UTC' });
  }

  // Fall back to calendar-aware Intl formatting for anything Date accepts.
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  if (locale === 'fa') {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long' }).format(parsed);
  }
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(parsed);
}

/** Truncate a string on a word boundary and append an ellipsis. */
export function truncate(text: string | undefined, max = 160): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(' ', max))}…`;
}

/**
 * URL key for a detail page (`/projects/[key]`, `/products/[key]`): the slug, or
 * the document id for records saved before slugs existed.
 */
export function documentKey(item: { slug?: string; _id?: string }): string {
  return item.slug || item._id || '';
}

/**
 * Price in the locale's own digits and grouping, so a Persian catalogue never
 * shows `120000 تومان` next to `۰۳`. The caller supplies the currency label,
 * which lives in the message catalogues.
 */
export function formatPrice(value: number, locale: 'fa' | 'en' = 'en'): string {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { maximumFractionDigits: 2 }).format(value);
}

/** Estimate reading time in minutes (~200 words per minute). */
export function readingTime(text: string | undefined): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Display handle for a profile URL: `@emiroow` when the path exposes one,
 * otherwise the bare host (`example.com`). Path segments that only describe
 * the platform's URL scheme (`/in/…`, `/channel/…`) are skipped so LinkedIn
 * and YouTube resolve to the real account name.
 *
 * The result is capped to a tile-safe length and always rendered inside an
 * LTR run, so it stays readable and never clips inside the Persian layout.
 */
export function formatSocialHandle(url: string | undefined, max = 18): string {
  const raw = (url || '').trim();
  if (!raw) return '';

  const GENERIC_SEGMENTS = ['in', 'channel', 'channels', 'c', 'user', 'users', 'profile', 'me', 'p'];

  let host = '';
  let segment = '';

  try {
    const parsed = new URL(raw);
    host = parsed.hostname.replace(/^www\./, '');
    const segments = parsed.pathname.split('/').filter(Boolean);
    segment = segments.find(part => !GENERIC_SEGMENTS.includes(part.toLowerCase())) ?? '';
  } catch {
    const stripped = raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    const [first, ...rest] = stripped.split('/');
    host = first || '';
    segment = rest.find(part => !GENERIC_SEGMENTS.includes(part.toLowerCase())) ?? '';
  }

  // YouTube-style handles already carry the `@`; never double it.
  const handle = segment ? (segment.startsWith('@') ? segment : `@${decodeURIComponent(segment)}`) : host;
  return handle.length > max ? `${handle.slice(0, max - 1)}…` : handle;
}

/**
 * Host label for a link row: `example.com` without the `www.` prefix.
 * Falls back to the raw value when the stored URL cannot be parsed.
 */
export function linkHost(href: string | undefined): string {
  const raw = (href || '').trim();
  if (!raw) return '';

  try {
    return new URL(raw).hostname.replace(/^www\./, '');
  } catch {
    return raw.replace(/^https?:\/\//i, '').split('/')[0] ?? raw;
  }
}

/**
 * Normalise a phone number into a `tel:` payload: Persian/Arabic digits are
 * folded to ASCII and every separator except a leading `+` is dropped.
 */
export function toDialNumber(value: string | undefined): string {
  const raw = (value || '').trim();
  if (!raw) return '';

  const ascii = raw
    .replace(/[\u06F0-\u06F9]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[\u0660-\u0669]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

  const plus = ascii.startsWith('+') ? '+' : '';
  return plus + ascii.replace(/[^\d]/g, '');
}

/** Two-digit, locale-aware section ordinal (`01` / `۰۱`). */
export function sectionIndex(n: number, locale: 'fa' | 'en' = 'en'): string {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false,
  }).format(n);
}

/**
 * Count rendered in the active locale's digits, so Persian copy never shows
 * `2 مورد` next to `۰۳`. Safe to feed straight into a translation argument.
 */
export function localizedCount(n: number, locale: 'fa' | 'en' = 'en'): string {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { useGrouping: false }).format(n);
}

/**
 * URL segment from a title: lower-cased, spaces folded to dashes, Latin and
 * Persian letters plus digits kept, everything else dropped.
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Whether `next/image` may optimize a stored URL: same-site uploads live under
 * `/public`, Vercel Blob or the local dev origin (see `next.config.mjs`).
 * Anything else is rendered as a plain `<img>` instead of failing the page.
 */
export function isOptimizableImage(src: string | undefined): boolean {
  if (!src) return false;
  if (src.startsWith('/')) return true;

  try {
    const { hostname } = new URL(src);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.public.blob.vercel-storage.com');
  } catch {
    return false;
  }
}
