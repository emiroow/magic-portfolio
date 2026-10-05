import type { AppLocale } from '@/types';

/** Professional work experience entry. */
export interface IWork {
  _id?: string;
  company?: string;
  href?: string;
  location?: string;
  title?: string;
  logoUrl?: string;
  /** ISO date or `YYYY/MM` string. */
  start?: string;
  /** ISO date or `YYYY/MM` string; empty means "present". */
  end?: string;
  description?: string;
  lang: AppLocale;
}
