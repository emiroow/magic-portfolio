import type { AppLocale } from '@/types';

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
