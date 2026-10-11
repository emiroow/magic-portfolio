import { formatYearMonthLocal } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { ICertificate } from '@/features/certificate/types';

/**
 * Reading a credential's dates.
 *
 * The two sites store different calendars — the Persian month picker writes Jalali
 * `1403/07`, the English one Gregorian `2024/10` — so every comparison has to happen
 * inside the calendar the record was written in. Comparing a Jalali year against
 * `new Date().getFullYear()` would mark a credential that is valid for another two
 * years as lapsed, which is the one mistake a résumé cannot carry.
 */

/** A month in the calendar a record's dates are written in. */
interface Month {
  year: number;
  month: number;
}

/** `YYYY/MM`, the only shape the dashboard's month picker writes. */
const YEAR_MONTH = /^(\d{3,4})\/(\d{1,2})$/;

/** This locale's calendar, asked for Latin digits so the parts are plain numbers. */
function calendarFormat(locale: AppLocale) {
  return new Intl.DateTimeFormat(`en-US-u-ca-${locale === 'fa' ? 'persian' : 'gregory'}-nu-latn`, {
    year: 'numeric',
    month: '2-digit',
    timeZone: 'UTC',
  });
}

/**
 * The month a stored date names, in the record's own calendar, or `null` when it
 * carries none. A `YYYY/MM` string is already in that calendar; anything else is
 * parsed as a timestamp and converted into it.
 */
function monthOf(date: string | undefined, locale: AppLocale): Month | null {
  const raw = date?.trim();
  if (!raw) return null;

  const matched = raw.match(YEAR_MONTH);
  if (matched) {
    const month = Number(matched[2]);
    return month >= 1 && month <= 12 ? { year: Number(matched[1]), month } : null;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  const parts = calendarFormat(locale).formatToParts(parsed);
  const year = Number(parts.find(part => part.type === 'year')?.value);
  const month = Number(parts.find(part => part.type === 'month')?.value);
  return Number.isFinite(year) && Number.isFinite(month) ? { year, month } : null;
}

/** This month, in the same calendar the locale's records are written in. */
function currentMonth(locale: AppLocale): Month {
  const parts = calendarFormat(locale).formatToParts(new Date());
  return {
    year: Number(parts.find(part => part.type === 'year')?.value),
    month: Number(parts.find(part => part.type === 'month')?.value),
  };
}

/**
 * The credential's validity span: `March 2021 – March 2024`, or `March 2021 – No
 * expiration` for one that never lapses. An undated record yields nothing rather
 * than a stray separator.
 */
export function certificatePeriod(certificate: ICertificate, locale: AppLocale, noExpirationLabel: string): string {
  const from = formatYearMonthLocal(certificate.issueDate, locale);
  const to = certificate.expirationDate ? formatYearMonthLocal(certificate.expirationDate, locale) : from ? noExpirationLabel : '';
  return from && to ? `${from} – ${to}` : from || to;
}

/** Whether the credential's own end month has passed. One with no end month never does. */
export function isExpired(certificate: ICertificate, locale: AppLocale): boolean {
  const end = monthOf(certificate.expirationDate, locale);
  if (!end) return false;

  const now = currentMonth(locale);
  return end.year < now.year || (end.year === now.year && end.month < now.month);
}
