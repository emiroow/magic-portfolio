import type { AppLocale } from '@/types';

/** Social media profile. */
export interface ISocial {
  _id?: string;
  name: string;
  url: string;
  icon: string;
  lang: AppLocale;
}
