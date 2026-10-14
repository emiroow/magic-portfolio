import { formatYearMonthLocal } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IWork } from '@/features/experience/types';

/**
 * `March 2019 – May 2021`, or `February 2024 – Present` while the role is open.
 *
 * The separator sits between the two segments rather than travelling with the end date,
 * so an open role reads as a range instead of `February 2024Present`, and a role with no
 * dates at all yields nothing rather than a stray dash.
 *
 * The public timeline and the dashboard row both compose their period here: they render
 * the same record, so the two must not drift into disagreeing about what "no end month"
 * looks like.
 */
export function workPeriod(work: IWork, locale: AppLocale, presentLabel: string): string {
  const from = formatYearMonthLocal(work.start, locale);
  const to = formatYearMonthLocal(work.end, locale) || (work.start ? presentLabel : '');
  return from && to ? `${from} – ${to}` : from || to;
}
