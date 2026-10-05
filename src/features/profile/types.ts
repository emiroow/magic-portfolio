import type { AppLocale } from '@/types';

/** Site owner profile (one document per locale). */
export interface IProfile {
  _id?: string;
  name: string;
  fullName: string;
  jobTitle: string;
  description?: string;
  summary?: string;
  avatarUrl?: string;
  tel?: string;
  email?: string;
  lang: AppLocale;
}
